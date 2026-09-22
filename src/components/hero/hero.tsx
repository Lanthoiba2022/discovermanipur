"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef } from "react";

import { HeroMedia } from "./hero-media";
import { HeroSearch } from "./hero-search";
import { RotatingSubjects } from "./rotating-subjects";
import { useAmbientEnabled } from "./use-ambient-enabled";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Decorative WebGL mist — client-only, idle-mounted, never part of first paint. */
const HeroShader = dynamic(() => import("./hero-shader"), {
  ssr: false,
  loading: () => null,
});

const HEADLINE = [
  { text: "The islands", key: "a" },
  { text: "that float.", key: "b" },
];

/** The mono index rail. Information scent on the fold, not just a picture. */
const INDEX = [
  { figure: "287", unit: "km²", label: "Loktak Lake" },
  { figure: "16", unit: "", label: "Districts" },
  { figure: "34", unit: "", label: "Tribes" },
];

export function Hero({ subjects }: { subjects: string[] }) {
  const reduce = useReducedMotion();
  const ambient = useAmbientEnabled(1024);
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const mediaY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.14]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      aria-label="Manipur, in one breath"
      data-hero-tone="dark"
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-ink-950"
    >
      {/* Layer 1 — the photograph */}
      <motion.div
        className="absolute inset-0 -z-30"
        style={reduce ? undefined : { y: mediaY, scale: mediaScale }}
      >
        <HeroMedia />
      </motion.div>

      {/* Layer 2 — ambient shader mist (decorative, optional) */}
      {ambient && !reduce && (
        <div className="pointer-events-none absolute inset-0 -z-20 opacity-60 mix-blend-screen">
          <HeroShader />
        </div>
      )}

      {/* Layer 3 — scrims. Sized to the copy rather than washed over the
          whole frame, so the phumdi rings still read as water and land. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-44 bg-gradient-to-b from-ink-950/70 to-transparent"
      />
      <div aria-hidden className="scrim-reading pointer-events-none absolute inset-0 -z-10" />
      <div aria-hidden className="scrim-copy pointer-events-none absolute inset-0 -z-10" />

      <motion.div
        className="shell relative pb-10 pt-40"
        style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
      >
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          className="mb-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-ivory-50/85"
        >
          <span className="font-mayek text-lg leading-none text-brass-400">ꯃꯅꯤꯄꯨꯔ</span>
          <span aria-hidden className="h-px w-8 bg-brass-400/50" />
          <span className="eyebrow">Manipur · North East India</span>
        </motion.p>

        <h1 className="text-display max-w-[16ch] text-ivory-50">
          {HEADLINE.map((line, i) => (
            <span key={line.key} className="block overflow-hidden pb-[0.06em]">
              <motion.span
                className="block"
                initial={reduce ? false : { y: "106%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.85, ease: EASE, delay: 0.16 + i * 0.09 }}
              >
                {line.text}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.55 }}
          className="text-lead mt-7 flex max-w-2xl items-baseline gap-2.5 text-ivory-50/80"
        >
          <span className="shrink-0">and</span>
          <RotatingSubjects subjects={subjects} />
        </motion.p>
        <p className="sr-only">Also in Manipur: {subjects.join(", ")}.</p>

        {/* The instrument rail — search, index figures and the scroll cue
            share one ruled band so the fold ends on a hard horizontal. */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.64 }}
          className="mt-12 border-t border-ivory-50/20 pt-8"
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
            <HeroSearch />

            <div className="flex items-start gap-8 sm:gap-12">
              <dl className="flex gap-8 sm:gap-12">
                {INDEX.map((item) => (
                  <div key={item.label}>
                    <dd className="font-display text-3xl leading-none text-ivory-50 sm:text-4xl">
                      {item.figure}
                      {item.unit && (
                        <span className="ml-0.5 align-top text-base text-brass-400">
                          {item.unit}
                        </span>
                      )}
                    </dd>
                    <dt className="eyebrow mt-2.5 text-ivory-50/55">{item.label}</dt>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between pr-0 lg:pr-56">
            <Link
              href="#layers"
              className="group inline-flex items-center gap-3 text-ivory-50/70 transition-colors hover:text-ivory-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <span className="grid size-9 place-items-center rounded-full border border-ivory-50/25 transition-colors group-hover:border-brass-400 group-hover:text-brass-400">
                <ArrowDown aria-hidden className="size-4 animate-float-slow" />
              </span>
              <span className="eyebrow">Manipur in four layers</span>
            </Link>

            {/* Where the photograph was taken. The caption is the detail
                that makes the image read as reportage, not stock. */}
            <p className="eyebrow hidden text-ivory-50/40 md:block">
              Loktak Lake, Bishnupur · 24.5°N 93.8°E
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
