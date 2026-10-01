import { boolean, pgSchema, text, uuid } from "drizzle-orm/pg-core";

/**
 * Neon Auth's user table, declared here only so `profiles.id` can reference
 * it and so queries can join to it. NEON OWNS THIS TABLE: never migrate it.
 *
 * It lives in its own module on purpose. Drizzle Kit manages only the tables
 * exported from `./schema.ts`; importing this there (without re-exporting it)
 * gives the foreign key its target without Drizzle Kit ever trying to create
 * or alter `neon_auth.user`. Only the columns the app reads are listed.
 */
const neonAuth = pgSchema("neon_auth");

export const neonAuthUser = neonAuth.table("user", {
  id: uuid().primaryKey().notNull(),
  email: text().notNull(),
  name: text().notNull(),
  image: text(),
  // Better Auth's own camelCase column names. Read-only here: the community
  // verification rules count only votes from verified, unbanned accounts.
  emailVerified: boolean("emailVerified").notNull(),
  banned: boolean("banned"),
});
