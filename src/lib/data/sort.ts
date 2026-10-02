/**
 * Catalogue ordering, shared by the server data layer and the browser.
 *
 * Pure and dependency-free on purpose: `./index.ts` uses it to order rows
 * read on the server, and the static listing pages import it from client
 * components to re-sort the same rows in the browser after a filter change.
 * Importing `@/lib/data` from a client component would drag the database
 * loaders into the bundle, so client code imports this file directly.
 *
 * Default ordering is cohort first, then featured.
 *
 * `sortWeight` exists so the verified 2026 research rows lead every listing
 * while the original 2025 seed still appears, appended after them. New rows are
 * seeded at 100; everything already in the table sits at the column default of
 * 0. Rows loaded from the bundled seed modules have no weight at all, which
 * `?? 0` puts in the same cohort as the old database rows, so the fallback
 * path orders identically to the database path.
 *
 * An explicit user sort (price, rating) overrides the cohort entirely: someone
 * who asked for "cheapest first" means it, and quietly keeping one cohort on top
 * would just look like the sort is broken.
 *
 * Unpriced rows (a price of 0 or less, or no usable number at all) sort last
 * on both price sorts. Most of the 2026 research homestays carry
 * `price_per_night = 0`, meaning "rate on request", not "free"; ranking them
 * as the cheapest stays would put thirty "₹0" cards in front of every real
 * rate. They keep their relative (cohort) order among themselves.
 *
 * Every sort is `Array.prototype.sort`, which is stable, so rows that compare
 * equal keep the order they arrived in. Callers rely on that to layer a sort on
 * top of the default cohort order.
 */

export const LIST_SORTS = ["featured", "price-asc", "price-desc", "rating"] as const;
export type ListSort = (typeof LIST_SORTS)[number];

/** The fields the default and rating sorts read. All optional: seed rows may lack them. */
export interface SortableRow {
  featured?: boolean;
  rating?: number;
  sortWeight?: number;
}

/** A price is usable when it is a finite number above zero. */
export function isPriced(price: number | null | undefined): price is number {
  return typeof price === "number" && Number.isFinite(price) && price > 0;
}

/**
 * Comparator for the price sorts: priced rows first, ordered by `direction`;
 * unpriced rows after them, in arrival order (the comparator returns 0, and
 * the stable sort keeps them where they were relative to each other).
 */
function byPrice<T>(priceOf: (row: T) => number | null | undefined, direction: 1 | -1) {
  return (a: T, b: T) => {
    const pa = priceOf(a);
    const pb = priceOf(b);
    const aPriced = isPriced(pa);
    const bPriced = isPriced(pb);
    if (aPriced && bPriced) return (pa - pb) * direction;
    if (aPriced) return -1;
    if (bPriced) return 1;
    return 0;
  };
}

/**
 * Return a new array of `rows` in the requested order. Never mutates `rows`.
 *
 * `priceOf` picks the row's price for the price sorts (per night, per person,
 * per day, a 1-3 price band). Listings with no price pass `() => 0`, which
 * makes every row unpriced and leaves a price sort as a no-op.
 */
export function sortRows<T extends SortableRow>(
  rows: readonly T[],
  sort: ListSort | undefined,
  priceOf: (row: T) => number | null | undefined,
): T[] {
  const out = [...rows];
  switch (sort) {
    case "price-asc":
      return out.sort(byPrice(priceOf, 1));
    case "price-desc":
      return out.sort(byPrice(priceOf, -1));
    case "rating":
      return out.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    default:
      return out.sort(
        (a, b) =>
          (b.sortWeight ?? 0) - (a.sortWeight ?? 0) || Number(b.featured) - Number(a.featured),
      );
  }
}
