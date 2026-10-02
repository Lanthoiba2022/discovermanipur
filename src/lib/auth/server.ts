import { createNeonAuth } from "@neondatabase/auth/next/server";
import { cookies } from "next/headers";

import { isAuthConfigured } from "./env";

/**
 * Neon Auth (Managed Better Auth) for Server Components, Route Handlers,
 * Server Actions and `proxy.ts`.
 *
 * `null` when Neon Auth is not configured, so importing this never throws:
 * `createNeonAuth` itself throws on a cookie secret under 32 characters, and
 * `next.config.ts` only sets the flag when the secret is long enough.
 *
 * `sessionDataTtl` is how long Neon's signed `session_data` cookie may answer
 * `getSession()` locally before the wrapper asks Neon Auth upstream again
 * (the package default is 300 s). 900 s cuts those upstream session reads,
 * which land on the `neon_auth` tables in this same database, to a third.
 * Roles are NOT taken from that cache: `getSessionProfile` re-reads
 * `public.profiles` on every request, so a demotion still applies on the very
 * next request. The cost is that a session revoked elsewhere (signed out on
 * another device, banned in the Console) can keep working here for up to
 * 15 minutes, until the cached cookie expires.
 */
export const auth = isAuthConfigured
  ? createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL!.trim(),
      cookies: {
        secret: process.env.NEON_AUTH_COOKIE_SECRET!.trim(),
        sessionDataTtl: 900,
      },
    })
  : null;

/**
 * Whether a cookie name is Neon Auth's session token cookie.
 *
 * The package does not export the name. Its constant is
 * `NEON_AUTH_SESSION_COOKIE_NAME = "__Secure-neon-auth.session_token"`
 * (`@neondatabase/auth/dist/server-*.mjs`, "src/server/constants.ts"), and its
 * own middleware and `getSession` wrapper test for it with a plain substring
 * match on the cookie header. This matches more loosely still, on purpose,
 * because a false "yes" only costs today's upstream call while a false "no"
 * would sign a real user out:
 *
 * - with or without the `__Secure-` prefix (Better Auth adds it only on
 *   HTTPS, so a differently configured upstream could leave it off);
 * - with a chunk suffix such as `.0` (Better Auth splits oversized cookies
 *   into `name.0`, `name.1`, ...; it does this for `session_data`, and a
 *   future version could for the token).
 *
 * Safe to call anywhere: it only looks at a string.
 */
export function isSessionTokenCookieName(name: string): boolean {
  return name.includes("neon-auth.session_token");
}

/**
 * Whether the current request carries a Neon Auth session token cookie.
 *
 * Without one there is no session to find: Neon's wrapper forwards only
 * `__Secure-neon-auth*` cookies upstream, and Better Auth's `/get-session`
 * answers `null` at once when the token cookie is missing. Asking anyway is
 * what used to cost every anonymous Server Action an upstream round trip.
 *
 * Fails OPEN: if the cookie store cannot be read here (an unexpected context),
 * this answers `true`, so the caller falls through to the real session check
 * exactly as before.
 */
export async function hasSessionCookie(): Promise<boolean> {
  try {
    return (await cookies()).getAll().some((cookie) => isSessionTokenCookieName(cookie.name));
  } catch {
    return true;
  }
}

/**
 * Current Neon Auth user, or `null` when unauthenticated or unconfigured.
 * Returns `null` without any network call when the request has no session
 * token cookie (see `hasSessionCookie`), which is every anonymous visitor.
 */
export async function getServerUser() {
  if (!auth) return null;
  if (!(await hasSessionCookie())) return null;
  const { data: session, error } = await auth.getSession();
  if (error) return null;
  return session?.user ?? null;
}
