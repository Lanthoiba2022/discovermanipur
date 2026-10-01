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

/** Filters `getHomestays` cannot express yet, applied after the data call. */
export function applyLocalFilters(rows: Homestay[], f: HomestayFilters): Homestay[] {
  return rows.filter((h) => {
    if (h.pricePerNight < f.min || h.pricePerNight > f.max) return false;
    if (f.guests > 0 && h.maxGuests < f.guests) return false;
    if (f.amenities.length && !f.amenities.every((a) => h.amenities.includes(a))) return false;
    return true;
  });
}

export function countActiveFilters(f: HomestayFilters) {
  let n = 0;
  if (f.q) n += 1;
  if (f.district) n += 1;
  if (f.min > PRICE_MIN || f.max < PRICE_MAX) n += 1;
  if (f.guests > 0) n += 1;
  n += f.amenities.length;
  return n;
}
