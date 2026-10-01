import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { BandHeader } from "./band";

/**
 * The site's signature scroll chapter, and the ONLY pinned section on the page.
 *
 * Scroll-driven storytelling is catalogued as high accessibility risk and is
 * explicitly not recommended on mobile, so this is built to the most
 * conservative shape that still delivers the effect:
 *
 * - It is a **Server Component with no JavaScript at all**. The chapter stack is
 *   four `position: sticky` panels sharing one parent, which the browser layers
 *   for free as you scroll. Nothing listens to the wheel, nothing is pinned by
 *   script, and the page can never be scroll-jacked.
 * - The reduced-motion and mobile paths are CSS media queries (`motion-reduce:`
 *   and the `md:` breakpoint), not React branches. That sidesteps the hydration
 *   trap documented in `src/components/motion/reveal.tsx` entirely: there is no
 *   `useReducedMotion()` here to be null during SSR, because the decision never
 *   reaches React.
 * - Every layer's full text is in the DOM, in order, in one copy, at all times.
 *   With scroll effects disabled (reduced motion, a narrow screen, or no JS),
 *   the chapter degrades to four stacked articles that read top to bottom and
 *   lose nothing but the layering.
 *
 * The split is a deliberate 42/58 rather than a symmetric half: the copy sits in
 * the narrow column on a solid ground, so it is never set over a photograph and
 * never depends on a scrim holding 4.5:1.
 */

interface Layer {
  key: string;
  index: string;
  eyebrow: string;
  mayek: string;
  title: string;
  body: string;
  image: string;
  alt: string;
  href: string;
  cta: string;
}

const LAYERS: Layer[] = [
  {
    key: "water",
    index: "01",
    eyebrow: "Water",
    mayek: "ꯏꯁꯤꯡ",
    title: "Loktak, the lake with a floor that moves",
    body: "Rafts of matted vegetation (phumdi) drift across 287 km² of fresh water, cut into rings by fishermen. People live on them. Whole huts, whole mornings, afloat.",
    image: "/file-uploads/loktakComplete.png",
    alt: "Loktak Lake from the air at dawn, its circular and square phumdi fish pens forming a green honeycomb across still water.",
    href: "/hotspots",
    cta: "Places on the water",
  },
  {
    key: "hills",
    index: "02",
    eyebrow: "Hills",
    mayek: "ꯆꯤꯡ",
    title: "Shirui, the hill that flowers once a year",
    body: "The Shirui lily grows on one ridge in Ukhrul and nowhere else on earth. For a few weeks around June the grass goes pink, and the whole district walks up to look.",
    image: "/file-uploads/ukhrul-hill-haze.webp",
    alt: "Layered hills fading into blue haze above a village of tin roofs in Ukhrul district.",
    href: "/hotspots",
    cta: "Places in the hills",
  },
  {
    key: "heritage",
    index: "03",
    eyebrow: "Heritage",
    mayek: "ꯀꯪꯂꯥ",
    title: "Kangla, where the kings kept the river",
    body: "The old seat of Manipur's rulers sits on the Imphal river bank: white kanglasha guarding the gate, a coronation ground, moats and shrines still tended.",
    image: "/file-uploads/kangla-kanglasha.webp",
    alt: "The white kanglasha (dragon-lion guardians) standing on the brick forecourt inside Kangla Fort, Imphal.",
    href: "/explore/kangla",
    cta: "Kangla in 3D",
  },
  {
    key: "weave",
    index: "04",
    eyebrow: "Weave",
    mayek: "ꯐꯤ",
    title: "The loom in every courtyard",
    body: "Manipur weaves at home. Phanek, innaphi, moirangphee: patterns that say where a woman is from, made on a loin loom under the house eaves.",
    image: "/file-uploads/phanek.jpeg",
    alt: "Folded Manipuri handloom cloth in crimson, saffron, magenta and green, each piece showing its woven temple-spire border.",
    href: "/experiences",
    cta: "Sit at a loom",
  },
];

/** Static so Tailwind sees every class; sticky panels must stack in order. */
const LAYER_Z = ["z-10", "z-20", "z-30", "z-40"];

export function LayersNarrative() {
  return (
    <section id="layers" className="chapter-dark" aria-label="Manipur in four layers">
      <div className="shell pt-[clamp(4.5rem,9vw,7.5rem)] pb-[clamp(2.5rem,5vw,4rem)]">
        <BandHeader
          tone="dark"
          eyebrow="The long read"
          word="Manipur, in four layers."
          completion="Water, hills, heritage, and a loom under every eave."
          standfirst="One state, read the way it is actually built, from the lake floor up through the ridges to the thread. Four chapters; keep scrolling and they stack."
          className="mb-0 border-b-0 pb-0 md:mb-0 md:pb-0"
        />
      </div>

      {/* Four sticky siblings in one parent. The browser pins each in turn and
          the next slides over it: the whole effect, with no script. */}
      <div className="relative">
        {LAYERS.map((layer, i) => (
          <article
            key={layer.key}
            className={cn(
              "relative overflow-hidden border-t border-ivory-50/14 bg-ink-950 md:min-h-[34rem]",
              "md:motion-safe:sticky md:motion-safe:top-0 md:motion-safe:h-[100svh]",
              LAYER_Z[i],
            )}
          >
            <div className="grid h-full md:grid-cols-[42fr_58fr]">
              <div className="order-2 flex flex-col justify-center px-4 py-12 md:order-1 md:px-[clamp(2rem,4vw,4rem)] md:py-16">
                <p className="eyebrow rule-flank rule-flank-start mb-7 text-brass-400">
                  <span className="font-mayek text-base normal-case tracking-normal">
                    {layer.mayek}
                  </span>
                  <span>
                    {layer.index} · {layer.eyebrow}
                  </span>
                </p>

                <h3 className="font-display text-[clamp(1.875rem,1.15rem+2.5vw,3.125rem)] leading-[1.06] tracking-[-0.018em] text-ivory-50">
                  {layer.title}
                </h3>

                <p className="mt-6 max-w-[44ch] text-base leading-relaxed text-ivory-50/78">
                  {layer.body}
                </p>

                <Link
                  href={layer.href}
                  className="group/link mt-9 inline-flex w-fit items-center gap-2 border-b border-brass-400/45 pb-1.5 text-sm font-medium text-brass-300 transition-colors duration-200 ease-[var(--ease-flat)] hover:border-brass-300 hover:text-brass-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  {layer.cta}
                  <ArrowUpRight
                    aria-hidden
                    className="size-4 transition-transform duration-200 ease-[var(--ease-flat)] group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
                  />
                </Link>
              </div>

              <div className="relative order-1 aspect-[4/3] w-full md:order-2 md:aspect-auto md:h-full">
                <Image
                  src={layer.image}
                  alt={layer.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 58vw"
                  className="object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/10 to-transparent md:bg-gradient-to-r md:from-ink-950 md:via-ink-950/15 md:to-transparent"
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
