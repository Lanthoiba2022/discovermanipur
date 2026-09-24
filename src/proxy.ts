import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/lib/auth/server";

/**
 * Neon Auth session layer.
 *
 * Next.js 16 renamed the `middleware` file convention to `proxy`. On the
 * matched paths below, Neon's middleware refreshes the session cookie,
 * redirects signed-out visitors to `/auth`, and completes the magic-link
 * return trip (it swaps the `neon_auth_session_verifier` query parameter for a
 * session cookie). It is a complete no-op when Neon Auth is not configured, so
 * the app runs with an empty environment.
 *
 * `AuthGuard` still guards `/account` on the client — that is what the demo
 * session relies on — so this is the server-side half, not a replacement.
 */
export async function proxy(request: NextRequest) {
  if (!auth) return NextResponse.next();

  const { pathname, search } = request.nextUrl;

  if (pathname === "/auth/callback") {
    // Must NOT pass `/auth` as the login URL here: the middleware allows
    // anything under its login path straight through, before it gets to the
    // verifier exchange. `/auth/callback` is on the SDK's own skip list, so
    // with the default login URL it exchanges the verifier and then allows.
    return auth.middleware()(request);
  }

  return auth.middleware({
    loginUrl: `/auth?next=${encodeURIComponent(pathname + search)}`,
  })(request);
}

export const config = {
  /*
   * Only the private account shell and the magic-link landing. A matcher over
   * every path would make the middleware demand a session for the whole site
   * and redirect even its CSS and JS for signed-out visitors.
   */
  matcher: ["/account/:path*", "/auth/callback"],
};
