/**
 * Which internal links may be prefetched at all.
 *
 * A prefetch of a static route is a CDN read. A prefetch of anything below is
 * not: these routes are rendered per request (search, the community pages),
 * sit behind the auth proxy (account, host dashboard, admin), or both, so
 * even one hover prefetch costs a function or a Node proxy invocation on
 * Vercel, for a page the visitor will usually not open. `IntentLink` turns
 * prefetching off entirely for them; a click still navigates client-side.
 *
 * Keep this list in step with the routes that read cookies, headers or
 * `searchParams` on the server, and with the proxy matcher in `src/proxy.ts`.
 */
const DYNAMIC_PREFIXES = [
  "/search",
  "/community",
  "/auth",
  "/account",
  "/host/dashboard",
  "/admin",
] as const;

/**
 * True when `href` points at (or below) a dynamic or proxied route. Accepts
 * a path with an optional query or hash; external URLs are never dynamic in
 * this sense, because next/link does not prefetch them.
 */
export function isDynamicHref(href: string): boolean {
  const path = href.split(/[?#]/, 1)[0] ?? "";
  return DYNAMIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
