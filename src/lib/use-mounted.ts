"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * True only after hydration, false on the server and during the first client
 * render.
 *
 * Use this to gate anything whose value differs between server and client —
 * `useReducedMotion()`, the resolved theme, `window`-derived state — so the
 * first client render still matches the server's HTML.
 *
 * Preferred over the `useState(false)` + `useEffect(() => setMounted(true))`
 * idiom: it reads the same, but does not schedule a state update inside an
 * effect, so it avoids the cascading re-render that React Compiler flags.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
