"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

/**
 * The query string of the listing page being viewed, as a tiny module store.
 *
 * Why not `useSearchParams()` everywhere: the seven catalogue listings are
 * prerendered once and served from the CDN, and on a prerendered route
 * `useSearchParams()` makes everything up to the nearest `<Suspense>` render
 * only in the browser. Wrapping a grid of 159 cards (or a filter bar) in such a
 * boundary would ship its fallback in the static HTML instead of the cards.
 * So exactly one component per page reads the real URL (`UrlSearchBridge`,
 * under its own `<Suspense fallback={null}>`) and copies it here, and every
 * grid, count and control on the page reads this store instead.
 *
 * The server snapshot is always `""` (no filters). The prerendered HTML and
 * the hydration render therefore both show the unfiltered list, so they match
 * exactly; a filtered deep link re-renders from the URL straight after.
 *
 * The stored value is tagged with the pathname that wrote it, and a reader only
 * sees it when its own pathname matches. After a client navigation from
 * `/eateries?cuisine=naga` to `/hotspots`, the hotspot grid would otherwise
 * render one frame filtered by the eateries' query before the bridge on the new
 * page overwrote it.
 */

interface ListingSearchSnapshot {
  pathname: string;
  /** `URLSearchParams.toString()` form, without the leading `?`. */
  search: string;
}

let snapshot: ListingSearchSnapshot = { pathname: "", search: "" };
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const serverSnapshot = () => "";

/**
 * Record the current query string for `pathname`. A no-op when nothing
 * changed, so the bridge echoing a value a control already wrote does not
 * re-render anything.
 */
export function setListingSearch(pathname: string, search: string) {
  const normalised = search.startsWith("?") ? search.slice(1) : search;
  if (snapshot.pathname === pathname && snapshot.search === normalised) return;
  snapshot = { pathname, search: normalised };
  for (const listener of listeners) listener();
}

/**
 * The query string for `pathname`, or `""` when the store holds another
 * page's query (or nothing yet). Always `""` on the server and while hydrating.
 */
export function useListingSearch(pathname: string): string {
  return useSyncExternalStore(
    subscribe,
    () => (snapshot.pathname === pathname ? snapshot.search : ""),
    serverSnapshot,
  );
}

/** The current page's pathname and query string, read from the store. */
export function useListingUrl(): { pathname: string; search: string } {
  const pathname = usePathname();
  const search = useListingSearch(pathname);
  return { pathname, search };
}

/**
 * Write a new query string for a static listing, without a server round trip.
 *
 * The store is updated first, so the grid and the controls re-render in the
 * same tick as the click. The History API call then makes the URL shareable
 * and, for `push`, gives the back button a step to return to. Next 16 patches
 * `pushState` and `replaceState` so `useSearchParams()` (and therefore the
 * bridge) follows them, and neither call scrolls the page.
 */
export function writeListingSearch(
  pathname: string,
  params: URLSearchParams,
  mode: "push" | "replace",
) {
  const search = params.toString();
  setListingSearch(pathname, search);
  const url = search ? `${pathname}?${search}` : pathname;
  if (mode === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}
