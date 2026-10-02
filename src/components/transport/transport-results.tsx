"use client";

import type { ReactNode } from "react";

import type { RawSearchParams } from "@/components/filters/params";
import { ListingGrid } from "@/components/listing/listing-grid";
import {
  useListingOrder,
  type KeyedFacets,
  type ListingResultItem,
} from "@/components/listing/use-listing-order";

import { applyTransportFilters, parseTransportFilters, type TransportFacets } from "./transport-filters";

/**
 * The /transport grid, filtered and sorted in the browser from the query string
 * with the same `parseTransportFilters` and `applyTransportFilters` the page ran on the server
 * before it went static. The cards arrive pre-rendered; this only picks which
 * to show and in what order.
 */

function select(rows: KeyedFacets<TransportFacets>[], params: RawSearchParams) {
  return applyTransportFilters(rows, parseTransportFilters(params));
}

export function TransportResults({
  items,
  emptyNode,
}: {
  /** Every operator, in `getTransportOptions()` order, with its server-rendered card. */
  items: ListingResultItem<TransportFacets>[];
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
