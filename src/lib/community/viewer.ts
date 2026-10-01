/**
 * Who is looking, as the community rules see them. Server-only.
 *
 * "Verified" is read from Neon Auth's own user row (`emailVerified`, `banned`)
 * on every request, not from the session cookie, so a ban or a revoked
 * verification takes effect immediately.
 */

import { eq } from "drizzle-orm";
import { cache } from "react";

import { getSessionProfile } from "@/lib/auth/dal";
import { getDb } from "@/lib/db";
import { neonAuthUser } from "@/lib/db/neon-auth";

import type { CommunityViewer } from "./types";

export function displayName(person: { first_name?: string | null; last_name?: string | null; email: string }) {
  return [person.first_name, person.last_name].filter(Boolean).join(" ").trim() || person.email.split("@")[0];
}

/** The signed-in viewer, or `null` when signed out or there is no database. Memoised per request. */
export const getCommunityViewer = cache(async (): Promise<CommunityViewer | null> => {
  const profile = await getSessionProfile();
  if (!profile) return null;
  const db = getDb();
  if (!db) return null;

  const [account] = await db
    .select({ emailVerified: neonAuthUser.emailVerified, banned: neonAuthUser.banned })
    .from(neonAuthUser)
    .where(eq(neonAuthUser.id, profile.id))
    .limit(1);

  const emailVerified = account?.emailVerified ?? false;
  const banned = account?.banned ?? false;
  return {
    userId: profile.id,
    name: displayName({ first_name: profile.firstName, last_name: profile.lastName, email: profile.email }),
    email: profile.email,
    role: profile.role,
    emailVerified,
    banned,
    canParticipate: emailVerified && !banned,
  };
});
