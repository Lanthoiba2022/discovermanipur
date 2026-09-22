import {
  type FilterOption,
  type RawSearchParams,
  readBool,
  readOneOf,
  readParam,
  titleCase,
} from "@/components/filters";
import type { CuisineType, Eatery } from "@/types";

export const CUISINES: CuisineType[] = [
  "manipuri",
  "naga",
  "kuki",
  "north-indian",
  "chinese",
  "cafe",
  "street-food",
  "vegan",
];

export const CUISINE_OPTIONS: FilterOption[] = CUISINES.map((value) => ({
  value,
  label: titleCase(value),
}));

export const PRICE_RANGE_OPTIONS: FilterOption[] = [
  { value: "1", label: "₹ · Everyday" },
  { value: "2", label: "₹₹ · Mid-range" },
  { value: "3", label: "₹₹₹ · Special occasion" },
];

export const EATERY_SORT_OPTIONS: FilterOption[] = [
  { value: "featured", label: "Featured first" },
  { value: "rating", label: "Highest rated" },
  { value: "price-asc", label: "Cheapest first" },
  { value: "price-desc", label: "Priciest first" },
];

const SORTS = ["featured", "rating", "price-asc", "price-desc"] as const;
type EaterySort = (typeof SORTS)[number];

export interface EateryFilterState {
  cuisine?: CuisineType;
  price?: 1 | 2 | 3;
  district?: string;
  reservations: boolean;
  sort: EaterySort;
}

export function parseEateryFilters(params: RawSearchParams): EateryFilterState {
  const price = readOneOf(params, "price", ["1", "2", "3"] as const);
  return {
    cuisine: readOneOf(params, "cuisine", CUISINES),
    price: price ? (Number(price) as 1 | 2 | 3) : undefined,
    district: readParam(params, "district"),
    reservations: readBool(params, "reservations"),
    sort: readOneOf(params, "sort", SORTS) ?? "featured",
  };
}

export function applyEateryFilters(rows: Eatery[], state: EateryFilterState) {
  const filtered = rows.filter((row) => {
    if (state.cuisine && !row.cuisines.includes(state.cuisine)) return false;
    if (state.price && row.priceRange !== state.price) return false;
    if (state.district && row.district !== state.district) return false;
    if (state.reservations && !row.acceptsReservations) return false;
    return true;
  });

  switch (state.sort) {
    case "rating":
      return filtered.sort((a, b) => b.rating - a.rating);
    case "price-asc":
      return filtered.sort((a, b) => a.priceRange - b.priceRange);
    case "price-desc":
      return filtered.sort((a, b) => b.priceRange - a.priceRange);
    default:
      return filtered.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating);
  }
}

export function priceRangeLabel(range: 1 | 2 | 3) {
  return "₹".repeat(range);
}

export function mapsHref(eatery: Eatery) {
  const { lat, lng } = eatery.coordinates;
  if (lat || lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${eatery.name} ${eatery.location} Manipur`,
  )}`;
}
