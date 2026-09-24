"use server";

/**
 * Profile reads and writes for the signed-in traveller.
 *
 * Neon Auth owns identity (`neon_auth.user`: id, email, name, image). The app's
 * own fields — first/last name, phone, role — live in `public.profiles`, keyed
 * by the same id. Supabase created that row from a trigger on `auth.users`;
 * `neon_auth` is managed by Neon and takes no triggers from us, so the row is
 * created here on first read instead.
 *
 * These are Server Actions, i.e. public POST endpoints. Each one resolves the
 * user from the session cookie and touches only that user's row — never an id
 * supplied by the caller. That check is what RLS used to do.
 */

import { eq } from "drizzle-orm";

import type { Profile } from "@/types";

import { getDb, schema, type Db } from "@/lib/db";
import { profileSchema, type ProfileValues } from "./schemas";
import { getServerUser } from "./server";

type SessionUser = NonNullable<Awaited<ReturnType<typeof getServerUser>>>;

type ProfileRow = typeof schema.profiles.$inferSelect;

function splitName(name: string | null | undefined): [string | null, string | null] {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return [null, null];
  return [parts[0], parts.slice(1).join(" ") || null];
}

function toIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : String(value ?? new Date().toISOString());
}

function fromRow(row: ProfileRow): Profile {
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

/** Used when there is a session but no database to hold the profile row. */
function fromSession(user: SessionUser): Profile {
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

async function ensureProfile(user: SessionUser): Promise<Profile> {
  const db = getDb();
  if (!db) return fromSession(user);

  // The common case — the row exists — costs one read and no write.
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

/** The signed-in traveller's profile, or `null` when signed out. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getServerUser();
  if (!user) return null;
  try {
    return await ensureProfile(user);
  } catch (err) {
    console.warn("[profile] read failed, using session fields:", err);
    return fromSession(user);
  }
}

export interface SaveProfileResult {
  error: string | null;
  profile?: Profile;
}

/** Replace the signed-in traveller's editable profile fields. */
export async function saveProfile(values: ProfileValues): Promise<SaveProfileResult> {
  const user = await getServerUser();
  if (!user) return { error: "You need to be signed in to update your profile." };

  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Those details are not valid." };
  }

  const db = getDb();
  if (!db) return { error: "Profiles cannot be saved right now. Try again later." };

  const clean = (v: string | undefined) => v?.trim() || null;
  const next = parsed.data;

  try {
    await ensureProfile(user);
    // `role` is deliberately not settable here: a traveller must never be
    // able to promote themselves. Supabase enforced that with a trigger.
    const [row] = await db
      .update(schema.profiles)
      .set({
        first_name: clean(next.firstName),
        last_name: clean(next.lastName),
        phone: clean(next.phone),
        avatar_url: clean(next.avatarUrl),
      })
      .where(eq(schema.profiles.id, user.id))
      .returning();
    return row
      ? { error: null, profile: fromRow(row) }
      : { error: "Your profile could not be found." };
  } catch (err) {
    console.error("[profile] save failed:", err);
    return { error: "Could not save your profile. Try again in a moment." };
  }
}
