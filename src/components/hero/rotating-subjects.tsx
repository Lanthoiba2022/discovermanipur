"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/** Same `--ease-flat` the rest of the fold runs on. */
const EASE_FLAT = [0.4, 0, 0.1, 1] as const;
const INTERVAL_MS = 3400;

/**
 * The rotating tail of the hero sentence.
 *
 * `aria-hidden`, because a phrase that swaps itself out every few seconds is
 * unreadable to a screen reader; the hero renders the full list once in an
 * `sr-only` paragraph instead.
 *
 * Reduced motion stops the rotation entirely rather than merely speeding it
 * up — an element that changes on its own is the thing the preference is
 * about — and the first subject stays put. As in the hero, `initial`/`animate`
 * are constant and only the timing collapses, so nothing about what is
 * rendered depends on a value the server cannot know.
 */
export function RotatingSubjects({ subjects }: { subjects: string[] }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % subjects.length),
      INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [reduce, subjects.length]);

  return (
    <span
      aria-hidden
      className="relative inline-flex h-[1.35em] min-w-0 flex-1 overflow-hidden align-bottom"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={subjects[index]}
          initial={{ y: "105%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-105%", opacity: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.55, ease: EASE_FLAT }}
          className="absolute inset-0 whitespace-nowrap font-display italic text-ivory-50"
        >
          {subjects[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
