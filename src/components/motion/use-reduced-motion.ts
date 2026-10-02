"use client";

import { useSyncExternalStore } from "react";

/**
 * The reader's `prefers-reduced-motion` preference, as an external store.
 *
 * A drop-in for framer's `useReducedMotion()` that does not pull the
 * animation runtime into the bundle, so the header and the closing band's
 * counters can read the preference without framer.
 *
 * `useSyncExternalStore` is the right shape: it subscribes to the media
 * query, keeps the value current if the reader flips the OS setting mid-visit,
 * and its SERVER snapshot (`false`, the common case) is what React uses for
 * the hydration render. The first client render therefore always agrees with
 * the server's HTML, and the real value arrives in an immediate re-render.
 *
 * That also sets the rule for callers, the same one `reveal.tsx` documents:
 * the value may decide TIMING (whether to run an animation, whether to zero a
 * counter in an effect), never what markup or inline style gets rendered on
 * the first pass. Anything visual that must differ under reduced motion
 * belongs in CSS (`@media (prefers-reduced-motion: reduce)` or Tailwind's
 * `motion-reduce:`), where it is correct on the very first paint.
 */

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * A one-off read of the preference, for code that runs in an effect.
 *
 * Needed because of the hydration snapshot above: during the hydration pass
 * the hook reports the server's `false` even on a reduced-motion client, and
 * the corrected value only arrives in the re-render React schedules after
 * commit. A layout effect that runs once on mount (and, say, zeroes a counter
 * before paint) would act on that stale `false`. Reading the media query
 * directly inside the effect is hydration-safe, because effects never decide
 * the server markup. Client only: never call it during render.
 */
export function prefersReducedMotionNow(): boolean {
  return typeof window !== "undefined" && window.matchMedia(QUERY).matches;
}

const getClientSnapshot = (): boolean => window.matchMedia(QUERY).matches;

/** The server cannot know the preference, so it assumes motion is fine. */
const getServerSnapshot = (): boolean => false;

/** True when the reader has asked the OS for reduced motion. */
export function useReducedMotionPreference(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
