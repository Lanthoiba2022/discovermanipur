import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Reveal } from "@/components/motion/reveal";

/**
 * The home page's band primitives.
 *
 * Two ideas live here, and both exist to stop a long marketing page reading as
 * one repeated stripe:
 *
 * 1. The MEASURE LADDER. Each band picks a column width, and the page steps
 *    DOWN through them as it descends — 88rem at the featured places, 44rem at
 *    the closing call to action. The reader is funnelled rather than walled.
 * 2. The TWO-PART OPENER. A flanked eyebrow, then a large calm display line,
 *    then an italic line that finishes the sentence. It is the rhythm marker a
 *    900-weight uppercase word plays elsewhere, done in a serif that does not
 *    shout.
 *
 * Everything here is a Server Component; only `Reveal` (a client leaf) crosses the
 * boundary, and it is purely an entrance animation.
 */

export type BandMeasure = "wide" | "mid" | "tight" | "prose";

const MEASURE: Record<BandMeasure, string> = {
  wide: "shell",
  mid: "shell-mid",
  tight: "shell-tight",
  prose: "shell-prose",
};

/** Vertical rhythm, roughly 60px → 140px. Varied per band on purpose. */
export type BandPad = "sm" | "md" | "lg";

const PAD: Record<BandPad, string> = {
  sm: "py-[clamp(3.75rem,6vw,5.25rem)]",
  md: "py-[clamp(4.5rem,8vw,7rem)]",
  lg: "py-[clamp(5.5rem,10vw,8.75rem)]",
};

export type BandTone = "light" | "sand" | "dark" | "crimson";

const TONE: Record<BandTone, string> = {
  light: "chapter-light",
  sand: "chapter-light bg-surface-sand",
  dark: "chapter-dark",
  crimson: "chapter-crimson",
};

/**
 * The accent ink for each ground.
 *
 * `brass-500` is 2.90:1 on ivory and must never carry text there, so the light
 * grounds take `brass-700` (6.15:1) and the dark grounds step the other way.
 */
const ACCENT: Record<BandTone, string> = {
  light: "text-brass-700",
  sand: "text-brass-700",
  dark: "text-brass-400",
  crimson: "text-brass-300",
};

const RULE: Record<BandTone, string> = {
  light: "border-border-strong",
  sand: "border-border-strong",
  dark: "border-ivory-50/18",
  crimson: "border-lily-400/28",
};

export function Band({
  id,
  tone = "light",
  measure = "wide",
  pad = "md",
  label,
  className,
  innerClassName,
  children,
}: {
  id?: string;
  tone?: BandTone;
  measure?: BandMeasure;
  pad?: BandPad;
  /** Accessible name for the band, when the heading does not already give one. */
  label?: string;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-label={label}
      className={cn(TONE[tone], PAD[pad], className)}
    >
      <div className={cn(MEASURE[measure], innerClassName)}>{children}</div>
    </section>
  );
}

export function BandHeader({
  tone = "light",
  eyebrow,
  word,
  completion,
  standfirst,
  action,
  className,
}: {
  tone?: BandTone;
  eyebrow: string;
  /** The large calm line. */
  word: string;
  /** The italic line that finishes the sentence. */
  completion?: string;
  standfirst?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Reveal
      className={cn("mb-12 border-b pb-10 md:mb-16 md:pb-12", RULE[tone], className)}
    >
      <p className={cn("eyebrow rule-flank rule-flank-start mb-7", ACCENT[tone])}>
        {eyebrow}
      </p>

      <div className="grid gap-x-16 gap-y-8 md:grid-cols-[1.05fr_0.95fr]">
        <h2>
          {/* The explicit space is for the accessible name: two block spans
              concatenate without one, so the heading would be announced as
              "Sixty places.And the sixteen districts…". It collapses visually. */}
          <span className="section-word block">{word}</span>{" "}
          {completion && (
            <span className={cn("section-completion mt-3 block", ACCENT[tone])}>
              {completion}
            </span>
          )}
        </h2>

        {(standfirst || action) && (
          <div className="flex flex-col items-start justify-end gap-7">
            {standfirst && (
              <p className="text-lead text-muted-foreground">{standfirst}</p>
            )}
            {action}
          </div>
        )}
      </div>
    </Reveal>
  );
}
