import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";
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
}

const WAYS: Way[] = [
  {
    href: "/hotspots",
    index: "01",
    label: "Places",
    mayek: "ꯃꯐꯝ",
    title: "Lakes, forts and a hill of lilies",
    blurb: "Sixty-odd places across sixteen districts — from Loktak's phumdis to Shirui Kashong.",
    image: "/file-uploads/Hills.jpg",
    alt: "Rolling green hills of Manipur disappearing into low morning mist.",
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
    image: "/file-uploads/uhk.jpg",
    alt: "A traditional Manipuri homestay courtyard shaded by trees.",
    className: "md:col-span-2 min-h-[16rem] md:min-h-[16.5rem]",
    sizes: "(max-width: 768px) 100vw, 40vw",
  },
  {
    href: "/experiences",
    index: "03",
    label: "Experiences",
    mayek: "ꯊꯧꯗꯣꯛ",
    title: "Weave, paddle, cook, dance",
    blurb: "Half-day crafts and rituals, hosted by the people who keep them.",
    image: "/file-uploads/dance.jpg",
    alt: "Dancers in white Manipuri Raas costume with conical veils performing at a festival.",
    className: "md:col-span-2 min-h-[16rem] md:min-h-[16.5rem]",
    sizes: "(max-width: 768px) 100vw, 40vw",
  },
  {
    href: "/eateries",
    index: "04",
    label: "Eat",
    mayek: "ꯆꯥꯛ",
    title: "Eromba, singju, chak-hao",
    blurb: "Fermented, smoked, wrapped in leaf — the valley's kitchen, mapped.",
    image: "/file-uploads/imafoo.jpg",
    alt: "A spread of Manipuri curries and chutneys served in small steel bowls.",
    className: "md:col-span-5 min-h-[16rem] md:min-h-[15rem]",
    sizes: "(max-width: 768px) 100vw, 92vw",
  },
];

export function FourWays() {
  return (
    <section className="chapter-light pb-[var(--space-block)]">
      <div className="shell">
        {/* Masthead: title left, standfirst right. The right column exists so
            the band does not open on half a screen of empty ivory. */}
        <Reveal className="mb-10 grid gap-8 border-b border-border-strong pb-10 md:mb-14 md:grid-cols-[1.15fr_1fr] md:gap-16">
          <div>
            <p className="eyebrow mb-5 flex items-center gap-3 text-muted-foreground">
              <span className="weave-rule inline-block h-[3px] w-10 rounded-full" />
              Four ways in
            </p>
            <h2 className="font-display text-[2rem] leading-[1.05] tracking-[-0.015em] sm:text-5xl">
              Pick a door. They all open on the same valley.
            </h2>
          </div>
          <p className="text-lead self-end text-muted-foreground">
            There is no single route through Manipur. Come for the water and you will end up at
            a loom; come for the food and you will end up on a hill. Start wherever you like.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-4">
          {WAYS.map((way, i) => (
            <Reveal key={way.href} delayIndex={i} className={cn("group", way.className)}>
              <Link
                href={way.href}
                className="relative block size-full overflow-hidden rounded-[var(--radius)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                <Image
                  src={way.image}
                  alt={way.alt}
                  fill
                  sizes={way.sizes}
                  className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                />
                <div aria-hidden className="scrim-copy absolute inset-0" />

                {/* Index in the corner — the mono tick that makes the grid
                    read as a contents page rather than four loose tiles. */}
                <p className="eyebrow absolute left-6 top-6 text-ivory-50/60 md:left-7 md:top-7">
                  {way.index}
                </p>

                <div className="relative flex size-full flex-col justify-end p-6 md:p-7">
                  <p className="eyebrow mb-3 flex items-center gap-3 text-brass-400">
                    <span className="font-mayek text-sm normal-case tracking-normal">
                      {way.mayek}
                    </span>
                    {way.label}
                  </p>
                  <h3 className="font-display text-2xl leading-[1.1] text-ivory-50 md:text-[1.75rem]">
                    {way.title}
                  </h3>
                  <p className="mt-2.5 max-w-md text-sm leading-relaxed text-ivory-50/75">
                    {way.blurb}
                  </p>
                </div>

                <span
                  aria-hidden
                  className="absolute right-5 top-5 grid size-10 place-items-center rounded-full border border-ivory-50/30 text-ivory-50 transition-all duration-300 group-hover:border-brass-400 group-hover:bg-brass-400 group-hover:text-ink-950"
                >
                  <ArrowUpRight className="size-4" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
