import { Footprints, Mountain, MountainSnow, Route } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IntentLink } from "@/components/shared/intent-link";

import { BandRail } from "@/components/landing/band-rail";
import { ShowcaseBand } from "@/components/landing/showcase-band";
import { formatINR } from "@/lib/utils";
import type { Tour } from "@/types";

import {
  BandEmpty,
  BandPill,
  CardChip,
  CardMedia,
  RAIL_ITEM,
} from "./showcase-card";

/**
 * The itineraries band: the one that carries the arch.
 *
 * The national board masks its itinerary cards into an ogee, which is the
 * single most recognisable thing on their page. `.mask-arch` is our own version
 * of that move: a rounded dome over square shoulders, the profile of a Manipuri
 * gateway. Used here and nowhere else on the landing page, it reads as a row of
 * gateways standing on the ivory ground, so the copy under each one is centred
 * and the rail is left-aligned against the two centred bands either side of it.
 */

const DIFFICULTY: Record<Tour["difficulty"], { label: string; icon: LucideIcon }> = {
  easy: { label: "Easy going", icon: Footprints },
  moderate: { label: "Moderate", icon: Mountain },
  challenging: { label: "Challenging", icon: MountainSnow },
};

function ItineraryCard({ tour }: { tour: Tour }) {
  const difficulty = DIFFICULTY[tour.difficulty];
  const districts = tour.districtsCovered;
  const opener = tour.itinerary[0]?.summary;

  return (
    <li className={RAIL_ITEM}>
      <IntentLink
        href={`/tours/${tour.slug}`}
        className="flex h-full flex-col items-center text-center transition-transform duration-[var(--dur-base)] ease-[var(--ease-flat)] hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <CardMedia
          arch
          shape="arch"
          image={tour.images[0]}
          fallbackAlt={`Scenery along the route through ${districts.join(" and ") || "Manipur"}`}
        >
          <div aria-hidden className="scrim-copy absolute inset-0" />
          {/* The day count sits low in the arch, clear of the dome's curve, on
              its own ground so it never relies on the photograph behind it. */}
          <p className="eyebrow absolute inset-x-0 bottom-5 mx-auto w-fit rounded-full bg-ink-950/75 px-3 py-1.5 text-ivory-50">
            {tour.durationDays} {tour.durationDays === 1 ? "day" : "days"}
          </p>
        </CardMedia>

        {/* The brass tick under the gateway: the same editorial device the
            band masthead uses, one size down. */}
        <span
          aria-hidden
          className="mt-5 block h-px w-8 bg-brass-700/50 transition-transform duration-[var(--dur-base)] ease-[var(--ease-flat)] group-hover:scale-x-[2.4]"
        />

        {/* Titles and prices wrap; nothing here is clipped to level the rail. */}
        <h3 className="mt-4 text-title text-foreground">{tour.title}</h3>

        <p className="mt-2 flex flex-wrap items-center justify-center gap-x-1.5 text-sm text-pine-600">
          <Route aria-hidden className="size-3.5 shrink-0" />
          <span className="sr-only">Districts covered: </span>
          {districts.length > 0 ? districts.join(" · ") : "Across Manipur"}
        </p>

        {opener && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {opener}
          </p>
        )}

        <div className="mt-auto flex flex-col items-center gap-3 pt-5">
          <CardChip icon={difficulty.icon}>{difficulty.label}</CardChip>
          <p className="text-foreground">
            <span className="text-sm text-muted-foreground">from </span>
            <span className="text-lg font-semibold">{formatINR(tour.pricePerPerson)}</span>
            <span className="text-sm text-muted-foreground"> per person</span>
          </p>
        </div>
      </IntentLink>
    </li>
  );
}

export function ItinerariesBand({ tours }: { tours: Tour[] }) {
  return (
    <ShowcaseBand
      id="itineraries"
      tone="ivory"
      align="left"
      eyebrow="Planned end to end"
      word="Itineraries"
      tail="routed day by day, so the hill roads work in your favour."
      ghost="ꯂ"
      action={<BandPill href="/tours">All itineraries</BandPill>}
    >
      {tours.length > 0 ? (
        <BandRail label="Featured itineraries">
          {tours.map((tour) => (
            <ItineraryCard key={tour.slug} tour={tour} />
          ))}
        </BandRail>
      ) : (
        <BandEmpty
          title="Routes are being plotted"
          body="Guided itineraries are published once their operators, permits and departure dates are confirmed. The full list opens as soon as the first is signed off."
          href="/tours"
          cta="Browse every itinerary"
        />
      )}
    </ShowcaseBand>
  );
}
