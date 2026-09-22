"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatINR } from "@/lib/utils";
import type { HomestayAmenity } from "@/types";

import { AMENITY_META, AMENITY_ORDER } from "./amenities";
import {
  DEFAULT_FILTERS,
  DISTRICTS,
  PRICE_MAX,
  PRICE_MIN,
  SORT_OPTIONS,
  countActiveFilters,
  type HomestayFilters,
} from "./homestay-query";

const ANY = "__any";

function toQueryString(f: HomestayFilters) {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.district) params.set("district", f.district);
  if (f.min > PRICE_MIN) params.set("min", String(f.min));
  if (f.max < PRICE_MAX) params.set("max", String(f.max));
  if (f.guests > 0) params.set("guests", String(f.guests));
  if (f.amenities.length) params.set("amenities", f.amenities.join(","));
  if (f.sort !== "featured") params.set("sort", f.sort);
  const qs = params.toString();
  return qs ? `/homestays?${qs}` : "/homestays";
}

export function HomestayFiltersBar({
  filters,
  resultCount,
}: {
  filters: HomestayFilters;
  resultCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  const push = (next: HomestayFilters) => {
    startTransition(() => router.push(toQueryString(next), { scroll: false }));
  };

  const set = <K extends keyof HomestayFilters>(key: K, value: HomestayFilters[K]) =>
    push({ ...filters, [key]: value });

  const toggleAmenity = (a: HomestayAmenity) =>
    set(
      "amenities",
      filters.amenities.includes(a)
        ? filters.amenities.filter((x) => x !== a)
        : [...filters.amenities, a],
    );

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-sm)] md:p-6">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const value = new FormData(e.currentTarget).get("q");
          push({ ...filters, q: typeof value === "string" ? value.trim() : "" });
        }}
        className="flex flex-col gap-3 md:flex-row md:items-end"
      >
        <div className="min-w-0 flex-1">
          <Label htmlFor="homestay-search" className="mb-2 block">
            Search stays
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              key={filters.q}
              id="homestay-search"
              name="q"
              defaultValue={filters.q}
              placeholder="Loktak, Ukhrul, lakeside cottage…"
              className="pl-11"
            />
          </div>
        </div>

        <div className="w-full md:w-56">
          <Label htmlFor="homestay-district" className="mb-2 block">
            District
          </Label>
          <Select
            value={filters.district || ANY}
            onValueChange={(v) =>
              set("district", v === ANY ? "" : (v as HomestayFilters["district"]))
            }
          >
            <SelectTrigger id="homestay-district" aria-label="Filter by district">
              <SelectValue placeholder="All districts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All districts</SelectItem>
              {DISTRICTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-52">
          <Label htmlFor="homestay-sort" className="mb-2 block">
            Sort by
          </Label>
          <Select
            value={filters.sort}
            onValueChange={(v) => set("sort", v as HomestayFilters["sort"])}
          >
            <SelectTrigger id="homestay-sort" aria-label="Sort results">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" size="md" className="md:w-auto">
          Search
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={open}
          aria-controls="homestay-advanced-filters"
          onClick={() => setOpen((v) => !v)}
        >
          <SlidersHorizontal aria-hidden="true" />
          More filters
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>

        <p aria-live="polite" className="text-sm text-muted-foreground">
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Updating…
            </span>
          ) : (
            `${resultCount} ${resultCount === 1 ? "stay" : "stays"}`
          )}
        </p>

        {activeCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => push({ ...DEFAULT_FILTERS, sort: filters.sort })}
          >
            <X aria-hidden="true" /> Clear filters
          </Button>
        )}
      </div>

      {open && (
        <div
          id="homestay-advanced-filters"
          className="mt-4 grid gap-6 border-t border-border pt-5 md:grid-cols-[1fr_1fr]"
        >
          <fieldset className="min-w-0">
            <legend className="mb-3 text-sm font-medium">Price per night</legend>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Any", min: PRICE_MIN, max: PRICE_MAX },
                { label: "Under ₹1,500", min: 0, max: 1500 },
                { label: "₹1,500 – ₹3,000", min: 1500, max: 3000 },
                { label: "₹3,000 – ₹6,000", min: 3000, max: 6000 },
                { label: "₹6,000+", min: 6000, max: PRICE_MAX },
              ].map((band) => {
                const active = filters.min === band.min && filters.max === band.max;
                return (
                  <button
                    key={band.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => push({ ...filters, min: band.min, max: band.max })}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border-strong text-foreground hover:bg-muted",
                    )}
                  >
                    {band.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Showing {formatINR(filters.min)} – {formatINR(filters.max)} per night
            </p>

            <div className="mt-6">
              <Label htmlFor="homestay-guests" className="mb-2 block">
                Guests
              </Label>
              <Select
                value={String(filters.guests)}
                onValueChange={(v) => set("guests", Number(v))}
              >
                <SelectTrigger id="homestay-guests" className="md:max-w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any number of guests</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {n === 1 ? "guest" : "guests"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className="mb-3 text-sm font-medium">Amenities</legend>
            <div className="flex flex-wrap gap-2">
              {AMENITY_ORDER.map((a) => {
                const meta = AMENITY_META[a];
                const Icon = meta.icon;
                const active = filters.amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleAmenity(a)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border-strong text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      )}

      {activeCount > 0 && !open && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.district && <Badge variant="primary">{filters.district}</Badge>}
          {filters.guests > 0 && <Badge variant="primary">{filters.guests}+ guests</Badge>}
          {(filters.min > PRICE_MIN || filters.max < PRICE_MAX) && (
            <Badge variant="primary">
              {formatINR(filters.min)} – {formatINR(filters.max)}
            </Badge>
          )}
          {filters.amenities.map((a) => (
            <Badge key={a} variant="primary">
              {AMENITY_META[a]?.label ?? a}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
