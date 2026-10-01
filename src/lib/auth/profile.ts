"use server";

/**
 * Profile reads and writes for the signed-in traveller.
 *
 * Neon Auth owns identity (`neon_auth.user`: id, email, name, image). The app's
 * own fields (first/last name, phone, role) live in `public.profiles`, keyed
 * by the same id. `neon_auth` is managed by Neon and takes no triggers from
 * us, so the row is created on first read (`ensureProfile` in `./dal`).
 *
 * These are Server Actions, i.e. public POST endpoints. Each one resolves the
 * user from the session cookie and touches only that user's row, never an id
 * supplied by the caller. There is no row-level security behind the query, so
 * that check is the only thing keeping one traveller out of another's row.
 */

import { eq } from "drizzle-orm";

import type { Profile } from "@/types";

import { getDb, schema } from "@/lib/db";
import { ensureProfile, fromRow, getSessionProfile } from "./dal";
import { profileSchema, type ProfileValues } from "./schemas";
import { getServerUser } from "./server";

/** The signed-in traveller's profile, or `null` when signed out. */
export async function getCurrentProfile(): Promise<Profile | null> {
  return getSessionProfile();
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
    // able to promote themselves.
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
