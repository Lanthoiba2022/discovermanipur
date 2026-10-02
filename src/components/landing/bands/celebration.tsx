import { CalendarDays, MapPin } from "lucide-react";
import { IntentLink } from "@/components/shared/intent-link";

import { BandRail } from "@/components/landing/band-rail";
import { ShowcaseBand } from "@/components/landing/showcase-band";
import { meiteiAlias } from "@/lib/utils";
import type { Festival } from "@/types";

import {
  BandEmpty,
  BandPill,
  CardChip,
  CardMedia,
  RAIL_ITEM,
} from "./showcase-card";

/**
 * The festival band, and the one saturated stop on the page.
 *
 * Three light-to-mid grounds have run in a row by this point, so this band
 * takes the phanek crimson full-bleed: the word goes ivory, the tail goes
 * brass, and the cards drop their boxes entirely: photograph, then copy
 * straight onto the crimson. It is the loudest band on the page and the last
 * one before the page hands over to the planning sections.
 */

function FestivalCard({ festival }: { festival: Festival }) {
  const alias = meiteiAlias(festival.name, festival.meiteiName);

  return (
    <li className={RAIL_ITEM}>
      <IntentLink
        href={`/festivals/${festival.slug}`}
        className="flex h-full flex-col rounded-[var(--radius-lg)] transition-transform duration-[var(--dur-base)] ease-[var(--ease-flat)] hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <CardMedia
          image={festival.images[0]}
          fallbackAlt={`Crowds and colour during the festival at ${festival.location}`}
        >
          {/* The copy sits below the photograph here, so the media takes only a
              short top gradient, enough to seat the month badge, and nothing
              that flattens the festival colour underneath it. */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink-950/55 to-transparent"
          />
          {/* Fixed badge slot: the month is the thing people plan around, so
              it is pinned to the photograph rather than buried in the meta. */}
          <div className="absolute inset-x-4 top-4 flex min-h-8 items-start">
            <CardChip icon={CalendarDays} tone="overlay" className="text-brass-300">
              {festival.month}
            </CardChip>
          </div>
        </CardMedia>

        <div className="flex flex-1 flex-col pt-5">
          {/* Festival names wrap: several run to four words and a clipped one
              is simply the wrong festival. */}
          <h3 className="font-display text-[1.55rem] leading-[1.15] text-ivory-50">
            {festival.name}
          </h3>
          {alias && <p className="mt-0.5 font-mayek text-sm text-brass-300">{alias}</p>}

          <p className="mt-2.5 text-sm leading-relaxed text-ivory-50/85">
            <span className="sr-only">Usually held: </span>
            {festival.typicalDates}
          </p>

          <p className="mt-2 flex items-start gap-1.5 text-sm text-ivory-50/70">
            <MapPin aria-hidden className="mt-1 size-3.5 shrink-0" />
            <span>{festival.location}</span>
          </p>

          <div className="mt-auto pt-6">
            <span
              aria-hidden
              className="block h-px w-10 origin-left bg-brass-300/70 transition-transform duration-[var(--dur-base)] ease-[var(--ease-flat)] group-hover:scale-x-[3]"
            />
          </div>
        </div>
      </IntentLink>
    </li>
  );
}

export function CelebrationBand({ festivals }: { festivals: Festival[] }) {
  return (
    <ShowcaseBand
      id="celebration"
      tone="crimson"
      align="center"
      eyebrow="The year, month by month"
      word="Celebration"
      tail="a calendar of raas, drums, lilies and hill harvests."
      action={
        <BandPill href="/festivals" tone="dark">
          The festival calendar
        </BandPill>
      }
    >
      {festivals.length > 0 ? (
        <BandRail label="Featured festivals" tone="dark">
          {festivals.map((festival) => (
            <FestivalCard key={festival.slug} festival={festival} />
          ))}
        </BandRail>
      ) : (
        <BandEmpty
          tone="dark"
          title="The calendar is being set"
          body="Festival dates move with the lunar month and are confirmed close to the season. Every festival already documented is listed in full."
          href="/festivals"
          cta="Browse every festival"
        />
      )}
    </ShowcaseBand>
  );
}
