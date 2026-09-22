import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";

interface Tradition {
  name: string;
  meitei?: string;
  body: string;
  href: string;
  cta: string;
}

const TRADITIONS: Tradition[] = [
  {
    name: "Handloom",
    meitei: "ꯐꯤ",
    body: "Cloth in Manipur is counted thread by thread on a loin loom, usually on a verandah, usually by a woman who learned it from her mother. The Moirang Phee border — a stepped temple spire — is carried in the head, not on a pattern card.",
    href: "/experiences/handloom-weaving-with-a-moirang-phee-weaver",
    cta: "Sit at the loom yourself",
  },
  {
    name: "Andro pottery",
    body: "The potters of Andro build every vessel by hand, without a wheel at all, then fire it in an open pit until the clay turns black. It is one of the last wheel-less pottery traditions left in India.",
    href: "/experiences/andro-black-pottery-workshop",
    cta: "Shape a pot in Andro",
  },
  {
    name: "Bamboo and cane",
    body: "Split, shaved, soaked and woven while damp so the weave tightens as it dries — the same grammar makes a fish trap, a grain store and the conical basket carried up a hill path.",
    href: "/experiences/bamboo-and-cane-craft-workshop",
    cta: "Weave with cane",
  },
  {
    name: "Silk",
    body: "Manipur rears its own silk, the golden muga and the softer eri among it. A shawl is judged by how it falls rather than by any measure, and the end-bands are the weaver's signature.",
    href: "/experiences?category=textile",
    cta: "Find a textile experience",
  },
];

/**
 * The traditions behind the catalogue — and the route from owning the object
 * to making one.
 */
export function CraftTraditions() {
  return (
    <section aria-labelledby="traditions-heading" className="border-t border-border pt-14">
      <p className="eyebrow flex items-center gap-3 text-muted-foreground">
        <span className="weave-rule inline-block h-[3px] w-10 rounded-full" />
        What you are actually buying
      </p>
      <h2 id="traditions-heading" className="text-headline mt-4 max-w-3xl">
        Four traditions, still in working hands
      </h2>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        None of these are heritage in the museum sense. They are working trades, and you can spend a
        morning inside any of them.
      </p>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2">
        {TRADITIONS.map((tradition, index) => (
          <Reveal
            as="li"
            key={tradition.name}
            delayIndex={index}
            className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-6"
          >
            <h3 className="font-display text-xl leading-tight">
              {tradition.name}
              {tradition.meitei && (
                <span className="font-mayek ml-2 text-base text-muted-foreground">
                  {tradition.meitei}
                </span>
              )}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{tradition.body}</p>
            <Link
              href={tradition.href}
              className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {tradition.cta}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
