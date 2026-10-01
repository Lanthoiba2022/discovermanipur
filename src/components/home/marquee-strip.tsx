import { getMarqueeWords } from "@/lib/data/content";
import { cn } from "@/lib/utils";

/**
 * Marquee motion policy.
 *
 * Infinite decorative motion has three obligations. All three are settled
 * here, in CSS, with no client component:
 *
 *  1. PAUSE ON HOVER / FOCUS — `animation-play-state`, driven off the strip so
 *     a pointer anywhere on the band and a tab stop inside it both stop it.
 *  2. PREFERS-REDUCED-MOTION — `animation: none`. The blanket rule in
 *     `globals.css` only collapses the *duration*, which snaps a `-50%`
 *     keyframe straight to its end state and leaves the strip parked on the
 *     duplicated, `aria-hidden` half. Killing the animation by name instead
 *     leaves the readable copy at rest where it belongs.
 *  3. STOP WHEN OFF-SCREEN — where scroll-driven animations exist the drift is
 *     bound to `view()`, so its progress is a function of the strip's position
 *     in the viewport and it provably does not tick while the band is not on
 *     screen. `content-visibility: auto` covers the remaining browsers by
 *     letting them skip the strip's rendering work altogether while it is out
 *     of view; `contain-intrinsic-size` keeps the skipped box the right height
 *     so nothing below it jumps.
 *
 * The scroll-linked keyframe travels less than the looping one because it has
 * one viewport pass to spend rather than a minute; anything under -50% is
 * still covered by the duplicate track, so there is no visible seam.
 */
const MARQUEE_CSS = `
@keyframes marquee-loop {
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(-50%, 0, 0); }
}
@keyframes marquee-scrub {
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(-22%, 0, 0); }
}
.marquee-track {
  animation: marquee-loop 52s linear infinite;
}
.marquee-strip:hover .marquee-track,
.marquee-strip:focus-within .marquee-track {
  animation-play-state: paused;
}
@supports (animation-timeline: view()) {
  .marquee-track {
    animation: marquee-scrub auto linear both;
    animation-timeline: view();
    animation-range: cover 0% cover 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .marquee-track { animation: none; }
}
`;

function Track({ words, ariaHidden }: { words: string[]; ariaHidden?: boolean }) {
  return (
    <ul
      aria-hidden={ariaHidden}
      className="flex shrink-0 items-center gap-10 pr-10 md:gap-14 md:pr-14"
    >
      {words.map((word) => (
        <li key={word} className="flex items-center gap-10 md:gap-14">
          <span className="font-display text-xl text-ivory-50/90 md:text-2xl">{word}</span>
          {/* Decorative tick only — brass-500 never carries text. */}
          <span aria-hidden className="size-1.5 rotate-45 bg-brass-500/80" />
        </li>
      ))}
    </ul>
  );
}

/** Drifting band of Manipuri place, festival and dish names. */
export async function MarqueeStrip({ className }: { className?: string }) {
  const words = await getMarqueeWords();

  return (
    <section
      aria-label="Names you will meet in Manipur"
      className={cn(
        "marquee-strip relative overflow-hidden border-y border-ink-800 bg-ink-950 py-5",
        "[contain-intrinsic-size:auto_4.5rem] [content-visibility:auto]",
        className,
      )}
    >
      <div className="flex w-max">
        <div className="marquee-track flex w-max">
          <Track words={words} />
          <Track words={words} ariaHidden />
        </div>
      </div>

      <style href="marquee-strip" precedence="medium">
        {MARQUEE_CSS}
      </style>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-ink-950 to-transparent md:w-28"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-ink-950 to-transparent md:w-28"
      />
    </section>
  );
}
