import { CalendarDays, Footprints, Map, Signpost, Users } from "lucide-react";

import {
  CARD_SIZES,
  CardBody,
  CardDescription,
  CardEyebrow,
  CardFact,
  CardFoot,
  CardLine,
  CardMedia,
  CardMeta,
  CardPrice,
  CardRating,
  CardShell,
  CardTitle,
  MediaChip,
} from "@/components/cards/card-kit";
import { titleCase } from "@/components/filters";
import { formatINR } from "@/lib/utils";
import type { Tour } from "@/types";

import { TourCardDepartures } from "./tour-card-departures";

/**
 * Today in Manipur (Asia/Kolkata) as `YYYY-MM-DD`, read on the server when the
 * page is rendered (for the static tour pages, at build time).
 *
 * It is the anchor the departure lists filter against in the server render
 * and in the hydration render, so the prerendered HTML lists real upcoming
 * dates and the browser's first render matches it; after mount they filter
 * against the reader's own day (see `useUpcomingDepartures`). Call it only
 * from server components: a client render would read the visitor's clock and
 * defeat the point. `en-CA` formats as `YYYY-MM-DD`.
 */
export function departuresAnchor(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

const DIFFICULTY_LABEL: Record<Tour["difficulty"], string> = {
  easy: "Easy going",
  moderate: "Moderate",
  challenging: "Challenging",
};

export function TourCard({
  tour,
  preload = false,
  className,
}: {
  tour: Tour;
  preload?: boolean;
  className?: string;
}) {
  const nights = tour.durationDays === 1 ? "1 day" : `${tour.durationDays} days`;

  return (
    <CardShell tone="crimson" className={className}>
      <CardMedia
        image={tour.images[0]}
        fallbackAlt={`Landscape on the ${tour.title} route through ${tour.districtsCovered[0] ?? "Manipur"}`}
        sizes={CARD_SIZES.grid3}
        preload={preload}
        status={<MediaChip icon={Footprints}>{DIFFICULTY_LABEL[tour.difficulty]}</MediaChip>}
      />

      <CardBody>
        <CardEyebrow icon={Signpost}>
          <span>{nights}</span>
          {tour.themes[0] && (
            <>
              <span aria-hidden="true" className="opacity-40">
                /
              </span>
              <span>{titleCase(tour.themes[0])}</span>
            </>
          )}
        </CardEyebrow>

        <CardTitle href={`/tours/${tour.slug}`}>{tour.title}</CardTitle>

        <CardLine icon={Map}>
          {tour.districtsCovered.length > 0
            ? tour.districtsCovered.join(" · ")
            : "Route published soon"}
        </CardLine>
        <CardDescription>{tour.description}</CardDescription>

        <CardMeta>
          <CardFact icon={CalendarDays} label="Departures">
            {/* Filtered against the render day here and in the hydration
                render, then against the reader's day once mounted, so the
                prerendered card names real dates that cannot go stale. */}
            <TourCardDepartures dates={tour.departureDates} anchorDate={departuresAnchor()} />
          </CardFact>
          <CardFact icon={Users} label="Maximum group size">
            Up to {tour.groupSizeMax}
          </CardFact>
        </CardMeta>

        <CardFoot>
          <CardPrice
            value={formatINR(tour.pricePerPerson)}
            unit="/ person"
            label="Price per person"
          />
          <CardRating rating={tour.rating} count={tour.reviewCount} />
        </CardFoot>
      </CardBody>
    </CardShell>
  );
}
