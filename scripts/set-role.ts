/**
 * Grant or remove a role.
 *
 *   npm run db:set-role -- <email> <user|host|admin>
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

const [email, role] = process.argv.slice(2);

if (!email || !ROLES.includes(role as Role)) {
  console.error("Usage: npm run db:set-role -- <email> <user|host|admin>");
  process.exit(1);
}

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is not set (expected in .env.local).");
  process.exit(1);
}

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
