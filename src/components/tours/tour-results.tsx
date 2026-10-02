"use client";

import type { ReactNode } from "react";

import type { RawSearchParams } from "@/components/filters/params";
import { ListingGrid } from "@/components/listing/listing-grid";
import {
  useListingOrder,
  type KeyedFacets,
  type ListingResultItem,
} from "@/components/listing/use-listing-order";

import { applyTourFilters, parseTourFilters, type TourFacets } from "./tour-filters";

/**
 * The /tours grid, filtered and sorted in the browser from the query string
 * with the same `parseTourFilters` and `applyTourFilters` the page ran on the server
 * before it went static. The cards arrive pre-rendered; this only picks which
 * to show and in what order.
 */

function select(rows: KeyedFacets<TourFacets>[], params: RawSearchParams) {
  return applyTourFilters(rows, parseTourFilters(params));
}

export function TourResults({
  items,
  emptyNode,
}: {
  /** Every tour, in `getTours()` order, with its server-rendered card. */
  items: ListingResultItem<TourFacets>[];
  /** The "nothing matches those filters" state, rendered on the server. */
  emptyNode: ReactNode;
}) {
  const { order } = useListingOrder(items, select);
  return (
    <ListingGrid
      items={items}
      order={order}
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      itemClassName="flex"
      emptyNode={emptyNode}
    />
  );
}
