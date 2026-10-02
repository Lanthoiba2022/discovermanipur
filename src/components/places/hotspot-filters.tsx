"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useCallback, useMemo } from "react";

import type { RawSearchParams } from "@/components/filters/params";
import { useListingResultCount } from "@/components/listing/listing-grid";
import { searchToRawParams } from "@/components/listing/search-params";
import { useListingUrl, writeListingSearch } from "@/components/listing/url-search-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { categoryLabel, seasonLabel, SEASONS } from "./taxonomy";

export interface HotspotFilterState {
  category: string;
  district: string;
  season: string;
  accessible: boolean;
}

/** The URL keys this rail owns. `view` belongs to the view switch and survives "Clear all". */
const FILTER_KEYS = ["category", "district", "season", "accessible"] as const;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/**
 * Read the rail's state from the query string. The URL vocabulary is the one
 * /hotspots has always used, so links shared before the page went static
 * still resolve: the first value of each key, verbatim, and step-free access
 * as `accessible=1`.
 */
export function parseHotspotFilters(params: RawSearchParams): HotspotFilterState {
  return {
    category: first(params.category),
    district: first(params.district),
    season: first(params.season),
    accessible: first(params.accessible) === "1",
  };
}

export function hasHotspotFilters(state: HotspotFilterState): boolean {
  return Boolean(state.category || state.district || state.season || state.accessible);
}

/** The row fields `applyHotspotFilters` reads; a real `Hotspot` satisfies it. */
export interface HotspotFacets {
  category: string;
  district: string;
  bestSeasons?: readonly string[];
  accessibility?: { wheelchairAccessible?: boolean };
}

/**
 * Keep the places that match every active filter, in the incoming order
 * (`getHotspots()` order: cohort, then featured). There is no sort control on
 * /hotspots. Returns a new array.
 */
export function applyHotspotFilters<T extends HotspotFacets>(
  rows: readonly T[],
  state: HotspotFilterState,
): T[] {
  return rows.filter((h) => {
    if (state.category && h.category !== state.category) return false;
    if (state.district && h.district !== state.district) return false;
    if (state.season && !h.bestSeasons?.includes(state.season)) return false;
    if (state.accessible && !h.accessibility?.wheelchairAccessible) return false;
    return true;
  });
}

interface HotspotFiltersProps {
  categories: string[];
  districts: string[];
  /** Places in the unfiltered list: the count the prerendered HTML shows. */
  total: number;
}

/**
 * URL-driven filter rail. Every control writes to the query string, so a
 * filtered view is shareable, and the grid (and map) below re-filter in the
 * browser: /hotspots is a static page.
 *
 * It reads the query from the listing store rather than `useSearchParams()`,
 * so it is prerendered (unfiltered) instead of being held behind a Suspense
 * fallback, and writes with `history.replaceState`: refining a search has
 * never added a back-button step here, and still does not.
 */
export function HotspotFilters({ categories, districts, total }: HotspotFiltersProps) {
  const { pathname, search } = useListingUrl();
  const value = useMemo(() => parseHotspotFilters(searchToRawParams(search)), [search]);
  const resultCount = useListingResultCount(total);

  const setParam = useCallback(
    (key: string, next: string | null) => {
      const params = new URLSearchParams(search);
      if (next === null || next === "" || next === "all") params.delete(key);
      else params.set(key, next);
      writeListingSearch(pathname, params, "replace");
    },
    [pathname, search],
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(search);
    FILTER_KEYS.forEach((k) => params.delete(k));
    writeListingSearch(pathname, params, "replace");
  }, [pathname, search]);

  const chips = useMemo(() => {
    const out: { key: string; label: string }[] = [];
    if (value.category) out.push({ key: "category", label: categoryLabel(value.category) });
    if (value.district) out.push({ key: "district", label: value.district });
    if (value.season) out.push({ key: "season", label: seasonLabel(value.season) });
    if (value.accessible) out.push({ key: "accessible", label: "Step-free access" });
    return out;
  }, [value]);

  return (
    <div>
      {chips.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="eyebrow text-muted-foreground">Active</span>
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setParam(chip.key, null)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              {chip.label}
              <X className="size-3" aria-hidden />
              <span className="sr-only">Remove {chip.label} filter</span>
            </button>
          ))}
          <Button variant="link" size="sm" onClick={clearAll} className="text-xs">
            Clear all
          </Button>
        </div>
      )}

      <details
        open
        className="group rounded-[var(--radius-lg)] border border-border bg-surface p-5 lg:sticky lg:top-28"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-lg [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="size-4" aria-hidden />
            Refine
          </span>
          <span className="text-xs font-sans font-normal text-muted-foreground">
            {resultCount} {resultCount === 1 ? "place" : "places"}
          </span>
        </summary>

        <div className="mt-5 space-y-6">
          <FilterGroup
            id="filter-category"
            label="Category"
            allLabel="All categories"
            options={categories.map((c) => ({ value: c, label: categoryLabel(c) }))}
            value={value.category}
            onChange={(v) => setParam("category", v)}
            emptyHint="Categories appear once places are published."
          />

          <FilterGroup
            id="filter-district"
            label="District"
            allLabel="All districts"
            options={districts.map((d) => ({ value: d, label: d }))}
            value={value.district}
            onChange={(v) => setParam("district", v)}
            emptyHint="Districts appear once places are published."
          />

          <fieldset>
            <legend className="eyebrow mb-3 text-muted-foreground">Best season</legend>
            <div className="flex flex-wrap gap-2">
              {SEASONS.map((s) => {
                const active = value.season === s;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setParam("season", active ? null : s)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border-strong text-foreground hover:bg-muted",
                    )}
                  >
                    {seasonLabel(s)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex items-start gap-3 rounded-[var(--radius)] bg-surface-sunken p-3">
            <input
              id="filter-accessible"
              type="checkbox"
              checked={value.accessible}
              onChange={(e) => setParam("accessible", e.target.checked ? "1" : null)}
              className="mt-0.5 size-4 accent-[var(--primary)]"
            />
            <label htmlFor="filter-accessible" className="text-sm leading-snug">
              Step-free access only
              <span className="block text-xs text-muted-foreground">
                Wheelchair-friendly paths and entrances
              </span>
            </label>
          </div>

          <Button variant="outline" size="sm" onClick={clearAll} className="w-full">
            Clear all filters
          </Button>
        </div>
      </details>
    </div>
  );
}

function FilterGroup({
  id,
  label,
  allLabel,
  options,
  value,
  onChange,
  emptyHint,
}: {
  id: string;
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (next: string | null) => void;
  emptyHint: string;
}) {
  if (options.length === 0) {
    return (
      <div>
        <p className="eyebrow mb-2 text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="eyebrow mb-2 block text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value || "all"}
        onChange={(e) => onChange(e.target.value === "all" ? null : e.target.value)}
        className="h-11 w-full rounded-[var(--radius)] border border-border bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
      >
        <option value="all">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
