import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { Reveal } from "@/components/motion/reveal";

/**
 * The last rung of the measure ladder (44rem) and the page's final conversion
 * moment.
 *
 * One primary call to action. "Browse places first" is deliberately demoted to
 * a text link rather than a second button, so there is no ambiguity about what
 * the page wants next.
 *
 * The backdrop photograph is held permanently in `.media-recede` (desaturated
 * and dimmed), which is what lets ivory type sit on it at full strength: the
 * measured contrast of `ivory-50` over the treated photograph plus its scrim is
 * well past 4.5:1 everywhere the copy lands, and the accent button's ink-950
 * label is 6.4:1 on its own brass fill.
 */
export function ClosingCta() {
  return (
    <section className="relative overflow-hidden" aria-label="Start planning">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/file-uploads/sangolKangjei.jpg"
          alt="Riders in traditional dress playing sagol kangjei, Manipuri polo, on a grass field at golden hour."
          fill
          sizes="100vw"
          className="media-recede object-cover object-center"
        />
        <div aria-hidden className="absolute inset-0 bg-ink-950/45" />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-ink-950/92 via-ink-950/55 to-ink-950/30"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background to-transparent"
        />
      </div>

      <div className="shell-prose relative py-[clamp(6rem,12vw,10rem)]">
        <Reveal className="flex flex-col items-center text-center">
          <div className="mask-arch relative mb-9 h-48 w-40 overflow-hidden border border-ivory-50/25 md:h-64 md:w-52">
            <Image
              src="/file-uploads/dzukou-lily-valley.webp"
              alt="A pink lily in flower above the grass of Dzukou Valley, with mist lying on the ridge behind."
              fill
              sizes="(max-width: 768px) 10rem, 13rem"
              className="object-cover object-[26%_42%]"
            />
          </div>

          <p className="rule-flank mb-6 font-mayek text-xl text-brass-300">ꯃꯅꯤꯄꯨꯔ</p>

          <h2 className="text-display text-ivory-50">Come and wander.</h2>

          <p className="mt-7 max-w-lg text-base leading-relaxed text-ivory-50/82 md:text-lg">
            Build a route through the valley and the hills in a few minutes. Then
            go, and let it change on you.
          </p>

          <Button asChild variant="accent" size="lg" className="mt-10">
            <Link href="/plan">
              Start planning
              <ArrowUpRight aria-hidden className="size-4" />
            </Link>
          </Button>

          <Link
            href="/hotspots"
            className="mt-7 inline-flex items-center gap-2 border-b border-ivory-50/40 pb-1 text-sm text-ivory-50 transition-colors duration-200 ease-[var(--ease-flat)] hover:border-ivory-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Or browse the places first
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
