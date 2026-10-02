"use client";

import { useCallback, type ReactNode } from "react";

import type { RawSearchParams } from "@/components/filters/params";
import { ListingGrid } from "@/components/listing/listing-grid";
import {
  useListingOrder,
  type KeyedFacets,
  type ListingResultItem,
} from "@/components/listing/use-listing-order";
import type { CraftCategory } from "@/types";

import { applyCraftFilters, parseCraftFilters, type CraftFacets } from "./craft-filters";

/**
 * The /store grid, filtered and sorted in the browser from the query string
 * with the same `parseCraftFilters` and `applyCraftFilters` the page ran on
 * the server before it went static. Only active crafts are ever passed in:
 * `getCrafts()` drops the rest on the server.
 */
export function CraftResults({
  items,
  categories,
  emptyNode,
}: {
  /** Every active craft, in `getCrafts()` order, with its server-rendered card. */
  items: ListingResultItem<CraftFacets>[];
  /** The categories `?category=` may name (an unknown one is ignored, as on the server). */
  categories: readonly CraftCategory[];
  /** "No crafts match those filters", rendered on the server. */
  emptyNode: ReactNode;
}) {
  const select = useCallback(
    (rows: KeyedFacets<CraftFacets>[], params: RawSearchParams) =>
      applyCraftFilters(rows, parseCraftFilters(params, categories)),
    [categories],
  );
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
