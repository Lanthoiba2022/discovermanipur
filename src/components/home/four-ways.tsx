import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

interface Way {
  href: string;
  index: string;
  label: string;
  mayek: string;
  title: string;
  blurb: string;
  image: string;
  alt: string;
  className: string;
  sizes: string;
  /** Gateway-arch silhouette instead of the default rounded rectangle. */
  arch?: boolean;
}

/**
 * Photography note — every file below was opened and checked before it was
 * used. The inherited photo library contains mis-filed stock (`uhk.jpg` is a
 * European chalet, `imafoo.jpg` is a 399x265 snapshot far too small for this
 * band), so open any replacement before using it. Credited Wikimedia files are
 * listed in `src/lib/data/photo-credits.ts`.
 */
const WAYS: Way[] = [
  {
    href: "/hotspots",
    index: "01",
    label: "Places",
    mayek: "ꯃꯐꯝ",
    title: "Lakes, forts and a hill of lilies",
    blurb: "Sixty-odd places across sixteen districts — from Loktak's phumdis to Shirui Kashong.",
    image: "/file-uploads/Hills.jpg",
    alt: "Grass-covered hills rolling into a valley floor of low white mist at first light.",
    className: "md:col-span-3 md:row-span-2 min-h-[22rem] md:min-h-[34rem]",
    sizes: "(max-width: 768px) 100vw, 60vw",
  },
  {
    href: "/homestays",
    index: "02",
    label: "Stays",
    mayek: "ꯌꯨꯝ",
    title: "Sleep inside the story",
    blurb: "Family homestays on the lake edge and in the hills.",
    image: "/file-uploads/loktak-phumdi-hut.webp",
    alt: "A two-roomed stilt house with tin cone roofs standing alone on a floating phumdi island in Loktak Lake.",
    className: "md:col-span-2 min-h-[16rem] md:min-h-[16.5rem]",
    sizes: "(max-width: 768px) 100vw, 40vw",
    arch: true,
  },
  {
    href: "/experiences",
    index: "03",
    label: "Experiences",
    mayek: "ꯊꯧꯗꯣꯛ",
    title: "Weave, paddle, cook, dance",
    blurb: "Half-day crafts and rituals, hosted by the people who keep them.",
    image: "/file-uploads/dance.jpg",
    alt: "A Manipuri Raas dancer under a stiff conical veil, hands raised mid-gesture among a row of other dancers.",
    className: "md:col-span-2 min-h-[16rem] md:min-h-[16.5rem]",
    sizes: "(max-width: 768px) 100vw, 40vw",
    arch: true,
  },
  {
    href: "/eateries",
    index: "04",
    label: "Eat",
    mayek: "ꯆꯥꯛ",
    title: "Eromba, singju, chak-hao",
    blurb: "Fermented, smoked, wrapped in leaf — the valley's kitchen, mapped.",
    // A landscape frame on purpose: this tile is a ~5.5:1 letterbox, and a
    // portrait photo crops down to a thin band of out-of-focus background.
    image: "/file-uploads/manipuri-food-leaf.webp",
    alt: "Manipuri food laid out on a banana leaf — fried cakes, dried fish and a mound of rice.",
    className: "md:col-span-5 min-h-[16rem] md:min-h-[15rem]",
    sizes: "(max-width: 768px) 100vw, 92vw",
  },
];

/**
 * Tile entrance, as CSS rather than as a motion library.
 *
 * This band is otherwise a pure Server Component — four links and four
 * images — and it stays one: shipping a client bundle to stagger a fade
 * would be the whole cost of the section for none of its value.
 *
 * `--ease-spring` overshoots and settles, which is exactly what an entrance
 * wants and exactly what a heading being read does not; that is why the hero
 * uses `--ease-flat` and this uses the spring.
 *
 * Where the browser has scroll-driven animations the reveal is tied to the
 * tile's own pass through the viewport, so it cannot have finished before the
 * reader arrives. Everywhere else it runs once on load, which is the standard
 * graceful degradation. Reduced motion drops the animation entirely, leaving
 * every tile in its natural, fully visible state.
 */
