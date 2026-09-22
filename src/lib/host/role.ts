/**
 * Role adapter for the host + admin slice.
 *
 * Everything in `src/app/admin/**` and `src/app/host/dashboard` reads its role
 * through this module and never touches the auth implementation directly.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  SINGLE SWAP POINT FOR REAL AUTH                                         │
 * │  When `src/lib/auth/*` lands, replace the body of `getSessionUser()`      │
 * │  below with the real session lookup (e.g.                                 │
 * │    const profile = await getCurrentProfile();                             │
 * │    return profile ? { id, email, name, role: profile.role } : null;       │
 * │  ). Nothing else in this slice needs to change — every caller already     │
 * │  awaits `getSessionUser()` / `isAdmin()` / `getSessionRole()`.            │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

import type { UserRole } from "@/types";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/** Mock session used until real auth is wired in at the swap point above. */
const MOCK_SESSION: SessionUser = {
  id: "usr-yen-0001",
  email: "thoibi.ningthoujam@example.com",
  name: "Thoibi Ningthoujam",
  role: "admin",
};

/** THE SWAP POINT — replace this body with the real session lookup. */
export async function getSessionUser(): Promise<SessionUser | null> {
  return MOCK_SESSION;
}

export async function getSessionRole(): Promise<UserRole | null> {
  const user = await getSessionUser();
  return user?.role ?? null;
}

export async function isAdmin(): Promise<boolean> {
  return (await getSessionRole()) === "admin";
}

export async function isHost(): Promise<boolean> {
  const role = await getSessionRole();
  return role === "host" || role === "admin";
}
