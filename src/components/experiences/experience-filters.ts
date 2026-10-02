/**
 * Filter vocabulary for /experiences. Pure, so it runs both on the server and
 * in the browser, where the static listing re-filters its cards after a
 * change to the URL. Imports the params module directly rather than the
 * `@/components/filters` barrel, which would pull the filter UI into every
 * client bundle that only needs these functions.
 */
import {
  type FilterOption,
  type PriceBand,
  type RawSearchParams,
  type SortValue,
  SORT_VALUES,
  inBand,
  readOneOf,
  readParam,
  titleCase,
} from "@/components/filters/params";
import type { Experience, ExperienceCategory } from "@/types";

export const EXPERIENCE_CATEGORIES: ExperienceCategory[] = [
  "craft",
  "cuisine",
  "festival",
  "adventure",
  "wellness",
  "music",
  "textile",
  "agriculture",
  "wildlife",
];

export const CATEGORY_OPTIONS: FilterOption[] = EXPERIENCE_CATEGORIES.map((value) => ({
  value,
  label: titleCase(value),
}));

export const DURATION_BANDS = [
  { value: "short", label: "Under 3 hours", min: 0, max: 2.99 },
  { value: "half-day", label: "3 – 5 hours", min: 3, max: 5.99 },
  { value: "full-day", label: "6 hours or more", min: 6, max: Number.MAX_SAFE_INTEGER },
] as const;

export const EXPERIENCE_PRICE_BANDS: PriceBand[] = [
  { value: "under-1000", label: "Under ₹1,000", min: 0, max: 999 },
  { value: "1000-2500", label: "₹1,000 – ₹2,500", min: 1000, max: 2500 },
  { value: "2500-5000", label: "₹2,500 – ₹5,000", min: 2501, max: 5000 },
  { value: "over-5000", label: "Over ₹5,000", min: 5001, max: Number.MAX_SAFE_INTEGER },
];

export const EXPERIENCE_FILTER_KEYS = ["category", "district", "duration", "price", "sort"] as const;

export interface ExperienceFilterState {
  category?: string;
  district?: string;
  duration?: (typeof DURATION_BANDS)[number];
  price?: PriceBand;
  sort: SortValue;
}

export function parseExperienceFilters(params: RawSearchParams): ExperienceFilterState {
  const durationValue = readParam(params, "duration");
  const priceValue = readParam(params, "price");
  return {
    category: readOneOf(params, "category", EXPERIENCE_CATEGORIES),
    district: readParam(params, "district"),
    duration: DURATION_BANDS.find((band) => band.value === durationValue),
    price: EXPERIENCE_PRICE_BANDS.find((band) => band.value === priceValue),
    sort: readOneOf(params, "sort", SORT_VALUES) ?? "featured",
  };
}

/**
 * The row fields `applyExperienceFilters` reads. The listing passes slim facet
 * objects of exactly this shape to the browser instead of whole rows.
 */
export type ExperienceFacets = Pick<
  Experience,
  "category" | "district" | "durationHours" | "pricePerPerson" | "rating" | "featured"
>;

/**
 * Filter, then sort. Returns a new array; `rows` is not mutated. The stable
 * sort keeps the incoming (data layer) order for ties.
 */
export function applyExperienceFilters<T extends ExperienceFacets>(
  rows: readonly T[],
  state: ExperienceFilterState,
): T[] {
  const filtered = rows.filter((row) => {
    if (state.category && row.category !== state.category) return false;
    if (state.district && row.district !== state.district) return false;
    if (state.duration) {
      if (row.durationHours < state.duration.min || row.durationHours > state.duration.max)
        return false;
    }
    if (!inBand(row.pricePerPerson, state.price)) return false;
    return true;
  });

  switch (state.sort) {
    case "price-asc":
      return filtered.sort((a, b) => a.pricePerPerson - b.pricePerPerson);
    case "price-desc":
      return filtered.sort((a, b) => b.pricePerPerson - a.pricePerPerson);
    case "rating":
      return filtered.sort((a, b) => b.rating - a.rating);
    default:
      return filtered.sort(
        (a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating,
      );
  }
}

export function districtOptions(values: readonly string[]): FilterOption[] {
  return [...new Set(values)].sort().map((value) => ({ value, label: value }));
}

export function formatHours(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return minutes ? `${whole} hr ${minutes} min` : `${whole} ${whole === 1 ? "hour" : "hours"}`;
}
