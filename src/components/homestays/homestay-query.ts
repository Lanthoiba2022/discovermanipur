/**
 * URL vocabulary and filtering for /homestays.
 *
 * Pure and dependency-light, so it runs both on the server and in the
 * browser: /homestays is a static page that renders every active stay once
 * and re-filters the cards in the browser from the query string. Inactive
 * stays never get that far; `getHomestays()` drops them on the server.
 */
import { isPriced, sortRows } from "@/lib/data/sort";
import type { District, Homestay, HomestayAmenity } from "@/types";

export const DISTRICTS: District[] = [
  "Imphal East",
  "Imphal West",
  "Bishnupur",
  "Thoubal",
  "Kakching",
  "Churachandpur",
  "Ukhrul",
  "Senapati",
  "Tamenglong",
  "Chandel",
  "Jiribam",
  "Kamjong",
  "Noney",
  "Pherzawl",
  "Tengnoupal",
  "Kangpokpi",
];

export const SORT_OPTIONS = [
  { value: "featured", label: "Recommended" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const PRICE_MIN = 0;
export const PRICE_MAX = 12000;

export interface HomestayFilters {
  q: string;
  district: District | "";
  min: number;
  max: number;
  guests: number;
  amenities: HomestayAmenity[];
  sort: SortValue;
}

export const DEFAULT_FILTERS: HomestayFilters = {
  q: "",
  district: "",
  min: PRICE_MIN,
  max: PRICE_MAX,
  guests: 0,
  amenities: [],
  sort: "featured",
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Parse the URL search params into a fully-typed, clamped filter object. */
export function parseHomestayFilters(params: RawParams): HomestayFilters {
  const districtRaw = first(params.district) ?? "";
  const district = (DISTRICTS as string[]).includes(districtRaw)
    ? (districtRaw as District)
    : "";

  const sortRaw = first(params.sort) ?? "featured";
  const sort = (SORT_OPTIONS.map((s) => s.value) as string[]).includes(sortRaw)
    ? (sortRaw as SortValue)
    : "featured";

  const amenityRaw = first(params.amenities) ?? "";
  const amenities = amenityRaw
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean) as HomestayAmenity[];

  const min = Math.max(PRICE_MIN, toInt(first(params.min), PRICE_MIN));
  const max = Math.min(PRICE_MAX, toInt(first(params.max), PRICE_MAX));

  return {
    q: (first(params.q) ?? "").trim(),
    district,
    min: Math.min(min, max),
    max: Math.max(min, max),
    guests: Math.max(0, Math.min(16, toInt(first(params.guests), 0))),
    amenities,
    sort,
  };
}

/** True when the visitor has narrowed the nightly price range at all. */
export function isPriceNarrowed(f: Pick<HomestayFilters, "min" | "max">) {
  return f.min > PRICE_MIN || f.max < PRICE_MAX;
}

/**
 * The guest, amenity and price filters, applied after the search, district
 * and sort. Returns a new array in the incoming order.
 *
 * A stay with no nightly rate (`pricePerNight <= 0`, "rate on request") is
 * not free, so it must not pass "Under ₹1,500" just because 0 is under 1,500.
 * It is excluded only when the visitor has narrowed the price range; with
 * the full range it stays in, since nothing was asked about price.
 */
export function applyLocalFilters<T extends Pick<Homestay, "pricePerNight" | "maxGuests" | "amenities">>(
  rows: readonly T[],
  f: HomestayFilters,
): T[] {
  const narrowed = isPriceNarrowed(f);
  return rows.filter((h) => {
    if (!isPriced(h.pricePerNight)) {
      if (narrowed) return false;
    } else if (h.pricePerNight < f.min || h.pricePerNight > f.max) {
      return false;
    }
    if (f.guests > 0 && h.maxGuests < f.guests) return false;
    if (f.amenities.length && !f.amenities.every((a) => h.amenities.includes(a))) return false;
    return true;
  });
}

/**
 * The text `?q=` searches: title, description, location and district, joined
 * by spaces, exactly as `getHomestays({ search })` in `@/lib/data` builds its
 * haystack (a query can therefore match across the join, as it always could).
 * Computed on the server and shipped as one facet, so the browser does not
 * need the separate fields.
 */
export function homestaySearchText(h: Pick<Homestay, "title" | "description" | "location" | "district">) {
  return `${h.title} ${h.description} ${h.location} ${h.district}`;
}

/**
 * The row fields `selectHomestays` reads. The listing passes slim facet
 * objects of exactly this shape to the browser instead of whole rows.
 */
export interface HomestayFacets
  extends Pick<
    Homestay,
    "district" | "pricePerNight" | "maxGuests" | "amenities" | "rating" | "featured" | "sortWeight"
  > {
  /** `homestaySearchText(row)`. */
  searchText: string;
}

/**
 * The browser's equivalent of what the page used to do on the server:
 * `getHomestays({ search: q, district, sort })` followed by
 * `applyLocalFilters`.
 *
 * `rows` must already be active stays in `getHomestays()` order. The search
 * is a case-insensitive substring match over `searchText`, the district an
 * exact match, and the sort the data layer's own `sortRows` (cohort then
 * featured by default; price sorts put unpriced stays last).
 */
export function selectHomestays<T extends HomestayFacets>(rows: readonly T[], f: HomestayFilters): T[] {
  const q = f.q.toLowerCase();
  const matched = rows.filter((h) => {
    if (f.district && h.district !== f.district) return false;
    if (q && !h.searchText.toLowerCase().includes(q)) return false;
    return true;
  });
  return applyLocalFilters(
    sortRows(matched, f.sort, (h) => h.pricePerNight),
    f,
  );
}

export function countActiveFilters(f: HomestayFilters) {
  let n = 0;
  if (f.q) n += 1;
  if (f.district) n += 1;
  if (isPriceNarrowed(f)) n += 1;
  if (f.guests > 0) n += 1;
  n += f.amenities.length;
  return n;
}
