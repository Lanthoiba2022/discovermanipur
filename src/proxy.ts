import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/lib/auth/server";

/**
 * Neon Auth session layer.
 *
 * Next.js 16 renamed the `middleware` file convention to `proxy`. On the
 * matched paths below, Neon's middleware refreshes the session cookie and
 * redirects signed-out visitors to `/auth`. It is a complete no-op when Neon
 * Auth is not configured, so the app runs with an empty environment.
 *
 * This is an early, optimistic check only. The host dashboard still calls
 * `requireRole` (`@/lib/auth/dal`), which is the actual gate and the only
 * place the role is checked.
 *
 * `/admin` is deliberately not matched: redirecting signed-out visitors to
 * sign-in would reveal that it exists. Its pages answer 404 to anyone who is
 * not an admin instead (`requireRole`).
 *
 * `AuthGuard` still guards `/account` on the client (that is what the
 * local-development session relies on), so this is the server-side half, not
 * a replacement.
 */
export async function proxy(request: NextRequest) {
  if (!auth) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  return auth.middleware({
    loginUrl: `/auth?next=${encodeURIComponent(pathname + search)}`,
  })(request);
}

export const config = {
  /*
   * Only the private areas. A matcher over every path would make the
   * middleware demand a session for the whole site and redirect even its CSS
   * and JS for signed-out visitors.
   */
  matcher: ["/account/:path*", "/host/dashboard/:path*"],
};
