import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit owns the schema and its migrations from here on.
 *
 *   npm run db:generate   diff src/lib/db/schema.ts against the last snapshot
 *                         and write the next SQL file into drizzle/
 *   npm run db:migrate    apply pending drizzle/ migrations
 *
 * Uses DATABASE_URL, the pooled connection, like the app. Neon's pooler runs
 * PgBouncer in transaction mode; Drizzle applies each migration inside one
 * transaction, so that is fine. If a migration ever needs session state
 * (`SET`, advisory locks, `CREATE INDEX CONCURRENTLY`) and fails oddly, run it
 * once with the direct URL instead:
 *   DATABASE_URL="<direct url, pooling off>" npm run db:migrate
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local (CI, Vercel) — the variables come from the environment.
}

/**
 * Without DATABASE_URL, fall back to a placeholder instead of throwing, so
 * `npm run db:generate` works on a machine with no database (a fork, CI, a
 * contributor checking a schema change). Generate never connects: it only
 * diffs schema.ts against the snapshots in drizzle/meta. Every other command
 * (migrate, push, studio) fails to connect to the placeholder, which is the
 * right outcome.
 */
const PLACEHOLDER_URL = "postgres://localhost:5432/generate-only";

const url = process.env.DATABASE_URL?.trim() || PLACEHOLDER_URL;
if (url === PLACEHOLDER_URL) {
  console.warn(
    "[drizzle.config] DATABASE_URL is not set: only `npm run db:generate` works without a database.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
  // Only the app's tables. `neon_auth` belongs to Neon Auth, and
  // `schema_migrations` is the ledger of the pre-Drizzle SQL runner.
  schemaFilter: ["public"],
  tablesFilter: ["!schema_migrations"],
  // Keep the database's snake_case names as the TypeScript keys, so the row
  // mappers in src/lib/data read the same property names they always have.
  introspect: { casing: "preserve" },
  strict: true,
  verbose: true,
});
