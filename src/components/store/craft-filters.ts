/**
 * Server-safe filter vocabulary for the craft store.
 *
 * Every control on /store writes into the URL, so a filtered catalogue is
 * shareable and rendered on the server exactly like the other index routes.
 */
import {
  type FilterOption,
  type PriceBand,
  type RawSearchParams,
  inBand,
  readBool,
  readOneOf,
  readParam,
  titleCase,
} from "@/components/filters";
import type { Craft, CraftCategory } from "@/types";

export const CRAFT_SORT_VALUES = ["featured", "price-asc", "price-desc"] as const;
export type CraftSortValue = (typeof CRAFT_SORT_VALUES)[number];

export const CRAFT_SORT_OPTIONS: FilterOption[] = [
  { value: "featured", label: "Featured first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export const CRAFT_PRICE_BANDS: PriceBand[] = [
  { value: "under-1000", label: "Under ₹1,000", min: 0, max: 999 },
  { value: "1000-2500", label: "₹1,000 – ₹2,500", min: 1000, max: 2500 },
  { value: "over-2500", label: "Over ₹2,500", min: 2501, max: Number.MAX_SAFE_INTEGER },
];

export const CRAFT_FILTER_KEYS = [
  "category",
  "district",
  "price",
  "madeToOrder",
  "gi",
  "sort",
] as const;

export interface CraftFilterState {
  category?: string;
  district?: string;
  price?: PriceBand;
  madeToOrder: boolean;
  giTagged: boolean;
  sort: CraftSortValue;
}

export function parseCraftFilters(
  params: RawSearchParams,
  categories: readonly CraftCategory[],
): CraftFilterState {
  const priceValue = readParam(params, "price");
  return {
    category: readOneOf(params, "category", categories),
    district: readParam(params, "district"),
    price: CRAFT_PRICE_BANDS.find((band) => band.value === priceValue),
    madeToOrder: readBool(params, "madeToOrder"),
    giTagged: readBool(params, "gi"),
    sort: readOneOf(params, "sort", CRAFT_SORT_VALUES) ?? "featured",
  };
}

export function applyCraftFilters(rows: Craft[], state: CraftFilterState): Craft[] {
  const filtered = rows.filter((row) => {
    if (state.category && row.category !== state.category) return false;
    if (state.district && row.district !== state.district) return false;
    if (state.madeToOrder && !row.madeToOrder) return false;
    if (state.giTagged && !row.giTagged) return false;
    if (!inBand(row.price, state.price)) return false;
    return true;
  });

  switch (state.sort) {
    case "price-asc":
      return filtered.sort((a, b) => a.price - b.price);
    case "price-desc":
      return filtered.sort((a, b) => b.price - a.price);
    default:
      return filtered.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          Number(b.giTagged) - Number(a.giTagged) ||
          a.name.localeCompare(b.name),
      );
  }
}

export function craftCategoryOptions(values: readonly CraftCategory[]): FilterOption[] {
  return values.map((value) => ({ value, label: craftCategoryLabel(value) }));
}

export function craftCategoryLabel(value: CraftCategory | string) {
  return value === "food-produce" ? "Food & produce" : titleCase(value);
}

export function craftDistrictOptions(values: readonly string[]): FilterOption[] {
  return [...new Set(values)].sort().map((value) => ({ value, label: value }));
}

/** "Made to order · ready in about 2 weeks" — human, never a countdown. */
export function formatLeadTime(days: number) {
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"}`;
  const weeks = Math.round(days / 7);
  return `about ${weeks} ${weeks === 1 ? "week" : "weeks"}`;
}

/** Crafts related to this one: same category first, then same district. */
export function relatedCrafts(all: Craft[], current: Craft, limit = 3): Craft[] {
  const pool = all.filter((row) => row.slug !== current.slug);
  const scored = pool
    .map((row) => ({
      row,
      score: (row.category === current.category ? 2 : 0) + (row.district === current.district ? 1 : 0),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || Number(b.row.featured) - Number(a.row.featured));
  return scored.slice(0, limit).map((entry) => entry.row);
}
