"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** `useLayoutEffect` that degrades to a no-op during SSR. */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * One counting figure in the closing band's index.
 *
 * The same contract as `home/statement.tsx`:
 *
 *  - The SERVER renders the TRUE number. A reader with no JavaScript, a reader
 *    on reduced motion, and a reader whose observer never fires because the
 *    band is already on screen all see `5,000+`, never a permanent `0`.
 *  - `useReducedMotion()` returns `null` during SSR and `true` on a
 *    reduced-motion client, so it must never decide what is *rendered* — only
 *    the timing. It is read in effects here, after hydration has matched, and
 *    the markup is byte-identical either way.
 *  - The zeroing happens in a layout effect: after hydration, before paint, so
 *    there is no flash of the final figure followed by a jump back to zero.
 *  - `tabular-nums` so the label underneath does not shuffle while the digits
 *    run.
 *
 * This is the smallest possible interactive leaf — the band around it stays a
 * server component.
 */
export function GsFigure({ value, suffix = "" }: { value: number; suffix?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  const [armed, setArmed] = useState(false);

  useIsomorphicLayoutEffect(() => {
    // Everything that could stop the count from ever running is checked HERE,
    // before the figure is zeroed — so the failure mode is "the number does
    // not animate", never "the number is stuck at 0".
    if (reduce || typeof IntersectionObserver === "undefined") return;
    setShown(0);
    setArmed(true);
  }, [reduce]);

  useEffect(() => {
    const el = ref.current;
    if (!armed || !el) return;

    // No framer `useInView` here: an IntersectionObserver created directly
    // fires its first callback immediately with the current intersection, so a
    // band that is already on screen when the effect runs counts up instead of
    // sitting at zero.
    let frame = 0;
    const run = () => {
      const duration = 1100;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setShown(Math.round(value * eased));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    // NO `rootMargin`. The obvious `{ rootMargin: "-60px" }` — the inset this
    // codebase uses elsewhere to delay a reveal until an element is properly
    // on screen — was measured doing the opposite here: inside this band's
    // `overflow: hidden` section, Chrome reported `isIntersecting: false` and
    // a zero intersection rect for every cell but the first, even with the
    // element sitting 371px down an 812px viewport. The counters stayed at
    // zero on a phone for exactly the readers least able to scroll past them.
    // Default options (threshold 0, no margin) report all four correctly, and
    // starting the count the moment a digit is visible is the right behaviour
    // anyway.
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      run();
    });
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [armed, value]);

  return (
    <span ref={ref} className="font-display text-5xl leading-none tabular-nums text-brass-300 md:text-6xl">
      {shown >= 1000 ? shown.toLocaleString("en-IN") : shown}
      {suffix && <span className="text-2xl md:text-3xl">{suffix}</span>}
    </span>
  );
}
