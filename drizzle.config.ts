import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit owns the schema and its migrations from here on.
 *
 *   npm run db:generate   diff src/lib/db/schema.ts against the last snapshot
 *                         and write the next SQL file into drizzle/
 *   npm run db:migrate    apply pending drizzle/ migrations
 *
 * Uses the DIRECT connection: the pooled one runs PgBouncer in transaction
 * mode, which is fine for the app and wrong for DDL.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local (CI, Vercel) — the variables come from the environment.
}

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_UNPOOLED (or DATABASE_URL) is not set");

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
