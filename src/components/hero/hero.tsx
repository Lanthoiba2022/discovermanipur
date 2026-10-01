"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { useRef, type ReactNode } from "react";

import { HeroReelControls } from "./hero-reel-controls";
import { HERO_SLIDES } from "./hero-slides";
import { HeroStage } from "./hero-stage";
import { useHeroCarousel } from "./use-hero-carousel";
import { HeroSearch } from "./hero-search";
import { RotatingSubjects } from "./rotating-subjects";

/**
 * `--ease-flat`: the house easing for anything being read. The hero never
 * springs: an overshoot on a headline reads as a toy. Entrances that may
 * overshoot (`--ease-spring`) are reserved for tiles further down the page.
 */
const EASE_FLAT = [0.4, 0, 0.1, 1] as const;

/** Per-word reveal: 400ms of travel, 60ms between neighbours. */
const WORD_DURATION = 0.4;
const WORD_STAGGER = 0.06;
const WORD_LEAD = 0.14;

/**
 * The headline, pre-broken into lines so each word can be its own masked
 * reveal. The closing line takes the accent: the sentence completes in brass
 * rather than merely ending, which is the one flourish the fold gets.
 *
 * It names four things rather than one place on purpose: the reel shows
 * water, hills, a dance and a flower, so a headline about one place would not
 * cover it. Four nouns (water, hills, the handloom, the drum) cover what the
 * state actually is, and they enumerate straight into the rotating "and …"
 * line below, so the whole fold reads as one sentence listing Manipur.
 */
const HEADLINE_SOURCE: { key: string; words: string[]; accent?: boolean }[] = [
  { key: "a", words: ["A", "lake,", "a", "hill,"] },
  { key: "b", words: ["a", "loom,", "a", "drum."], accent: true },
];

/**
 * Flattened once, at module scope, so each word carries its own stagger index
 * and the render stays a pure map with nothing accumulating across it.
 */
let counter = 0;
const HEADLINE = HEADLINE_SOURCE.map((line) => ({
  ...line,
  words: line.words.map((word) => ({ word, index: counter++ })),
}));

const WORD_COUNT = counter;
/** Everything below the headline follows the last word rather than racing it. */
const AFTER_HEADLINE = WORD_LEAD + (WORD_COUNT - 1) * WORD_STAGGER + WORD_DURATION * 0.6;

/** The index rail. Information scent on the fold, not just a picture. */
const INDEX = [
  { figure: "287", unit: "km²", label: "Loktak Lake" },
  { figure: "16", unit: "", label: "Districts" },
  { figure: "34", unit: "", label: "Tribes" },
];

/**
 * Reduced motion, without a hydration mismatch.
 *
 * `useReducedMotion()` is null on the server and true on a reduced-motion
 * client, so branching `initial={reduce ? false : {...}}` makes the server
 * emit `opacity: 0` and the client's first render emit `opacity: 1`. React
 * reports the attributes as mismatched and refuses to patch them. The rule in
 * `components/motion/reveal.tsx` is that reduced motion must never change what
 * is rendered; the same applies to the inline style framer writes.
 *
 * So `initial` and `animate` are constant and only the *timing* collapses. The
 * markup is byte-identical either way, and a reduced-motion reader lands on
 * the finished state in a single frame instead of watching it travel.
 */
function timing(reduce: boolean | null, duration: number, delay: number) {
  return reduce
    ? { duration: 0, delay: 0 }
    : { duration, delay, ease: EASE_FLAT };
}

/**
 * One masked word. The clip box carries the descender padding and cancels it
 * with a negative margin, so a trailing comma or full stop is not sheared by
 * its own mask.
 */
