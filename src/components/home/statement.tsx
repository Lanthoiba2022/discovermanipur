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
  // the sentence sat around 1.6:1 against the ivory ground, unreadable if the
  // scroll link never fires. The floor here is `--ink-500` (#6b5f54), which
  // measures 5.85:1 on `--ivory-50`, so the whole sentence clears 4.5:1 at
  // every point in the sweep and the reveal is a warming, not a switching on.
  // `--ink-400` was tried first and only makes 3.68:1, large-text AA, but the
  // floor here is deliberately held to the small-text bar.
  const color = useTransform(progress, [start, end], ["var(--ink-500)", "var(--ink-900)"]);
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
  // effect, after hydration has matched, before the browser paints.
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

  // `tabular-nums` so the digits do not reflow the label under them while the
  // count runs: the figure animates, the layout does not.
  return (
    <span
      ref={ref}
      className="font-display text-5xl leading-none tabular-nums text-primary md:text-6xl"
    >
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
      {/* One rung down the measure ladder from the hero's `.shell`: the page
          starts to narrow here, and the opener runs on an asymmetric 42/58
          split so the standfirst column and the sentence are visibly unequal
          rather than two matching halves. */}
      <div className="shell-mid">
        <div className="grid gap-10 md:grid-cols-[minmax(0,42fr)_minmax(0,58fr)] md:gap-14 lg:gap-20">
          <div className="md:pt-3">
            <p className="rule-flank rule-flank-start eyebrow text-stone-700">Why Manipur</p>
            <p className="section-completion mt-7 max-w-[22ch] text-terracotta-700">
              Nowhere else stacks its water, its land and its living this way.
            </p>
          </div>

          <div ref={ref}>
            <p className="font-display text-[1.75rem] leading-[1.3] tracking-[-0.015em] sm:text-[2.125rem] md:text-[2.5rem] md:leading-[1.24]">
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
