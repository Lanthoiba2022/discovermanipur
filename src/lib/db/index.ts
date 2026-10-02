import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { logDbWarn } from "@/lib/log";

import * as relations from "./relations";
import * as schema from "./schema";

/**
 * Neon (Lakebase Postgres) access for Server Components, Route Handlers and
 * Server Actions, through Drizzle on a node-postgres pool. Server-only: it
 * reads `DATABASE_URL`, which carries the owner password, so it must never be
 * imported into a client component.
 *
 * Nothing in here throws at import time. The whole app must build and run with
 * no database configured: callers get `null` from `getDb()` and fall back to
 * the bundled seed data.
 *
 * There is no Row Level Security in front of these queries: the app connects
 * as the table owner, so every visibility WHERE (active homestays, approved
 * testimonials, the signed-in user's own rows) has to be written into the
 * query. Keep that in mind when adding one.
 */

const rawUrl = process.env.DATABASE_URL?.trim() ?? "";

function isUsable(value: string) {
  if (!value) return false;
  // Guard against placeholder values copied straight out of .env.example.
  return /^postgres(ql)?:\/\//i.test(value) && !/(your|changeme|replace|todo|xxx)/i.test(value);
}

export const isDatabaseConfigured = isUsable(rawUrl);

const fullSchema = { ...schema, ...relations };
export type Db = NodePgDatabase<typeof fullSchema>;

const globalForDb = globalThis as unknown as { yeningDb?: Db };

/** The shared Drizzle instance, or `null` when no database is configured. */
export function getDb(): Db | null {
  if (!isDatabaseConfigured) return null;
  if (globalForDb.yeningDb) return globalForDb.yeningDb;

  const pool = new Pool({
    connectionString: rawUrl,
    // Neon's pooler fronts this, so a small per-instance pool is plenty and
    // keeps parallel static-generation workers from crowding the endpoint.
    max: 5,
    idleTimeoutMillis: 5_000,
    // Timeouts, so a stalled connection fails fast enough for the caller's
    // fallback (seed content, a "try again" message) to run, instead of the
    // request hanging until the function's maxDuration.
    //
    // Opening a connection: a suspended Neon compute usually wakes in 1-3 s,
    // so 8 s covers a cold start with margin.
    connectionTimeoutMillis: 8_000,
    // One query, measured by the client: the slowest legitimate read is a
    // whole catalogue table (well under a second when warm). On expiry pg
    // rejects the query; the server may finish it, which is harmless for the
    // reads and single-row writes this app makes.
    query_timeout: 15_000,
    // Shows in Neon's pg_stat_activity and query monitoring, so this app's
    // sessions are distinguishable from the console, psql and scripts.
    // PgBouncer tracks application_name natively, so the -pooler endpoint
    // accepts it.
    application_name: "discover-manipur",
    // Deliberately NOT set: statement_timeout and
    // idle_in_transaction_session_timeout. node-postgres sends those as
    // startup parameters (node_modules/pg/lib/client.js, getStartupConf), and
    // Neon's PgBouncer pooler can reject unknown startup parameters, which
    // would fail every connection. If a server-side limit is ever needed, set
    // it on the role instead (`alter role ... set statement_timeout = ...`).
  });
  // An idle client dropping (e.g. compute scaling to zero) emits on the pool;
  // unhandled, that event would crash the process.
  pool.on("error", (err) => logDbWarn("db.pool", err, { event: "idle-client-error" }));
  attachDatabasePool(pool);

  // Reuse across hot reloads in dev instead of leaking a pool per edit.
  globalForDb.yeningDb = drizzle({ client: pool, schema: fullSchema });
  return globalForDb.yeningDb;
}

export { schema };
