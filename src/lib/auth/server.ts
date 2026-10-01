import { createNeonAuth } from "@neondatabase/auth/next/server";

import { isAuthConfigured } from "./env";

/**
 * Neon Auth (Managed Better Auth) for Server Components, Route Handlers,
 * Server Actions and `proxy.ts`.
 *
 * `null` when Neon Auth is not configured, so importing this never throws:
 * `createNeonAuth` itself throws on a cookie secret under 32 characters, and
 * `next.config.ts` only sets the flag when the secret is long enough.
 */
export const auth = isAuthConfigured
  ? createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL!.trim(),
      cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET!.trim() },
    })
  : null;

/** Current Neon Auth user, or `null` when unauthenticated or unconfigured. */
export async function getServerUser() {
  if (!auth) return null;
  const { data: session, error } = await auth.getSession();
  if (error) return null;
  return session?.user ?? null;
}