const ENTRANCE_CSS = `
@keyframes four-ways-rise {
  from { opacity: 0; transform: translate3d(0, 2rem, 0); }
  to   { opacity: 1; transform: none; }
}
.four-ways-tile {
  animation: four-ways-rise 520ms var(--ease-spring) both;
  animation-delay: calc(var(--tile-i, 0) * 90ms);
}
@supports (animation-timeline: view()) {
  .four-ways-tile {
    animation-delay: 0s;
    animation-timeline: view();
    animation-range: entry calc(4% + var(--tile-i, 0) * 6%) entry calc(62% + var(--tile-i, 0) * 6%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .four-ways-tile { animation: none; }
}
`;

export function FourWays() {
  return (
    // `bg-surface-sand` rather than a second helping of ivory: the statement
    // band directly above is `chapter-light`, and two identical grounds in a
    // row is what makes a long marketing page read as one endless section.
    <section
      aria-labelledby="four-ways-title"
      className="bg-surface-sand py-[var(--space-section)] text-foreground"
    >
      <style href="four-ways-entrance" precedence="medium">
        {ENTRANCE_CSS}
      </style>

      <div className="shell">
        {/* Masthead: the rule-flanked tag, the calm display line, then the
            italic line that finishes the sentence. The standfirst on the
            right keeps the band from opening on half a screen of empty sand. */}
        <div className="mb-11 grid gap-9 border-b border-border-strong pb-11 md:mb-16 md:grid-cols-[1.15fr_1fr] md:items-end md:gap-16">
          <div>
            <p className="rule-flank rule-flank-start eyebrow mb-6 text-stone-700">Four ways in</p>
            <h2 id="four-ways-title" className="section-word max-w-[12ch]">
              Pick a door.
            </h2>
            <p className="section-completion mt-4 text-terracotta-700">
              They all open on the same valley.
            </p>
          </div>
          <p className="text-lead self-end text-muted-foreground">
            There is no single route through Manipur. Come for the water and you will end up at a
            loom; come for the food and you will end up on a hill. Start wherever you like.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-4">
          {WAYS.map((way, i) => (
            <div
              key={way.href}
              style={{ "--tile-i": i } as CSSProperties}
              className={cn("four-ways-tile group", way.className)}
            >
              <Link
                href={way.href}
                className={cn(
                  "relative block size-full overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
                  // The Manipuri gateway profile — domed head, square
                  // shoulders — on the stacked pair in the right column, so
                  // the band reads as two doorways beside one open view
                  // rather than four identical cards. It is deliberately kept
                  // off the tall tile, where the same percentage radii sweep
                  // into a full ellipse and eat the photograph.
                  way.arch ? "mask-arch" : "rounded-[var(--radius)]",
                )}
              >
                {/* `.media-recede` holds the photograph back at rest and lets
                    it bloom to full colour on hover or keyboard focus — the
                    depth payoff, for no JavaScript at all. It lives on the
                    wrapper so its `filter` transition and the image's own
                    `transform` transition do not overwrite one another. */}
                <div className="media-recede absolute inset-0 group-focus-within:[filter:saturate(1)_brightness(1)]">
                  <Image
                    src={way.image}
                    alt={way.alt}
                    fill
                    sizes={way.sizes}
                    className="object-cover transition-transform duration-[650ms] ease-[var(--ease-flat)] group-hover:scale-[1.04]"
                  />
                </div>
                <div aria-hidden className="scrim-copy absolute inset-0" />

                <div className="relative flex size-full flex-col justify-end p-6 md:p-7">
                  <p className="eyebrow mb-3.5 flex items-center gap-3 text-brass-300">
                    <span className="font-mayek text-sm normal-case tracking-normal">
                      {way.mayek}
                    </span>
                    {way.label}
                    {/* The contents-page tick, moved off the corner so the
                        arched tiles do not crop it. */}
                    <span className="ml-auto text-ivory-50/65">{way.index}</span>
                  </p>

                  <div className="flex items-end justify-between gap-6">
                    <div>
                      <h3 className="text-title text-ivory-50">{way.title}</h3>
                      <p className="mt-2.5 max-w-md text-sm leading-relaxed text-ivory-50/80">
                        {way.blurb}
                      </p>
                    </div>
                    <span
                      aria-hidden
                      className="grid size-10 shrink-0 place-items-center rounded-full border border-ivory-50/30 text-ivory-50 transition-[background-color,border-color,color,transform] duration-[var(--dur-base)] ease-[var(--ease-flat)] group-hover:-translate-y-0.5 group-hover:border-brass-300 group-hover:bg-brass-300 group-hover:text-ink-950"
                    >
                      <ArrowUpRight className="size-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
