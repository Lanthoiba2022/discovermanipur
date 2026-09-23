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

import { formatDeparture, upcomingDepartures } from "./tour-filters";

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
  const departures = upcomingDepartures(tour.departureDates);
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
            {departures.length > 0
              ? `Departs ${departures.slice(0, 2).map(formatDeparture).join(", ")}${
                  departures.length > 2 ? ` +${departures.length - 2} more` : ""
                }`
              : "Private departures on request"}
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
