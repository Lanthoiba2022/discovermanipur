"use client";

import { LayoutGrid, Map as MapIcon } from "lucide-react";

import { useListingUrl, writeListingSearch } from "@/components/listing/url-search-store";
import { cn } from "@/lib/utils";

export type HotspotView = "grid" | "map";

const OPTIONS: { value: HotspotView; label: string; Icon: typeof LayoutGrid }[] = [
  { value: "grid", label: "Grid", Icon: LayoutGrid },
  { value: "map", label: "Map", Icon: MapIcon },
];

/** `?view=map` selects the map; anything else (or nothing) is the grid. */
export function parseHotspotView(search: string): HotspotView {
  return new URLSearchParams(search).get("view") === "map" ? "map" : "grid";
}

/**
 * Grid or map, kept in `?view=` so a map view can be shared.
 *
 * Reads the listing store rather than `useSearchParams()`, so it is
 * prerendered (showing "Grid", which is what the static HTML contains)
 * instead of being held behind a Suspense fallback, and switches with
 * `history.replaceState`: changing how you look at the same results is not a
 * step the back button should have to undo.
 */
export function ViewSwitch() {
  const { pathname, search } = useListingUrl();
  const value = parseHotspotView(search);

  function select(next: HotspotView) {
    const params = new URLSearchParams(search);
    if (next === "grid") params.delete("view");
    else params.set("view", next);
    writeListingSearch(pathname, params, "replace");
  }

  return (
    <div
      role="group"
      aria-label="Choose how to browse places"
      className="inline-flex rounded-full border border-border-strong bg-surface p-1"
    >
      {OPTIONS.map(({ value: v, label, Icon }) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => select(v)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
            value === v
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
