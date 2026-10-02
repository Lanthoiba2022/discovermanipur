import { NextResponse, type NextRequest } from "next/server";

import { auth, isSessionTokenCookieName } from "@/lib/auth/server";
import { SESSION_HINT_COOKIE, serializeSessionHint } from "@/lib/auth/session-hint";

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
 *
 * It also keeps the browser's "probably signed in" hint (`dm_signed_in`, see
 * `@/lib/auth/session-hint`) in step, which is how a visitor who signed in
 * before the hint existed gets one. The hint is never read here to decide
 * anything; Neon's middleware has already made the decision from the real
 * session by the time it is touched:
 *
 * - the request carries a session token and Neon let it through: the session
 *   is valid, so (re)set the hint, which also renews its 30 day lifetime for
 *   an active traveller;
 * - Neon sent the visitor to `/auth` and the request has no session token at
 *   all: they are certainly signed out, so clear a leftover hint. With a
 *   token present the redirect may only mean Neon Auth could not be reached;
 *   the hint is left for the browser's own check to settle.
 *
 * The hint goes on as an appended raw `Set-Cookie` header, never through
 * `response.cookies`. Neon builds its `NextResponse` before appending its own
 * session cookies to the headers, so the response's cookie store does not know
 * about them, and any `cookies.set` or `cookies.delete` would rewrite the
 * header list without them: no session refresh, a defeated session cache, and
 * Neon's `Max-Age=0` deletion of stale session data rewritten as a session
 * cookie. `serializeSessionHint` explains the details.
 */
export async function proxy(request: NextRequest) {
  if (!auth) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const response = await auth.middleware({
    loginUrl: `/auth?next=${encodeURIComponent(pathname + search)}`,
  })(request);

  const hasToken = request.cookies.getAll().some((cookie) => isSessionTokenCookieName(cookie.name));
  const location = response.headers.get("location");

  if (!location) {
    if (hasToken) response.headers.append("Set-Cookie", serializeSessionHint(true));
  } else if (!hasToken && request.cookies.has(SESSION_HINT_COOKIE) && isLoginRedirect(location, request)) {
    response.headers.append("Set-Cookie", serializeSessionHint(false));
  }
  return response;
}

/** A redirect to this site's `/auth` page (not, say, an OAuth callback hop). */
function isLoginRedirect(location: string, request: NextRequest): boolean {
  try {
    const target = new URL(location, request.url);
    return target.origin === request.nextUrl.origin && target.pathname === "/auth";
  } catch {
    return false;
  }
}

export const config = {
  /*
   * Only the private areas. A matcher over every path would make the
   * middleware demand a session for the whole site and redirect even its CSS
   * and JS for signed-out visitors.
   */
  matcher: ["/account/:path*", "/host/dashboard/:path*"],
};
