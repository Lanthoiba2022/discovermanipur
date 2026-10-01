/**
 * Role adapter for the host dashboard and admin pages.
 *
 * Everything in `src/app/admin/**` and `src/app/host/dashboard` reads its role
 * through this module and never touches the auth implementation directly.
 *
 * Roles live in `public.profiles.role` and are read on every request (see
 * `getSessionProfile` in `@/lib/auth/dal`). Nobody can grant themselves one:
 * `saveProfile` never writes `role`. An admin approving a host application
 * promotes a `user` to `host` (`src/lib/host/application-actions.ts`); any
 * other change goes through `npm run db:set-role -- <email> <role>`.
 *
 * Every admin page calls `requireAdmin` and the host dashboard calls
 * `requireHost`, each page, not just the layout, because a layout check does
 * not stop the page under it from rendering.
 */

import type { Profile, UserRole } from "@/types";

import { getSessionProfile, requireRole } from "@/lib/auth/dal";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

function toSessionUser(profile: Profile): SessionUser {
  return {
    id: profile.id,
    email: profile.email,
    name:
      [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
      profile.email.split("@")[0],
    role: profile.role,
  };
}

/** The signed-in user, or `null` when signed out. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const profile = await getSessionProfile();
  return profile ? toSessionUser(profile) : null;
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

/** The signed-in admin, or a redirect. `path` is the calling page's URL. */
export async function requireAdmin(path: string): Promise<SessionUser> {
  return toSessionUser(await requireRole(["admin"], { area: "admin", path }));
}

/** A signed-in host (or admin), or a redirect. `path` is the calling page's URL. */
export async function requireHost(path: string): Promise<SessionUser> {
  return toSessionUser(await requireRole(["host", "admin"], { area: "host", path }));
}
