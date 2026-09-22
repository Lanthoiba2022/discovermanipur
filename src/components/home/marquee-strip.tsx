import { getMarqueeWords } from "@/lib/data/content";
import { cn } from "@/lib/utils";


function Track({ words, ariaHidden }: { words: string[]; ariaHidden?: boolean }) {
  return (
    <ul
      aria-hidden={ariaHidden}
      className="flex shrink-0 items-center gap-10 pr-10 md:gap-14 md:pr-14"
    >
      {words.map((word) => (
        <li key={word} className="flex items-center gap-10 md:gap-14">
          <span className="font-display text-xl text-cream-50/85 md:text-2xl">{word}</span>
          <span aria-hidden className="size-1.5 rounded-full bg-kangla-500/70" />
        </li>
      ))}
    </ul>
  );
}

/**
 * Drifting band of Manipuri place, festival and dish names.
 * Pure CSS marquee — pauses on hover and on keyboard focus within.
 */
export async function MarqueeStrip({ className }: { className?: string }) {
  const words = await getMarqueeWords();

  return (
    <section
      aria-label="Names you will meet in Manipur"
      className={cn("relative overflow-hidden border-y border-loktak-700/40 bg-loktak-900 py-5", className)}
    >
      <div className="group flex w-max">
        <div className="flex w-max animate-drift group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
          <Track words={words} />
          <Track words={words} ariaHidden />
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-loktak-900 to-transparent md:w-28"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-loktak-900 to-transparent md:w-28"
      />
    </section>
  );
}
