"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * How the filter controls below this provider write to the URL.
 *
 *   server  (the default, no provider needed) `router.push` inside a
 *           transition, so the page re-renders on the server with the new
 *           `searchParams`. For dynamic, server-filtered pages such as
 *           /community, which read their filters on the server.
 *
 *   client  `window.history.pushState`, with no server round trip, for the
 *           static catalogue listings that filter in the browser. Controls
 *           read their current value from the listing store instead of
 *           `useSearchParams()`, so they render in the prerendered HTML rather
 *           than behind a Suspense fallback (see `filter-params-gate.tsx`).
 *           Requires a `UrlSearchBridge` on the page to keep the store in step
 *           with the back and forward buttons.
 *
 * The mode is fixed for the lifetime of a mounted subtree: a page either
 * filters on the server or in the browser.
 */
export type FilterUrlMode = "server" | "client";

const FilterUrlModeContext = createContext<FilterUrlMode>("server");

export function FilterUrlModeProvider({
  mode,
  children,
}: {
  mode: FilterUrlMode;
  children: ReactNode;
}) {
  return <FilterUrlModeContext.Provider value={mode}>{children}</FilterUrlModeContext.Provider>;
}

export function useFilterUrlMode(): FilterUrlMode {
  return useContext(FilterUrlModeContext);
}