function Word({
  children,
  index,
  reduce,
}: {
  children: ReactNode;
  index: number;
  reduce: boolean | null;
}) {
  return (
    <span className="inline-block -mb-[0.16em] overflow-hidden pb-[0.16em] align-bottom">
      <motion.span
        className="inline-block"
        initial={{ y: "108%" }}
        animate={{ y: 0 }}
        transition={timing(reduce, WORD_DURATION, WORD_LEAD + index * WORD_STAGGER)}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function Hero({ subjects }: { subjects: string[] }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reel = useHeroCarousel(HERO_SLIDES.length, stageRef);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // The parallax is disabled by flattening the *output range*, not by dropping
  // the `style` prop: at progress 0 both branches resolve to exactly the same
  // transform, so the server HTML and the first client render agree and only
  // the subsequent scrolling behaviour differs.
  const mediaY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "14%"]);
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1.04, reduce ? 1.04 : 1.14]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 70]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, reduce ? 1 : 0]);

  return (
    <section
      ref={ref}
      aria-label="Manipur, in one breath"
      data-hero-tone="dark"
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-ink-950"
    >
      {/* Layer 1: the photograph */}
      <motion.div
        ref={stageRef}
        className="absolute inset-0 -z-30"
        style={{ y: mediaY, scale: mediaScale }}
      >
        <HeroStage index={reel.index} animated={reel.animated} shown={reel.shown} />
      </motion.div>

      {/* Layer 2: dawn aurora. Composed from the `--dawn-*` ramp: it costs no JavaScript,
          paints before hydration and needs no reduced-motion branch because it
          does not move. Inset negatively so its 24px blur has room to fall off
          instead of banding at the edges of the frame. */}
      <div
        aria-hidden
        className="dawn-wash pointer-events-none absolute -inset-x-24 -top-32 -z-20 h-[72%] opacity-40 mix-blend-screen"
      />

      {/* Layer 3: scrims. Sized to the copy rather than washed over the
          whole frame, so the phumdi rings still read as water and land. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-44 bg-gradient-to-b from-ink-950/70 to-transparent"
      />
      <div aria-hidden className="scrim-reading pointer-events-none absolute inset-0 -z-10" />
      <div aria-hidden className="scrim-copy pointer-events-none absolute inset-0 -z-10" />

      <motion.div
        className="shell relative pb-24 pt-40 sm:pb-10"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={timing(reduce, WORD_DURATION, 0)}
          className="mb-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-ivory-50/85"
        >
          <span className="font-mayek text-lg leading-none text-brass-300">ꯃꯅꯤꯄꯨꯔ</span>
          <span aria-hidden className="h-px w-8 bg-brass-300/50" />
          <span className="eyebrow">Manipur · North East India</span>
        </motion.p>

        <h1 className="text-display max-w-[16ch] text-ivory-50">
          {HEADLINE.map((line) => (
            <span key={line.key} className="flex flex-wrap gap-x-[0.26em]">
              {line.words.map(({ word, index }) => (
                <span key={index} className={line.accent ? "text-brass-300" : undefined}>
                  <Word index={index} reduce={reduce}>
                    {word}
                  </Word>
                </span>
              ))}
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={timing(reduce, 0.5, AFTER_HEADLINE)}
          className="text-lead mt-7 flex max-w-2xl items-baseline gap-2.5 text-ivory-50/80"
        >
          <span className="shrink-0">and</span>
          <RotatingSubjects subjects={subjects} />
        </motion.p>
        <p className="sr-only">Also in Manipur: {subjects.join(", ")}.</p>

        {/* The instrument rail: search, index figures and the scroll cue
            share one ruled band so the fold ends on a hard horizontal. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={timing(reduce, 0.5, AFTER_HEADLINE + 0.08)}
          className="mt-12 border-t border-ivory-50/20 pt-8"
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
            <HeroSearch />

            <dl className="flex gap-8 sm:gap-12">
              {INDEX.map((item) => (
                <div key={item.label}>
                  <dd className="font-display text-3xl leading-none tabular-nums text-ivory-50 sm:text-4xl">
                    {item.figure}
                    {item.unit && (
                      <span className="ml-0.5 align-top text-base text-brass-300">{item.unit}</span>
                    )}
                  </dd>
                  <dt className="eyebrow mt-2.5 text-ivory-50/60">{item.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:pr-0 lg:pr-56">
            <Link
              href="#layers"
              className="group inline-flex items-center gap-3 text-ivory-50/75 transition-colors duration-[var(--dur-base)] ease-[var(--ease-flat)] hover:text-ivory-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <span className="grid size-9 place-items-center rounded-full border border-ivory-50/25 transition-colors duration-[var(--dur-base)] ease-[var(--ease-flat)] group-hover:border-brass-300 group-hover:text-brass-300">
                <ArrowDown aria-hidden className="size-4 animate-float-slow" />
              </span>
              <span className="eyebrow">Manipur in four layers</span>
            </Link>

            {/* Naming the place is what makes the fold read as reportage
                rather than stock, so the caption travels with the reel. */}
            <HeroReelControls
              shown={reel.shown}
              paused={reel.userPaused}
              autoplaying={reel.autoplaying}
              onToggle={reel.togglePaused}
              onSelect={reel.goTo}
              holdHandlers={reel.holdHandlers}
              className="min-w-0"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
