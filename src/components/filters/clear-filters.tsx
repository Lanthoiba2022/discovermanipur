"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { FilterParamsGate } from "./filter-params-gate";
import type { FilterParams } from "./use-filter-params";

/**
 * Renders only when at least one filter is active. Reads and writes the URL
 * through `FilterParamsGate`, so it works in either URL mode.
 */
export function ClearFilters({ label = "Clear filters" }: { label?: string }) {
  return <FilterParamsGate>{(params) => <ClearFiltersView label={label} params={params} />}</FilterParamsGate>;
}

function ClearFiltersView({ label, params }: { label: string; params: FilterParams }) {
  const { clearAll, hasAny, isPending } = params;
  if (!hasAny) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="pill"
      onClick={clearAll}
      disabled={isPending}
      className="px-4"
    >
      <X aria-hidden="true" />
      {label}
    </Button>
  );
}
