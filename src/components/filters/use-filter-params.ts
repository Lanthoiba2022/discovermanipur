"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";

import { useListingSearch, writeListingSearch } from "@/components/listing/url-search-store";

import { useFilterUrlMode } from "./filter-url-mode";
import { ALL } from "./params";

/** What every filter control needs from the URL. */
export interface FilterParams {
  /** The current value of `?<key>=`, or undefined when absent. */
  get: (key: string) => string | undefined;
  /** Set `?<key>=<value>`; `null`, `""` or the `ALL` sentinel removes it. */
  setParam: (key: string, value: string | null) => void;
  /** Drop every query parameter. */
  clearAll: () => void;
  /** True while a server-mode navigation is in flight. Always false in client mode. */
  isPending: boolean;
  /** True when the query string carries anything at all. */
  hasAny: boolean;
}

function nextParams(current: string, key: string, value: string | null) {
  const next = new URLSearchParams(current);
  if (!value || value === ALL) next.delete(key);
  else next.set(key, value);
  return next;
}

/**
 * Reads filter state from `useSearchParams()` and writes it back to the URL,
 * so every filtered view is shareable.
 *
 * How it writes depends on the nearest `FilterUrlModeProvider`:
 *
 * - server (default): `router.push` inside `startTransition`, so the page is
 *   re-rendered on the server with the new `searchParams` and `isPending`
 *   reports the round trip. /community relies on exactly this.
 * - client: `window.history.pushState`. Next 16 syncs it with
 *   `useSearchParams` (node_modules/next/dist/docs/01-app/01-getting-started/
 *   04-linking-and-navigating.md, "Native History API"), it never scrolls, and
 *   there is nothing to wait for, so `isPending` is always false.
 *
 * On a prerendered page any caller must sit under a `<Suspense>` boundary,
 * because `useSearchParams()` makes that subtree render only in the browser.
 * The kit's own controls avoid that cost in client mode by going through
 * `FilterParamsGate`, which uses `useListingFilterParams` instead.
 */
export function useFilterParams(): FilterParams {
  const mode = useFilterUrlMode();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const current = searchParams.toString();

  const push = useCallback(
    (next: URLSearchParams) => {
      if (mode === "client") {
        writeListingSearch(pathname, next, "push");
        return;
      }
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [mode, pathname, router],
  );

  const setParam = useCallback(
    (key: string, value: string | null) => push(nextParams(current, key, value)),
    [current, push],
  );

  const clearAll = useCallback(() => {
    push(new URLSearchParams());
  }, [push]);

  const get = useCallback((key: string) => searchParams.get(key) ?? undefined, [searchParams]);

  return {
    get,
    setParam,
    clearAll,
    isPending: mode === "client" ? false : isPending,
    hasAny: current.length > 0,
  };
}

/**
 * Client-mode filter state for a static listing: reads the listing store
 * (`""` on the server and while hydrating, then the real query once the
 * page's `UrlSearchBridge` has run), writes with `pushState`.
 *
 * Unlike `useFilterParams` it never calls `useSearchParams()`, so a control
 * using it is prerendered with the unfiltered state instead of being held
 * behind a Suspense fallback, and the filter bar keeps its real height in the
 * static HTML.
 */
export function useListingFilterParams(): FilterParams {
  const pathname = usePathname();
  const search = useListingSearch(pathname);
  const params = useMemo(() => new URLSearchParams(search), [search]);

  const setParam = useCallback(
    (key: string, value: string | null) =>
      writeListingSearch(pathname, nextParams(search, key, value), "push"),
    [pathname, search],
  );

  const clearAll = useCallback(() => {
    writeListingSearch(pathname, new URLSearchParams(), "push");
  }, [pathname]);

  const get = useCallback((key: string) => params.get(key) ?? undefined, [params]);

  return { get, setParam, clearAll, isPending: false, hasAny: search.length > 0 };
}
