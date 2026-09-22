import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

export function ClosingCta() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/file-uploads/sangolKangjei.jpg"
          alt="Riders in traditional dress playing sagol kangjei, Manipuri polo, on a grass field at golden hour."
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div aria-hidden className="absolute inset-0 bg-loktak-900/72" />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent"
        />
      </div>

      <div className="shell relative py-28 md:py-40">
        <Reveal className="flex flex-col items-center text-center">
          <div className="blob-phumdi mask-phumdi animate-float-slow relative mb-10 size-40 overflow-hidden md:size-52">
            <Image
              src="/file-uploads/shiroi4.jpg"
              alt="A Shirui lily in bloom on the grassy slopes of Shirui Kashong peak in Ukhrul."
              fill
              sizes="(max-width: 768px) 10rem, 13rem"
              className="object-cover"
            />
          </div>

          <p className="font-mayek mb-5 text-lg text-brass-400">ꯃꯅꯤꯄꯨꯔ</p>
          <h2 className="text-display max-w-4xl text-cream-50">Come and wander.</h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-cream-50/78 md:text-lg">
            Build a route through the valley and the hills in a few minutes — then go, and
            let it change on you.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="accent" size="lg">
              <Link href="/plan">
                Start planning
                <ArrowUpRight aria-hidden className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-cream-50/40 text-cream-50 hover:bg-cream-50/10"
            >
              <Link href="/hotspots">Browse places first</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
