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
import type { TransportMode, TransportOption } from "@/types";

export const TRANSPORT_MODES: TransportMode[] = [
  "cab",
  "suv",
  "tempo",
  "bike",
  "shared-sumo",
  "bus",
];

export const MODE_OPTIONS: FilterOption[] = TRANSPORT_MODES.map((value) => ({
  value,
  label: value === "shared-sumo" ? "Shared Sumo" : titleCase(value),
}));

export const SEAT_BANDS = [
  { value: "1-2", label: "1 – 2 seats", min: 1, max: 2 },
  { value: "3-4", label: "3 – 4 seats", min: 3, max: 4 },
  { value: "5-7", label: "5 – 7 seats", min: 5, max: 7 },
  { value: "8-plus", label: "8 seats or more", min: 8, max: 100 },
] as const;

export const TRANSPORT_PRICE_BANDS: PriceBand[] = [
  { value: "under-2000", label: "Under ₹2,000 / day", min: 0, max: 1999 },
  { value: "2000-4000", label: "₹2,000 – ₹4,000 / day", min: 2000, max: 4000 },
  { value: "over-4000", label: "Over ₹4,000 / day", min: 4001, max: Number.MAX_SAFE_INTEGER },
];

export interface TransportFilterState {
  mode?: TransportMode;
  seats?: (typeof SEAT_BANDS)[number];
  price?: PriceBand;
  sort: SortValue;
}

export function parseTransportFilters(params: RawSearchParams): TransportFilterState {
  const seats = readParam(params, "seats");
  const price = readParam(params, "price");
  return {
    mode: readOneOf(params, "mode", TRANSPORT_MODES),
    seats: SEAT_BANDS.find((band) => band.value === seats),
    price: TRANSPORT_PRICE_BANDS.find((band) => band.value === price),
    sort: readOneOf(params, "sort", SORT_VALUES) ?? "featured",
  };
}

export function applyTransportFilters(rows: TransportOption[], state: TransportFilterState) {
  const filtered = rows.filter((row) => {
    if (state.mode && row.mode !== state.mode) return false;
    if (state.seats && (row.seats < state.seats.min || row.seats > state.seats.max)) return false;
    if (state.price && !inBand(row.pricePerDay ?? 0, state.price)) return false;
    return true;
  });

  switch (state.sort) {
    case "price-asc":
      return filtered.sort((a, b) => (a.pricePerDay ?? 0) - (b.pricePerDay ?? 0));
    case "price-desc":
      return filtered.sort((a, b) => (b.pricePerDay ?? 0) - (a.pricePerDay ?? 0));
    case "rating":
      return filtered.sort((a, b) => b.rating - a.rating);
    default:
      return filtered.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating);
  }
}

export function modeLabel(mode: TransportMode) {
  return mode === "shared-sumo" ? "Shared Sumo" : titleCase(mode);
}

export type { SortValue };
export { SORT_VALUES };
