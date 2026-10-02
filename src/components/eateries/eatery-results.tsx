"use client";

import type { ReactNode } from "react";

import type { RawSearchParams } from "@/components/filters/params";
import { ListingGrid } from "@/components/listing/listing-grid";
import {
  useListingOrder,
  type KeyedFacets,
  type ListingResultItem,
} from "@/components/listing/use-listing-order";

import { applyEateryFilters, parseEateryFilters, type EateryFacets } from "./eatery-filters";

/**
 * The /eateries grid, filtered and sorted in the browser from the query string
 * with the same `parseEateryFilters` and `applyEateryFilters` the page ran on the server
 * before it went static. The cards arrive pre-rendered; this only picks which
 * to show and in what order.
 */

function select(rows: KeyedFacets<EateryFacets>[], params: RawSearchParams) {
  return applyEateryFilters(rows, parseEateryFilters(params));
}

export function EateryResults({
  items,
  emptyNode,
}: {
  /** Every eatery, in `getEateries()` order, with its server-rendered card. */
  items: ListingResultItem<EateryFacets>[];
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
