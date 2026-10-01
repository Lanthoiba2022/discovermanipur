/**
 * Post-sign-in redirect targets come from the query string, so they are
 * attacker-controlled. Only a path on this site is accepted.
 *
 * Checking for a leading "/" is not enough: browsers treat "\" like "/", so
 * "/\evil.com" is the protocol-relative "//evil.com", and tabs or newlines
 * inside a URL are stripped before it is resolved ("/\t/evil.com"). The value
 * is therefore screened for those characters and then resolved against a
 * throwaway origin, and anything that resolves off that origin is refused.
 *
 * Pure and dependency-free: used by the `/auth` page on the server and again
 * by the sign-in form in the browser.
 */

const PROBE_ORIGIN = "https://same-origin.invalid";

/** Pages a sign-in must never land on: itself (a loop) and non-page routes. */
const REFUSED_ROOTS = ["/auth", "/api", "/_next"];

export function safeRedirectPath(value: unknown, fallback = "/account"): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) return fallback;

  // Must be an absolute path, and not "//host" or "/\host".
  if (raw[0] !== "/" || raw[1] === "/" || raw[1] === "\\") return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return fallback;

  let url: URL;
  try {
    url = new URL(raw, PROBE_ORIGIN);
  } catch {
    return fallback;
  }
  if (url.origin !== PROBE_ORIGIN) return fallback;

  // Dot segments can collapse into a fresh "//": "/..//evil.com" resolves to
  // the path "//evil.com", which is protocol-relative again once returned.
  if (url.pathname.startsWith("//")) return fallback;

  const path = `${url.pathname}${url.search}${url.hash}`;
  const refused = REFUSED_ROOTS.some(
    (root) => url.pathname === root || url.pathname.startsWith(`${root}/`),
  );
  return refused ? fallback : path;
}
