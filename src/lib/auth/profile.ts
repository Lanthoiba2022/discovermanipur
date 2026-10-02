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
import { cookies } from "next/headers";

import type { Profile } from "@/types";

import { getDb, schema } from "@/lib/db";
import { logDbError } from "@/lib/log";
import { ensureProfile, fromRow, getSessionProfile } from "./dal";
import { isAuthConfigured } from "./env";
import { profileSchema, type ProfileValues } from "./schemas";
import { getServerUser, hasSessionCookie } from "./server";
import {
  SESSION_HINT_CLEAR_OPTIONS,
  SESSION_HINT_COOKIE,
  SESSION_HINT_OPTIONS,
  SESSION_HINT_VALUE,
} from "./session-hint";

/**
 * The signed-in traveller's profile, or `null` when signed out. Also keeps the
 * browser's "probably signed in" hint (`./session-hint`) in step with what it
 * found, so a stale hint heals itself on the next check.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const profile = await getSessionProfile();
  await syncSessionHint(profile !== null);
  return profile;
}

/**
 * Set or clear the hint cookie, and only when its state is wrong: setting a
 * cookie in a Server Action makes Next.js re-render the current route in the
 * same response, so writing it on every call would turn each session check
 * into a page render. In practice it changes once per sign-in or sign-out.
 *
 * Cleared only when there is no profile AND the request carries no session
 * token cookie. A token whose check failed (a Neon Auth hiccup, an expired
 * session whose cookie Neon is about to delete) leaves the hint alone, so the
 * browser keeps asking and recovers on its own instead of showing a real user
 * the signed-out UI on every page until they visit `/account`.
 *
 * Not exported, so it is not a Server Action endpoint of its own. Best-effort:
 * a cookie store that cannot be written here must never fail the session read.
 */
async function syncSessionHint(signedIn: boolean): Promise<void> {
  if (!isAuthConfigured) return;
  try {
    const jar = await cookies();
    const hinted = jar.has(SESSION_HINT_COOKIE);
    if (signedIn && !hinted) {
      jar.set(SESSION_HINT_COOKIE, SESSION_HINT_VALUE, SESSION_HINT_OPTIONS);
    } else if (!signedIn && hinted && !(await hasSessionCookie())) {
      jar.set(SESSION_HINT_COOKIE, "", SESSION_HINT_CLEAR_OPTIONS);
    }
  } catch (err) {
    console.warn("[auth] could not update the session hint:", err instanceof Error ? err.message : String(err));
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
    logDbError("profile.save", err);
    return { error: "Could not save your profile. Try again in a moment." };
  }
}
