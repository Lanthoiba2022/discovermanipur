"use client";

import { useEffect, useState } from "react";

/**
 * True only when it is safe and worthwhile to mount heavy ambient media:
 * a wide viewport, no reduced-motion preference, and the browser has gone idle
 * (so nothing here competes with the hero's LCP paint).
 */
export function useAmbientEnabled(minWidth = 1024) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const widthQuery = window.matchMedia(`(min-width: ${minWidth}px)`);
    const saveData = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection?.saveData;

    let cancelled = false;

    const evaluate = () => {
      if (cancelled) return;
      setEnabled(!motionQuery.matches && widthQuery.matches && !saveData);
    };

    const timer = window.setTimeout(evaluate, 1200);

    motionQuery.addEventListener("change", evaluate);
    widthQuery.addEventListener("change", evaluate);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      motionQuery.removeEventListener("change", evaluate);
      widthQuery.removeEventListener("change", evaluate);
    };
  }, [minWidth]);

  return enabled;
}
