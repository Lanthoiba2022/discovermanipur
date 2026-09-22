"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useFilterParams } from "./use-filter-params";

/** Renders only when at least one filter is active. */
export function ClearFilters({ label = "Clear filters" }: { label?: string }) {
  const { clearAll, hasAny, isPending } = useFilterParams();
  if (!hasAny) return null;

  return (
    <Button type="button" variant="ghost" size="sm" onClick={clearAll} disabled={isPending}>
      <X aria-hidden="true" />
      {label}
    </Button>
  );
}
