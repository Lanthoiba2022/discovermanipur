"use client";

import "lenis/dist/lenis.css";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Lenis smooth scroll, disabled entirely for reduced-motion users so the
 * native scroll behaviour (and assistive tech) is left alone.
 *
 * Lenis caches how far the page can scroll and re-measures only when it sees
 * `<html>` resize. The root layout gives `<html>` `h-full`, which pins it to
 * the viewport, so without `lenis.css` (`html.lenis { height: auto }`) it never
 * resizes and a page reached by client navigation could only be scrolled as
 * far as the previous page allowed. The stylesheet fixes that; the re-measure
 * on every route change below is a second guard.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.4,
      // Scrollable areas inside the page (the mobile menu, dialogs, dropdown
      // lists, the concierge) scroll natively instead of moving the page.
      allowNestedScroll: true,
      // A link clicked mid-glide should not carry momentum onto the next page.
      stopInertiaOnNavigate: true,
    });
    lenisRef.current = lenis;

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
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
