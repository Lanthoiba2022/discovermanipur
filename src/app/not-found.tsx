import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Compass } from "lucide-react";

import { SearchInput } from "@/components/search/search-input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "That page does not exist. Here is the way back into the catalogue: places, stays, experiences, food and tours across Manipur.",
  robots: { index: false, follow: false },
};

const WAYS_BACK = [
  { href: "/hotspots", label: "Places", blurb: "Lakes, hills, forts and floating islands" },
  { href: "/homestays", label: "Stays", blurb: "Live with a Manipuri family" },
  { href: "/experiences", label: "Experiences", blurb: "Weave, cook, paddle, celebrate" },
  { href: "/eateries", label: "Eat", blurb: "Eromba, singju and chak-hao" },
  { href: "/tours", label: "Tours", blurb: "Curated multi-day routes" },
  { href: "/festivals", label: "Festivals", blurb: "The year in colour and drum" },
];

export default function NotFound() {
  return (
    <div className="relative overflow-hidden pt-28 md:pt-32">
      {/* Soft background photograph, decorative only. */}
      <div className="mist-top pointer-events-none absolute inset-x-0 top-0 h-[60vh] opacity-20" aria-hidden="true">
        <Image
          src="/file-uploads/Hills.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          preload
        />
      </div>

      <div className="shell relative py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto mb-8 flex size-16 items-center justify-center rounded-full border border-border bg-surface text-primary">
            <Compass className="size-7 animate-float-slow" aria-hidden="true" />
          </span>

          <p className="eyebrow text-muted-foreground">Error 404</p>
          <h1 className="mt-5 text-headline">You have wandered off the map.</h1>
          <p className="mx-auto mt-6 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
            There is no page at this address. It may have moved, the link may have a typo in it, or
            it may be something we have not built yet. Wander back to the valley below.
          </p>

          <div className="mx-auto mt-10 max-w-lg text-left">
            <SearchInput
              size="lg"
              placeholder="Search for a place, a stay, a dish…"
              label="Search the site"
            />
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/">Back to the beginning</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/plan">Ask the AI concierge</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl md:mt-20">
          <p className="eyebrow mb-5 text-center text-muted-foreground">Or pick up the trail here</p>
          <ul className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {WAYS_BACK.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block h-full bg-surface p-6 transition-colors hover:bg-muted"
                >
                  <span className="block font-display text-lg">{item.label}</span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                    {item.blurb}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Think this page should exist?{" "}
            <Link href="/contact" className="text-primary underline underline-offset-4">
              Tell us what you were looking for
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
