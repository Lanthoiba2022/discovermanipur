"use client";

import type { ReactNode } from "react";

import type { RawSearchParams } from "@/components/filters/params";
import { ListingGrid } from "@/components/listing/listing-grid";
import {
  useListingOrder,
  type KeyedFacets,
  type ListingResultItem,
} from "@/components/listing/use-listing-order";

import { parseHomestayFilters, selectHomestays, type HomestayFacets } from "./homestay-query";

/**
 * The /homestays grid, filtered and sorted in the browser from the query
 * string with the same rules `getHomestays()` and `applyLocalFilters` applied
 * on the server before the page went static. Only active stays are ever
 * passed in: visibility stays a server decision.
 */

function select(rows: KeyedFacets<HomestayFacets>[], params: RawSearchParams) {
  return selectHomestays(rows, parseHomestayFilters(params));
}

export function HomestayResults({
  items,
  emptyNode,
}: {
  /** Every active stay, in `getHomestays()` order, with its server-rendered card. */
  items: ListingResultItem<HomestayFacets>[];
  /** "No stays match those filters", rendered on the server. */
  emptyNode: ReactNode;
}) {
  const { order } = useListingOrder(items, select);
  return (
    <ListingGrid
      items={items}
      order={order}
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      emptyNode={emptyNode}
    />
  );
}
