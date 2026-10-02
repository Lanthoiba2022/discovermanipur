"use client";

import "lenis/dist/lenis.css";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Who gets smooth scrolling: a fine pointer (mouse or trackpad) and no
 * reduced-motion preference. Touch scrolling is native-smooth already and
 * Lenis does not smooth it by default anyway, so creating an instance on a
 * phone only cost a module evaluation and a frame callback for nothing; and a
 * reduced-motion reader keeps the native behaviour assistive tech expects.
 */
const FINE_POINTER = "(pointer: fine)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Set on `<body>` by Radix's scroll lock while a modal dialog is open. */
const SCROLL_LOCK_ATTR = "data-scroll-locked";

/**
 * Lenis smooth scroll, for fine-pointer readers who have not asked for
 * reduced motion. Everyone else gets the browser's own scrolling, untouched.
 *
 * Lenis caches how far the page can scroll and re-measures only when it sees
 * `<html>` resize. The root layout gives `<html>` `h-full`, which pins it to
 * the viewport, so without `lenis.css` (`html.lenis { height: auto }`) it never
 * resizes and a page reached by client navigation could only be scrolled as
 * far as the previous page allowed. The stylesheet fixes that; the re-measure
 * on every route change below is a second guard.
 *
 * Three details:
 *
 * - `autoRaf: true` lets Lenis drive its own frame loop (and cancel it in
 *   `destroy()`), instead of a hand-rolled `requestAnimationFrame` chain here.
 * - The instance follows the two media queries: plug in a mouse or switch
 *   reduced motion off mid-visit and it is created; switch it on and it is
 *   destroyed, so the preference takes effect without a reload.
 * - While a modal dialog (the mobile menu, search) holds Radix's scroll lock,
 *   Lenis is stopped. The lock hides the page's overflow, but Lenis scrolls
 *   programmatically and would otherwise keep moving the page behind the
 *   dialog on a wheel event over the backdrop.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fine = window.matchMedia(FINE_POINTER);
    const reduce = window.matchMedia(REDUCED_MOTION);
    const body = document.body;

    /** Stop while a dialog holds the scroll lock; run otherwise. */
    const syncLock = () => {
      const lenis = lenisRef.current;
      if (!lenis) return;
      if (body.hasAttribute(SCROLL_LOCK_ATTR)) lenis.stop();
      else lenis.start();
    };

    const sync = () => {
      const wanted = fine.matches && !reduce.matches;
      if (wanted && !lenisRef.current) {
        lenisRef.current = new Lenis({
          duration: 1.05,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          touchMultiplier: 1.4,
          // Scrollable areas inside the page (the mobile menu, dialogs, dropdown
          // lists, the concierge) scroll natively instead of moving the page.
          allowNestedScroll: true,
          // A link clicked mid-glide should not carry momentum onto the next page.
          stopInertiaOnNavigate: true,
          autoRaf: true,
        });
        syncLock();
      } else if (!wanted && lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
    };

    sync();
    fine.addEventListener("change", sync);
    reduce.addEventListener("change", sync);
    const lockObserver = new MutationObserver(syncLock);
    lockObserver.observe(body, { attributes: true, attributeFilter: [SCROLL_LOCK_ATTR] });

    return () => {
      fine.removeEventListener("change", sync);
      reduce.removeEventListener("change", sync);
      lockObserver.disconnect();
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, []);

  // A new page has new content: measure it, after it has rendered.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    const frame = requestAnimationFrame(() => lenis.resize());
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return <>{children}</>;
}
