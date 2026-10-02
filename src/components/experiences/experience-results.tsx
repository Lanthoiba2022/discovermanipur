"use client";

import type { ReactNode } from "react";

import type { RawSearchParams } from "@/components/filters/params";
import { ListingGrid } from "@/components/listing/listing-grid";
import {
  useListingOrder,
  type KeyedFacets,
  type ListingResultItem,
} from "@/components/listing/use-listing-order";

import { applyExperienceFilters, parseExperienceFilters, type ExperienceFacets } from "./experience-filters";

/**
 * The /experiences grid, filtered and sorted in the browser from the query string
 * with the same `parseExperienceFilters` and `applyExperienceFilters` the page ran on the server
 * before it went static. The cards arrive pre-rendered; this only picks which
 * to show and in what order.
 */

function select(rows: KeyedFacets<ExperienceFacets>[], params: RawSearchParams) {
  return applyExperienceFilters(rows, parseExperienceFilters(params));
}

export function ExperienceResults({
  items,
  emptyNode,
}: {
  /** Every experience, in `getExperiences()` order, with its server-rendered card. */
  items: ListingResultItem<ExperienceFacets>[];
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
