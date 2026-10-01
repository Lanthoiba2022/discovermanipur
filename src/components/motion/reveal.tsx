"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/**
 * The house easings, named. `expo` is the default settle; `spring` overshoots
 * and is for entrances only (never for something being read); `flat` has a long
 * tail and suits anything that should feel unhurried.
 */
const EASES = {
  expo: [0.22, 1, 0.36, 1],
  spring: [0.2, 0.9, 0.25, 1.1],
  flat: [0.4, 0, 0.1, 1],
} as const;

export type RevealEase = keyof typeof EASES;

interface RevealCustom {
  i: number;
  reduce: boolean;
  ease: RevealEase;
}

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (c: RevealCustom) => ({
    opacity: 1,
    y: 0,
    transition: c.reduce
      ? { duration: 0 }
      : { duration: 0.6, ease: EASES[c.ease], delay: c.i * 0.07 },
  }),
};

/**
 * Fade-and-rise on scroll into view.
 *
 * `useReducedMotion()` returns null during SSR and true on a reduced-motion
 * client. So it must never decide *what gets rendered*: not the tag, not the
 * DOM structure, and not the inline style framer writes. Branching
 * `variants`/`initial` on it makes the server emit `opacity: 0` while a
 * reduced-motion client's first render emits no opacity at all: React reports
 * mismatched attributes, and a tree it declines to patch can leave a
 * reduced-motion reader looking at permanently invisible content.
 *
 * Instead `variants`, `initial` and `whileInView` are constant, and only the
 * transition *timing* collapses, so the markup is identical either
 * way and a reduced-motion reader simply lands on the finished state in one
 * frame. `custom` carries the flag into the variant, where it is safe: variants
 * resolve after hydration.
 */
export function Reveal({
  children,
  className,
  delayIndex = 0,
  as = "div",
  ease = "expo",
}: {
  children: ReactNode;
  className?: string;
  delayIndex?: number;
  as?: "div" | "section" | "li" | "article";
  /** Entrances may use `spring`; anything carrying prose should not. */
  ease?: RevealEase;
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as];

  return (
    <Comp
      className={className}
      custom={{ i: delayIndex, reduce: Boolean(reduce), ease } satisfies RevealCustom}
      variants={revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </Comp>
  );
}

/** Word-by-word display heading reveal. Same hydration contract as `Reveal`. */
export function RevealText({
  text,
  className,
  as: Tag = "h2",
  ease = "flat",
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
  ease?: RevealEase;
}) {
  const reduce = useReducedMotion();

  return (
    <Tag className={className}>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 0.7, ease: EASES[ease], delay: i * 0.05 }
            }
          >
            {word}
            {" "}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
