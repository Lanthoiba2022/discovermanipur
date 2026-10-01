"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The state's name, in the three scripts it is actually written in.
 *
 * Sizes are tuned per script rather than shared: at one font-size the Meetei
 * Mayek sits visibly smaller than the Latin and the Devanagari visibly larger,
 * because the three have different cap/x-height conventions. These multipliers
 * make them read as one wordmark rotating, not three words of different sizes.
 */
const SCRIPTS = [
  { key: "latn", text: "Manipur", className: "font-display", scale: "1em" },
  { key: "mtei", text: "ꯃꯅꯤꯄꯨꯔ", className: "font-mayek", scale: "0.74em" },
  { key: "deva", text: "मणिपुर", className: "font-devanagari", scale: "0.82em" },
] as const;

/**
 * One full step is ~960ms of handover (see below), so the dwell has to clear
 * it comfortably or the wordmark reads as permanently in motion.
 */
const DWELL_MS = 3600;

/**
 * The hero wordmark, cycling through Meetei Mayek, Latin and Devanagari.
 *
 * Three things this has to get right:
 *
 * 1. **The accessible name never changes.** A heading whose text rotates every
 *    few seconds is a heading with no stable name, and the section is labelled
 *    by it. So the real name is a visually-hidden "Manipur" and every rotating
 *    glyph is `aria-hidden` decoration. Screen readers read one word, once.
 *
 * 2. **Nothing reflows.** The three words are different widths and heights, so
 *    they are stacked in a single grid cell (`[grid-area:1/1]`) rather than
 *    swapped in flow. The box sizes itself to the widest and tallest of the
 *    three and then never moves, so the lede below it cannot jump.
 *
 * 3. **It does not decide what renders.** `matchMedia` is read in an effect,
 *    after hydration; the first render is always index 0 on both server and
 *    client. Under reduced motion the cycle simply never starts, which leaves
 *    the Latin spelling on screen — the one a non-Manipuri reader can read.
 */
export function RotatingWordmark({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!motionOk) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      timer ??= setInterval(() => setIndex((i) => (i + 1) % SCRIPTS.length), DWELL_MS);
    };
    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };
    // A tab in the background has no reader; keep the timer off there.
    const sync = () => (document.hidden ? stop() : start());

    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <span className={cn("grid justify-items-center", className)}>
      <span className="sr-only">Manipur</span>

      {SCRIPTS.map((script, i) => (
        <span
          key={script.key}
          aria-hidden
          lang={script.key === "mtei" ? "mni-Mtei" : script.key === "deva" ? "hi" : "en"}
          style={{ fontSize: script.scale }}
          /* A HANDOVER, not a cross-dissolve.
             Fading both scripts at once puts two different alphabets on the
             same spot at half opacity each, which reads as a smudge rather
             than a change — and adding a blur makes it worse. So the
             outgoing word leaves on its own (340ms), and only then does the
             incoming one begin (620ms, starting at 340ms). They never share
             the screen, the movement is pure opacity, and the eye reads one
             word dissolving into the next. */
          className={cn(
            "col-start-1 row-start-1 block whitespace-nowrap leading-[1.05] [will-change:opacity]",
            "transition-opacity motion-reduce:transition-none",
            script.className,
            i === index
              ? "opacity-100 duration-[620ms] delay-[340ms] ease-out"
              : "pointer-events-none opacity-0 duration-[340ms] delay-0 ease-in",
          )}
        >
          {script.text}
        </span>
      ))}
    </span>
  );
}
