"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE, delay: i * 0.07 },
  }),
};

/**
 * Fade-and-rise on scroll into view.
 *
 * `useReducedMotion()` is null during SSR, so these components must never let
 * it change which ELEMENTS are rendered — doing so makes the server and a
 * reduced-motion client disagree and fails hydration. The tag and the DOM
 * structure are therefore always identical; only the animation is dropped.
 */
export function Reveal({
  children,
  className,
  delayIndex = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delayIndex?: number;
  as?: "div" | "section" | "li" | "article";
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as];

  return (
    <Comp
      className={className}
      custom={delayIndex}
      variants={reduce ? undefined : revealVariants}
      initial={reduce ? false : "hidden"}
      whileInView={reduce ? undefined : "visible"}
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </Comp>
  );
}

/** Word-by-word display heading reveal. */
export function RevealText({
  text,
  className,
  as: Tag = "h2",
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
}) {
  const reduce = useReducedMotion();

  return (
    <Tag className={className}>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={reduce ? false : { y: "110%" }}
            whileInView={reduce ? undefined : { y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: EASE, delay: i * 0.05 }}
          >
            {word}
            {" "}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
