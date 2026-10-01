/**
 * Data access layer for the session: the one place server code asks "who is
 * this, and what may they do?".
 *
 * Not a `"use server"` module on purpose: every export of one becomes a public
 * POST endpoint. These helpers are imported by Server Components, Server
 * Actions and Route Handlers; `./profile` re-exposes only what the browser
 * needs.
 *
 * Every protected page calls `requireRole` itself. A check in a layout is not
 * enough: layouts do not re-render on client navigation, and a layout hiding
 * `{children}` does not stop the page from rendering into the RSC payload.
 */

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";

import type { Profile, UserRole } from "@/types";

import { getDb, schema, type Db } from "@/lib/db";
import { isAuthConfigured } from "./env";
import { getServerUser } from "./server";

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getServerUser>>>;

type ProfileRow = typeof schema.profiles.$inferSelect;

function splitName(name: string | null | undefined): [string | null, string | null] {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return [null, null];
  return [parts[0], parts.slice(1).join(" ") || null];
}

function toIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : String(value ?? new Date().toISOString());
}

export function fromRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name ?? undefined,
    lastName: row.last_name ?? undefined,
    phone: row.phone ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    role: row.role,
    createdAt: toIso(row.created_at),
  };
}

/**
 * Used when there is a session but no database to hold the profile row. Always
 * the `user` role: without the row there is nothing that could grant more.
 */
export function fromSession(user: SessionUser): Profile {
  const [firstName, lastName] = splitName(user.name);
  return {
    id: user.id,
    email: user.email,
    firstName: firstName ?? undefined,
    lastName: lastName ?? undefined,
    avatarUrl: user.image ?? undefined,
    role: "user",
    createdAt: toIso(user.createdAt),
  };
}

const findProfile = async (db: Db, id: string) =>
  (await db.select().from(schema.profiles).where(eq(schema.profiles.id, id)).limit(1))[0];

/**
 * The profile row for a session user, created on first read. Neon Auth owns
 * `neon_auth.user` and takes no triggers from us, so the row cannot be created
 * at sign-up.
 */
export async function ensureProfile(user: SessionUser): Promise<Profile> {
  const db = getDb();
  if (!db) return fromSession(user);

  // The common case (the row exists) costs one read and no write.
  const existing = await findProfile(db, user.id);
  if (existing) return fromRow(existing);

  const [firstName, lastName] = splitName(user.name);
  const [created] = await db
    .insert(schema.profiles)
    .values({
      id: user.id,
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      avatar_url: user.image ?? null,
    })
    .onConflictDoNothing()
    .returning();
  if (created) return fromRow(created);

  // A concurrent first read created it between our read and insert.
  const raced = await findProfile(db, user.id);
  return raced ? fromRow(raced) : fromSession(user);
}

/**
 * The signed-in traveller's profile, or `null` when signed out. Memoised per
 * request, so a layout and its page share one session read and one row read.
 *
 * The role is read from `public.profiles` on every request rather than carried
 * in the cookie, so a demotion takes effect on the very next request.
 */
export const getSessionProfile = cache(async (): Promise<Profile | null> => {
  const user = await getServerUser();
  if (!user) return null;
  try {
    return await ensureProfile(user);
  } catch (err) {
    console.warn("[auth] profile read failed, using session fields:", err);
    return fromSession(user);
  }
});

/** Which protected area a denial came from (picks the copy on `/access-denied`). */
export type ProtectedArea = "admin" | "host";

/**
 * The signed-in profile, if its role is in `roles`; otherwise this never
 * returns. Signed out → `/auth?next=<path>`. Signed in with the wrong role, or
 * no sign-in server on this deployment → `/access-denied`.
 *
 * `path` is the page's own URL, so sign-in can bring the visitor back to it.
 */
export async function requireRole(
  roles: readonly UserRole[],
  { area, path }: { area: ProtectedArea; path: string },
): Promise<Profile> {
  // Without Neon Auth the server cannot see the browser-only development session.
  // Sending the visitor to /auth would bounce straight back here (the form
  // sees a local user and follows `next`), so explain instead.
  if (!isAuthConfigured) redirect(`/access-denied?area=${area}&reason=unavailable`);

  const profile = await getSessionProfile();
  if (!profile) redirect(`/auth?next=${encodeURIComponent(path)}`);
  if (!roles.includes(profile.role)) redirect(`/access-denied?area=${area}`);
  return profile;
}
