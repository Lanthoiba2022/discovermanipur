"use client";

import type { MouseEvent } from "react";

import { useListingUrl, writeListingSearch } from "@/components/listing/url-search-store";
import { IntentLink } from "@/components/shared/intent-link";
import { Button } from "@/components/ui/button";

import { parseHotspotView } from "./view-switch";

/**
 * The "Clear all filters" link in the /hotspots no-match state.
 *
 * It does what the filter rail's own "Clear all" does: drop the filters and
 * keep `?view=`, so a visitor who filtered the map into an empty result lands
 * back on the full map rather than being bounced to the grid. The view lives in
 * the listing store (the page is static and filters in the browser), which is
 * why this is a client component and not a plain link in the server page.
 *
 * It stays a real anchor with the cleared URL as its `href`, so it can be
 * opened in a new tab and is announced as a link. A plain primary click is
 * handled in place, like the rail: the store is rewritten with
 * `history.replaceState`, the grid (or map) re-filters in the same tick, and
 * there is no navigation, no RSC request and no back-button step. Any modified
 * click (new tab, new window) is left to the browser. Prefetching is off
 * (`intent={false}`): the in-place click never uses a prefetched route, and a
 * new tab loads the document afresh, so a hover prefetch would buy nothing.
 *
 * Only ever rendered after hydration, because `HotspotResults` reaches its
 * empty node only with a filter set, and the server snapshot has none.
 */
export function HotspotClearFilters() {
  const { pathname, search } = useListingUrl();
  const view = parseHotspotView(search);
  const params = new URLSearchParams(view === "map" ? { view } : {});
  const query = params.toString();
  const href = query ? `${pathname}?${query}` : pathname;

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    writeListingSearch(pathname, params, "replace");
  }

  return (
    <Button asChild variant="outline" size="pill" className="mt-7">
      <IntentLink href={href} intent={false} onClick={onClick}>
        Clear all filters
      </IntentLink>
    </Button>
  );
}
