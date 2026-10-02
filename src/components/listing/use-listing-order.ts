"use client";

import { useMemo } from "react";

import type { RawSearchParams } from "@/components/filters/params";

import { usePublishListingCount, type ListingGridItem } from "./listing-grid";
import { searchToRawParams } from "./search-params";
import { useListingUrl } from "./url-search-store";

/**
 * One card handed from a listing page to its results component: the
 * server-rendered `node`, plus `facets`, the handful of row fields the filters
 * and sorts read. Facets are deliberately slim (no descriptions, images,
 * menus or itineraries): they are serialised into the page's flight payload
 * once per row, so every extra field is paid for on every visit.
 */
export interface ListingResultItem<F> extends ListingGridItem {
  facets: F;
}

/** A facet row tagged with the key of the card it belongs to. */
export type KeyedFacets<F> = F & { listingKey: string };

/**
 * Filter-and-sort for one listing: parse the URL with the listing's existing
 * `parse*Filters`, then run its `apply*Filters` over the facet rows. Define it
 * at module scope in the results file so it is a stable reference.
 */
export type ListingSelect<F> = (
  rows: KeyedFacets<F>[],
  params: RawSearchParams,
) => KeyedFacets<F>[];

/**
 * The display order for a listing's cards, recomputed whenever the URL's
 * query string changes, and published as the page's result count.
 *
 * The order is computed even for an empty query, so the server render, the
 * hydration render and an in-browser "clear all" all go through the same
 * `apply*Filters` default sort. Rows arrive in the data layer's order (what
 * `getX()` returns), exactly as they did on the server before, so the stable
 * sorts break ties the same way they used to.
 *
 * Also returns the parsed params and raw query, for results components that
 * need more than the order (the hotspot map view, the active-filter heading).
 */
export function useListingOrder<F extends object>(
  items: readonly ListingResultItem<F>[],
  select: ListingSelect<F>,
): { order: string[]; params: RawSearchParams; search: string } {
  const { search } = useListingUrl();

  const rows = useMemo(
    () => items.map((item) => ({ ...item.facets, listingKey: item.key }) as KeyedFacets<F>),
    [items],
  );

  const params = useMemo(() => searchToRawParams(search), [search]);
  const order = useMemo(() => select(rows, params).map((row) => row.listingKey), [rows, params, select]);

  usePublishListingCount(order.length);

  return { order, params, search };
}
