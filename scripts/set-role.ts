/**
 * Grant or remove a role.
 *
 *   npm run db:set-role -- <email> <user|host|admin> --confirm-host=<host>
 *
 * Without `--confirm-host` it prints the target host and database and exits
 * without connecting (see `confirmTarget`).
 *
 * Nobody can promote themselves: the app never writes `profiles.role`. Every
 * role change, including granting `host`, goes through this script. It takes
 * effect on the person's next request. The role
 * is read from this table every time, not carried in their session cookie.
 *
 * The profile row is created the first time someone signs in, so they need to
 * have signed in once before this can find them. Connects as the database
 * owner (an operator script, never imported by the app).
 */

import pg from "pg";

const ROLES = ["user", "host", "admin"] as const;
type Role = (typeof ROLES)[number];

const args = process.argv.slice(2);
const [email, role] = args.filter((arg) => !arg.startsWith("--"));

if (!email || !ROLES.includes(role as Role)) {
  console.error("Usage: npm run db:set-role -- <email> <user|host|admin> --confirm-host=<host>");
  process.exit(1);
}

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is not set (expected in .env.local).");
  process.exit(1);
}

/**
 * Refuse to write to a database the operator did not name on the command line.
 *
 * `.env.local` usually holds the PRODUCTION connection string, so running this
 * script by habit, or from shell history, would write to production. Print the
 * target (host and database only, never the user or password) and stop unless
 * the same host was passed as `--confirm-host=<host>`.
 */
function confirmTarget(connectionString: string): void {
  let target: URL;
  try {
    target = new URL(connectionString);
  } catch {
    console.error("DATABASE_URL is not a valid connection URL.");
    process.exit(1);
  }
  const host = target.hostname;
  const database = decodeURIComponent(target.pathname.replace(/^\//, "")) || "(default)";
  console.log(`Target: ${host}/${database}`);

  if (!args.includes(`--confirm-host=${host}`)) {
    console.error(
      "Refusing to change a role without confirming the target. If this is the database you mean, run:\n" +
        `  npm run db:set-role -- <email> <role> --confirm-host=${host}`,
    );
    process.exit(1);
  }
}

confirmTarget(url);

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const { rows } = await client.query<{ email: string; role: Role }>(
    "update public.profiles set role = $2 where lower(email) = lower($1) returning email, role",
    [email.trim(), role],
  );
  if (rows.length === 0) {
    console.error(`No profile for ${email}. They need to sign in once first.`);
    process.exitCode = 1;
  } else {
    for (const row of rows) console.log(`${row.email} is now ${row.role}.`);
  }
} finally {
  await client.end();
}
