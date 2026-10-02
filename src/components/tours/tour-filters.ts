/**
 * Filter vocabulary for /tours, plus the departure-date helpers the tour
 * card, detail page and booking form share. Pure, so it runs both on the
 * server and in the browser, where the static listing re-filters its cards
 * after a change to the URL. Imports the params module directly rather than
 * the `@/components/filters` barrel, which would pull the filter UI into every
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

/**
 * The row fields `applyTourFilters` reads. The listing passes slim facet
 * objects of exactly this shape to the browser instead of whole rows.
 */
export type TourFacets = Pick<
  Tour,
  "durationDays" | "difficulty" | "themes" | "pricePerPerson" | "rating" | "featured"
>;

/**
 * Filter, then sort. Returns a new array; `rows` is not mutated. The stable
 * sort keeps the incoming (data layer) order for ties.
 */
export function applyTourFilters<T extends TourFacets>(
  rows: readonly T[],
  state: TourFilterState,
): T[] {
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

export function themeOptions(rows: readonly Pick<Tour, "themes">[]): FilterOption[] {
  const map = new Map<string, string>();
  for (const row of rows) {
    for (const theme of row.themes) map.set(slugTheme(theme), titleCase(theme));
  }
  return [...map.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * "5 Oct 2026" for a departure date.
 *
 * Departures are stored as date-only strings (`YYYY-MM-DD`), which
 * `new Date()` parses as UTC midnight. Formatting that instant in the
 * reader's own zone moved every date one day earlier west of UTC, and made the
 * server's HTML (rendered in UTC) disagree with the browser's text on the same
 * page. Formatting in UTC prints the calendar date exactly as stored,
 * everywhere. A full timestamp, if one is ever stored, is shown as its UTC
 * date for the same reason.
 */
export function formatDeparture(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Today's calendar date in Manipur (Asia/Kolkata, UTC+05:30, no daylight
 * saving), as `YYYY-MM-DD`. Departures happen on Indian dates, so "has this
 * one gone?" is asked in India's day rather than UTC's (which still showed
 * yesterday's departures until 05:30 IST) or the reader's.
 */
function todayInKolkata(now: Date = new Date()): string {
  // Assembled from parts rather than trusting one locale's default layout,
  // which has changed between ICU releases.
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/**
 * Departure dates from today (in India) onwards, earliest first. Compares the
 * stored `YYYY-MM-DD` strings lexicographically, which orders them by date.
 */
export function upcomingDepartures(dates: string[]) {
  const today = todayInKolkata();
  return [...dates].filter((date) => date >= today).sort();
}
