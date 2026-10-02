import { ArrowUpRight } from "lucide-react";
import { IntentLink } from "@/components/shared/intent-link";

import { ShowcaseBand } from "@/components/landing/showcase-band";
import { Button } from "@/components/ui/button";

import { GsFigure } from "./gs-figure";

/**
 * The closing band's figures. Widened from the seed `Stat` so the band does
 * not care whether a note or a suffix was written for a given row.
 */
export interface BandStat {
  value: number;
  suffix?: string;
  label: string;
  note?: string;
}

/**
 * GET STARTED: the conversion close.
 *
 * The national board ends on an "Inspired?" kicker, a single instruction and a
 * strip of counters, and the shape is worth keeping: after eight bands of
 * looking, the page should ask for exactly one thing. So there is one primary
 * button (the concierge at `/plan`), and the alternative is demoted to a text
 * link rather than a second button, because two equal buttons is the page
 * failing to have an opinion.
 *
 * Crimson ground, centred: the page opened on photography and closes on the
 * brand colour, and the figures are set in brass on it at ~8:1.
 *
 * `stats` may be empty: the figures strip simply does not render, and the
 * band is still a complete call to action. Nothing here reads `stats[0]`.
 */
export function GetStartedBand({ stats }: { stats: BandStat[] }) {
  return (
    <ShowcaseBand
      id="get-started"
      tone="crimson"
      align="center"
      eyebrow="Inspired?"
      word="Get started"
      tail="tell us the shape of the trip, we will fill in the road"
      backdrop={
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-[radial-gradient(60%_100%_at_50%_100%,var(--ningthou-700)_0%,transparent_70%)] opacity-70"
          />
          {/* Top edge only: the site footer opens with its own `weave-band`,
              and stacking one here would print the motif twice in 200px. */}
          <div aria-hidden className="weave-band absolute inset-x-0 top-0 opacity-70" />
        </>
      }
      action={
        <div className="flex flex-col items-center gap-6">
          <Button asChild variant="accent" size="lg">
            <IntentLink href="/plan">
              Plan my trip
              <ArrowUpRight aria-hidden className="size-4" />
            </IntentLink>
          </Button>

          {/* Ready-made routes are the curated tours. There is no /itineraries
              page; saved plans live under /account/itineraries. */}
          <IntentLink
            href="/tours"
            className="inline-flex min-h-11 items-center border-b border-brass-300/50 px-1 text-sm text-ivory-50 transition-colors duration-[var(--dur-base)] ease-[var(--ease-flat)] hover:border-brass-300 hover:text-brass-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Or start from a ready-made route
          </IntentLink>
        </div>
      }
    >
      <p className="mx-auto max-w-[52ch] text-center text-base leading-relaxed text-lily-300 md:text-lg">
        Say how many days you have, what month you are coming and whether you
        would rather be on water or on a ridge. The concierge writes the route,
        names the homestays and tells you what is actually open.
      </p>

      {stats.length > 0 && (
        <dl className="mt-[var(--space-block)] grid grid-cols-1 gap-x-10 border-t border-brass-300/30 text-left sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="border-b border-brass-300/20 py-8 lg:border-b-0 lg:border-r lg:pr-10 lg:last:border-r-0"
            >
              {/* The figure is the visible heading of each cell, so the term
                  is the label and the definition carries both; otherwise a
                  screen reader hears a bare number with no unit. */}
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <GsFigure value={stat.value} suffix={stat.suffix} />
                <p className="eyebrow mt-5 text-ivory-50">{stat.label}</p>
                {stat.note && (
                  <p className="mt-2.5 text-sm leading-relaxed text-lily-300">{stat.note}</p>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </ShowcaseBand>
  );
}
