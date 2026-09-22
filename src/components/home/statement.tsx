"use client";

import type { Stat } from "@/lib/data/seed/site-content";
import { motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";



/** `useLayoutEffect` that degrades to a no-op during SSR. */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function Word({
  word,
  start,
  end,
  progress,
}: {
  word: string;
  start: number;
  end: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  // The unread state is a dimmed *colour*, not a low opacity. At 0.22 opacity
  // the sentence sat around 1.6:1 against the ivory ground — unreadable if the
  // scroll link never fires. The floor here stays above 4.5:1 throughout.
  const color = useTransform(
    progress,
    [start, end],
    ["var(--ink-400)", "var(--ink-900)"],
  );
  // The space has to live OUTSIDE the inline-block: a trailing space that is
  // the last content inside an inline-block is collapsed away, which butts
  // every word up against the next one.
  return (
    <>
      <motion.span style={{ color }} className="inline-block">
        {word}
      </motion.span>{" "}
    </>
  );
}

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  // The server renders the real figure, so a client that never runs the
  // animation (no JS, reduced motion, observer never fires) still shows the
  // true number rather than a permanent zero. The zeroing happens in a layout
  // effect — after hydration has matched, before the browser paints.
  const [shown, setShown] = useState(value);
  const [armed, setArmed] = useState(false);

  useIsomorphicLayoutEffect(() => {
    if (reduce) return;
    setShown(0);
    setArmed(true);
  }, [reduce]);

  useEffect(() => {
    if (reduce || !armed || !inView) return;
    let frame = 0;
    const duration = 1100;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduce, armed, value]);

  return (
    <span ref={ref} className="font-display text-5xl leading-none text-primary md:text-6xl">
      {shown >= 1000 ? shown.toLocaleString("en-IN") : shown}
      <span className="text-3xl md:text-4xl">{suffix}</span>
    </span>
  );
}

export function Statement({ statement, stats }: { statement: string; stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.5"],
  });

  const words = statement.split(" ");

  return (
    <section className="chapter-light py-[var(--space-section)]">
      <div className="shell">
        {/* Editorial masthead: the section tag and the measure sit on one
            baseline grid, the way a magazine opener runs a standfirst. */}
        <div className="grid gap-10 md:grid-cols-[10rem_1fr] md:gap-16">
          <div>
            <p className="eyebrow flex items-center gap-3 text-muted-foreground md:flex-col md:items-start md:gap-4">
              <span className="weave-rule inline-block h-[3px] w-10 rounded-full" />
              Why Manipur
            </p>
          </div>

          <div ref={ref}>
            <p className="max-w-4xl font-display text-[1.75rem] leading-[1.28] tracking-[-0.015em] sm:text-4xl md:text-[2.75rem] md:leading-[1.22]">
              {words.map((word, i) => (
                <Word
                  key={`${word}-${i}`}
                  word={word}
                  start={i / words.length}
                  end={Math.min(1, (i + 6) / words.length)}
                  progress={scrollYProgress}
                />
              ))}
            </p>
          </div>
        </div>

        {/* The figures as a ruled index rather than four loose columns. */}
        <dl className="mt-[var(--space-block)] grid grid-cols-1 gap-x-10 border-t border-border-strong sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="border-b border-border py-9 lg:border-b-0 lg:border-r lg:pr-10 lg:last:border-r-0"
            >
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <Counter value={s.value} suffix={s.suffix} />
                <p className="eyebrow mt-5 text-foreground">{s.label}</p>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{s.note}</p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
