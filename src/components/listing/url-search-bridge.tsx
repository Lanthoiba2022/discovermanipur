"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useLayoutEffect } from "react";

import { setListingSearch } from "./url-search-store";

/**
 * Copies the real URL into the listing store. Renders nothing.
 *
 * This is the only component on a static listing page that calls
 * `useSearchParams()`, and the page MUST render it inside
 * `<Suspense fallback={null}>`: on a prerendered route the hook makes its
 * subtree up to the nearest Suspense boundary render only in the browser, and
 * without a boundary the production build fails ("Missing Suspense boundary
 * with useSearchParams"; node_modules/next/dist/docs/01-app/03-api-reference/
 * 04-functions/use-search-params.md, "Prerendering"). With its own empty
 * boundary, nothing visible is held back from the static HTML.
 *
 * It follows every way the query can change: a filter control's
 * `pushState`/`replaceState` (Next syncs `useSearchParams` with both), the back
 * and forward buttons, and `<Link>` navigations such as "Clear all filters".
 *
 * A layout effect, not a passive one: on a client-side navigation into a
 * filtered listing, the grid re-renders from the store before the browser
 * paints, so the unfiltered list never flashes. (On a hard load the
 * prerendered, unfiltered HTML is already on screen before any script runs;
 * that first paint is the accepted cost of serving the page from the CDN.)
 */
export function UrlSearchBridge() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useLayoutEffect(() => {
    setListingSearch(pathname, search);
  }, [pathname, search]);

  return null;
}
