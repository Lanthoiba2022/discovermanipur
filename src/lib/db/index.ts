import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as relations from "./relations";
import * as schema from "./schema";

/**
 * Neon (Lakebase Postgres) access for Server Components, Route Handlers and
 * Server Actions, through Drizzle on a node-postgres pool. Server-only: it
 * reads `DATABASE_URL`, which carries the owner password, so it must never be
 * imported into a client component.
 *
 * Nothing in here throws at import time. The whole app must build and run with
 * no database configured — callers get `null` from `getDb()` and fall back to
 * the bundled seed data.
 *
 * There is no Row Level Security in front of these queries: the app connects
 * as the table owner, so every WHERE that RLS used to add implicitly (active
 * homestays, approved testimonials, the signed-in user's own rows) has to be
 * written into the query. Keep that in mind when adding one.
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
  });
  // An idle client dropping (e.g. compute scaling to zero) emits on the pool;
  // unhandled, that event would crash the process.
  pool.on("error", (err) => console.warn("[db] idle client error:", err.message));
  attachDatabasePool(pool);

  // Reuse across hot reloads in dev instead of leaking a pool per edit.
  globalForDb.yeningDb = drizzle({ client: pool, schema: fullSchema });
  return globalForDb.yeningDb;
}

export { schema };
