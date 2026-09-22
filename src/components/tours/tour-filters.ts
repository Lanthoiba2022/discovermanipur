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
} from "@/components/filters";
import type { Tour } from "@/types";

export const DIFFICULTIES = ["easy", "moderate", "challenging"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_OPTIONS: FilterOption[] = DIFFICULTIES.map((value) => ({
  value,
  label: titleCase(value),
}));

export const TOUR_DURATION_BANDS = [
  { value: "short", label: "1 – 3 days", min: 1, max: 3 },
  { value: "week", label: "4 – 6 days", min: 4, max: 6 },
  { value: "long", label: "7 days or more", min: 7, max: 365 },
] as const;

export const TOUR_PRICE_BANDS: PriceBand[] = [
  { value: "under-15000", label: "Under ₹15,000", min: 0, max: 14_999 },
  { value: "15000-30000", label: "₹15,000 – ₹30,000", min: 15_000, max: 30_000 },
  { value: "30000-60000", label: "₹30,000 – ₹60,000", min: 30_001, max: 60_000 },
  { value: "over-60000", label: "Over ₹60,000", min: 60_001, max: Number.MAX_SAFE_INTEGER },
];

export interface TourFilterState {
  duration?: (typeof TOUR_DURATION_BANDS)[number];
  difficulty?: Difficulty;
  theme?: string;
  price?: PriceBand;
  sort: SortValue;
}

export function parseTourFilters(params: RawSearchParams): TourFilterState {
  const duration = readParam(params, "duration");
  const price = readParam(params, "price");
  return {
    duration: TOUR_DURATION_BANDS.find((band) => band.value === duration),
    difficulty: readOneOf(params, "difficulty", DIFFICULTIES),
    theme: readParam(params, "theme"),
    price: TOUR_PRICE_BANDS.find((band) => band.value === price),
    sort: readOneOf(params, "sort", SORT_VALUES) ?? "featured",
  };
}

export function applyTourFilters(rows: Tour[], state: TourFilterState) {
  const filtered = rows.filter((row) => {
    if (state.duration) {
      if (row.durationDays < state.duration.min || row.durationDays > state.duration.max)
        return false;
    }
    if (state.difficulty && row.difficulty !== state.difficulty) return false;
    if (state.theme && !row.themes.some((theme) => slugTheme(theme) === state.theme)) return false;
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
      return filtered.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating);
  }
}

export function slugTheme(theme: string) {
  return theme.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function themeOptions(rows: Tour[]): FilterOption[] {
  const map = new Map<string, string>();
  for (const row of rows) {
    for (const theme of row.themes) map.set(slugTheme(theme), titleCase(theme));
  }
  return [...map.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function formatDeparture(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function upcomingDepartures(dates: string[]) {
  const todayIso = new Date().toISOString().slice(0, 10);
  return [...dates].filter((date) => date >= todayIso).sort();
}
