"use client";

import type { ReactNode } from "react";

import { useFilterUrlMode } from "./filter-url-mode";
import { useFilterParams, useListingFilterParams, type FilterParams } from "./use-filter-params";

/**
 * Hands a filter control the right `FilterParams` for its page's URL mode.
 *
 * The two sources cannot share one hook: server mode needs
 * `useSearchParams()`, and calling it at all on a prerendered listing would
 * push the whole filter bar behind a Suspense fallback in the static HTML.
 * Hooks cannot be called conditionally, so the choice is made one level up,
 * by rendering one of two tiny components. The mode comes from context and
 * never changes for a mounted subtree, so the same branch renders every time.
 *
 * Usage: `<FilterParamsGate>{(params) => <View params={params} />}</FilterParamsGate>`.
 * The render function must return a component element (not call hooks itself).
 */
export function FilterParamsGate({
  children,
}: {
  children: (params: FilterParams) => ReactNode;
}) {
  const mode = useFilterUrlMode();
  return mode === "client" ? (
    <ListingSource render={children} />
  ) : (
    <RouterSource render={children} />
  );
}

function RouterSource({ render }: { render: (params: FilterParams) => ReactNode }) {
  const params = useFilterParams();
  return <>{render(params)}</>;
}

function ListingSource({ render }: { render: (params: FilterParams) => ReactNode }) {
  const params = useListingFilterParams();
  return <>{render(params)}</>;
}
