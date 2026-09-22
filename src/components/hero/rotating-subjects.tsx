"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;


export function RotatingSubjects({ subjects }: { subjects: string[] }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % subjects.length),
      3400,
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
          initial={reduce ? false : { y: "105%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? undefined : { y: "-105%", opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="absolute inset-0 whitespace-nowrap font-display italic text-ivory-50"
        >
          {subjects[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
