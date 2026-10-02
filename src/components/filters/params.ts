/**
 * Server- and client-safe helpers for reading URL-driven filter state.
 *
 * The static catalogue listings (Experiences, Eateries, Tours, Transport,
 * the store) parse the browser's query string with these helpers, via
 * `searchToRawParams`, and server-filtered pages such as /community parse
 * their `searchParams` prop with the same ones. Either way the URL is the
 * whole filter state, so every filtered view is shareable.
 */

export type RawSearchParams = Record<string, string | string[] | undefined>;

/** The sentinel a `<FilterSelect>` uses for "no filter" (Radix forbids ""). */
export const ALL = "all";

export function readParam(params: RawSearchParams, key: string): string | undefined {
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || value === ALL) return undefined;
  return value;
}

/** Read a param constrained to a known set of values. */
export function readOneOf<T extends string>(
  params: RawSearchParams,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = readParam(params, key);
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export function readBool(params: RawSearchParams, key: string): boolean {
  return readParam(params, key) === "true";
}

export interface FilterOption {
  value: string;
  label: string;
}

/** Turn a list of raw values into title-cased options. */
export function toOptions(values: readonly string[]): FilterOption[] {
  return values.map((value) => ({ value, label: titleCase(value) }));
}

export function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Count how many of the given keys are actively filtering. */
export function activeFilterCount(params: RawSearchParams, keys: readonly string[]) {
  return keys.filter((key) => readParam(params, key) !== undefined).length;
}

/* --------------------------- Shared range vocabularies --------------------- */

export const SORT_VALUES = ["featured", "price-asc", "price-desc", "rating"] as const;
export type SortValue = (typeof SORT_VALUES)[number];

export const SORT_OPTIONS: FilterOption[] = [
  { value: "featured", label: "Featured first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Highest rated" },
];

export interface PriceBand {
  value: string;
  label: string;
  min: number;
  max: number;
}

export function inBand(price: number, band: PriceBand | undefined) {
  if (!band) return true;
  return price >= band.min && price <= band.max;
}
