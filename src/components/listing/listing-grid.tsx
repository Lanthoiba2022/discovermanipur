"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

/**
 * The grid of a static catalogue listing, and the result count beside its
 * filters.
 *
 * The page (a Server Component) renders every card once, in its default
 * order, and hands them over as opaque `node`s. This component only decides
 * which of them to show and in what order, so the cards themselves stay
 * Server Components: no card code, and no full catalogue row, ever reaches
 * the browser bundle. Filtering moves a keyed `<li>` rather than re-rendering
 * a card, which also keeps each card's image and reveal animation state.
 */

export interface ListingGridItem {
  /** Stable row identity (the row id, or its slug). Becomes the `<li>` key. */
  key: string;
  /** The server-rendered card. */
  node: ReactNode;
}

export function ListingGrid({
  items,
  order,
  className,
  itemClassName,
  emptyNode,
}: {
  items: readonly ListingGridItem[];
  /** Keys to show, in display order. `null` shows every item in server order. */
  order: readonly string[] | null;
  /** Classes for the `<ul>`, typically the grid template. */
  className?: string;
  /** Classes for each `<li>` (e.g. `flex` so a card can fill the row height). */
  itemClassName?: string;
  /** Rendered instead of the list when `order` is empty: the "no match" state. */
  emptyNode: ReactNode;
}) {
  const byKey = useMemo(() => new Map(items.map((item) => [item.key, item])), [items]);

  const visible = useMemo(() => {
    if (order === null) return items;
    const out: ListingGridItem[] = [];
    for (const key of order) {
      const item = byKey.get(key);
      if (item) out.push(item);
    }
    return out;
  }, [byKey, items, order]);

  if (visible.length === 0) return <>{emptyNode}</>;

  return (
    <ul className={className}>
      {visible.map((item) => (
        <li key={item.key} className={itemClassName}>
          {item.node}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------ result count --- */

/**
 * How many rows the grid on the current page is showing, as a module store.
 *
 * The count lives in the filter bar and the grid lives below it, in separate
 * client islands under a Server Component parent, so they cannot share React
 * state. The grid publishes its count here; the count display subscribes.
 *
 * Keyed by pathname for the same reason as the search store: a count left over
 * from the previous listing must never show on the next one. When nothing has
 * been published for this page (on the server, while hydrating, or before the
 * grid's first commit) readers fall back to the server's `total`.
 */

let countSnapshot: { pathname: string; count: number } = { pathname: "", count: 0 };
const countListeners = new Set<() => void>();

function subscribeCount(listener: () => void) {
  countListeners.add(listener);
  return () => {
    countListeners.delete(listener);
  };
}

function setListingCount(pathname: string, count: number) {
  if (countSnapshot.pathname === pathname && countSnapshot.count === count) return;
  countSnapshot = { pathname, count };
  for (const listener of countListeners) listener();
}

/**
 * Publish the visible count for this page. Called by each listing's results
 * component. A layout effect, so the number beside the filters changes in the
 * same frame as the grid.
 */
export function usePublishListingCount(count: number) {
  const pathname = usePathname();
  useLayoutEffect(() => {
    setListingCount(pathname, count);
  }, [pathname, count]);
}

/** The visible count for this page, or `total` until the grid has published one. */
export function useListingResultCount(total: number): number {
  const pathname = usePathname();
  return useSyncExternalStore(
    subscribeCount,
    () => (countSnapshot.pathname === pathname ? countSnapshot.count : total),
    () => total,
  );
}

/**
 * The count line inside `<FilterBar resultSlot>`: "12 places". `FilterBar`
 * keeps the surrounding `aria-live` paragraph, so a change is announced.
 *
 * `total` is the count of the default (unfiltered) view, computed on the
 * server; it is what the prerendered HTML shows.
 */
export function ListingResultCount({ total, noun }: { total: number; noun: string }) {
  const count = useListingResultCount(total);
  return (
    <>
      <span className="font-display text-lg text-foreground">{count}</span>{" "}
      {count === 1 ? noun : `${noun}s`}
    </>
  );
}
