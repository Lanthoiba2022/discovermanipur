/**
 * "Probably signed in" hint cookie, safe on the server and in the browser.
 *
 * Neon Auth's session cookies are HttpOnly, so the browser cannot tell on its
 * own whether a visitor might be signed in. Without a hint, every page with a
 * Save or Book button resolved the session through the `getCurrentProfile`
 * Server Action on mount, which for an anonymous visitor cost one function
 * invocation and one upstream Neon Auth call to learn "nobody". With it, the
 * session store (`./session-store`) only asks the server when the hint is
 * present, so anonymous views of the public pages make no Server Action call.
 *
 * NEVER TRUSTED FOR AUTHORIZATION. The value is a constant, it is readable and
 * writable by any script on the page, and nothing on the server reads it to
 * decide what a request may do: every Server Action and protected page still
 * resolves the user from the real session cookie (`getServerUser`) and the
 * role from `public.profiles`. The worst a wrong hint can do is cost one extra
 * session check (present but stale) or show the signed-out UI until the
 * visitor opens `/auth` or `/account` (missing although signed in), and both
 * of those paths put it right again:
 *
 * - `getCurrentProfile` (`./profile`) sets it when it finds a profile and the
 *   cookie is missing, and clears it when it finds none and the request has no
 *   session token cookie at all.
 * - `src/proxy.ts` sets it on every signed-in pass through `/account` and
 *   `/host/dashboard`, and clears it when it sends a visitor without a session
 *   token cookie to `/auth`.
 * - `signOut` (`./actions`) clears it in the browser straight away.
 *
 * Deliberately not a `"use client"` module: the server half imports the name
 * and options, and a client module would hand it references instead of values.
 */

/** Cookie name. Short, and outside Neon's `__Secure-neon-auth` namespace. */
export const SESSION_HINT_COOKIE = "dm_signed_in";

/** The constant value. Its presence is the whole signal. */
export const SESSION_HINT_VALUE = "1";

/** About as long as an active Better Auth session lives between refreshes. */
const SESSION_HINT_MAX_AGE_S = 30 * 24 * 60 * 60;

/**
 * Options for `cookies().set` in a Server Action (`./profile`). Not HttpOnly on
 * purpose (the browser has to read it); `Secure` only in production, so a
 * plain-HTTP development server can still use it.
 */
export const SESSION_HINT_OPTIONS = {
  path: "/",
  maxAge: SESSION_HINT_MAX_AGE_S,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: false,
} as const;

/**
 * The same cookie with `maxAge: 0`, which removes it whatever its value.
 * Never pass either set to `NextResponse.cookies` in `src/proxy.ts`; see
 * `serializeSessionHint` for why.
 */
export const SESSION_HINT_CLEAR_OPTIONS = { ...SESSION_HINT_OPTIONS, maxAge: 0 } as const;

/**
 * The whole `Set-Cookie` header value that sets (`true`) or clears (`false`)
 * the hint, for code that must append a header rather than go through a
 * cookie store:
 *
 *   dm_signed_in=1; Path=/; Max-Age=2592000; SameSite=Lax; Secure
 *   dm_signed_in=; Path=/; Max-Age=0; SameSite=Lax; Secure
 *
 * (`Secure` only in production, as in `SESSION_HINT_OPTIONS`.)
 *
 * `src/proxy.ts` needs this because it adds the hint to the response Neon
 * Auth's middleware built. Neon creates that `NextResponse` first and only
 * then appends its own `Set-Cookie` headers (the refreshed session token and
 * session data cookies, or a `Max-Age=0` deletion of stale session data) to
 * `response.headers`. A `NextResponse`'s `response.cookies` was snapshotted at
 * construction and never saw those headers, and every `cookies.set` or
 * `cookies.delete` rewrites the full `Set-Cookie` list from that snapshot, so
 * going through it silently dropped Neon's cookies on every proxied request.
 * Appending a raw header leaves them untouched.
 */
export function serializeSessionHint(signedIn: boolean): string {
  const value = signedIn ? SESSION_HINT_VALUE : "";
  const maxAge = signedIn ? SESSION_HINT_OPTIONS.maxAge : 0;
  const secure = SESSION_HINT_OPTIONS.secure ? "; Secure" : "";
  return `${SESSION_HINT_COOKIE}=${value}; Path=${SESSION_HINT_OPTIONS.path}; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

/**
 * Whether this browser carries the hint. Always `false` on the server, where
 * there is no `document`; server code reads the request cookies instead.
 */
export function hasSessionHint(): boolean {
  if (typeof document === "undefined") return false;
  try {
    return document.cookie
      .split(";")
      .some((part) => part.trim().startsWith(`${SESSION_HINT_COOKIE}=`));
  } catch {
    // A sandboxed document can throw on `cookie`; treat it as "no hint".
    return false;
  }
}

/**
 * Remove the hint in this browser (sign-out). The attributes match the ones
 * the server set it with, so this replaces that cookie rather than adding a
 * second one beside it.
 */
export function clearSessionHint(): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = serializeSessionHint(false);
  } catch {
    // Cookies blocked: there is nothing to clear.
  }
}
