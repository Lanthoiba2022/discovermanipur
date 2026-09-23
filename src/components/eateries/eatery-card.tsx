import { CalendarCheck, Clock, MapPin, Soup, Utensils } from "lucide-react";

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
import type { Eatery } from "@/types";

import { priceRangeLabel } from "./eatery-filters";

const PRICE_WORD: Record<1 | 2 | 3, string> = {
  1: "Everyday",
  2: "Mid-range",
  3: "Special occasion",
};

/** Opening hours read as a sentence; the card shows the part people scan. */
function hoursSummary(timings: string): string {
  const [hours] = timings.split(/,| and /);
  return hours?.trim() || timings;
}

export function EateryCard({
  eatery,
  preload = false,
  className,
}: {
  eatery: Eatery;
  preload?: boolean;
  className?: string;
}) {
  const signature = eatery.signatureDishes[0]?.name;

  return (
    <CardShell tone="brass" className={className}>
      <CardMedia
        image={eatery.images[0]}
        fallbackAlt={`Food served at ${eatery.name}, a ${titleCase(eatery.cuisines[0] ?? "Manipuri")} kitchen in ${eatery.location}, Manipur`}
        sizes={CARD_SIZES.grid3}
        preload={preload}
        status={
          signature ? <MediaChip icon={Soup}>Known for {signature}</MediaChip> : null
        }
      />

      <CardBody>
        <CardEyebrow icon={Utensils}>
          <span>{eatery.cuisines.slice(0, 2).map(titleCase).join(" · ")}</span>
          <span aria-hidden="true" className="opacity-40">
            /
          </span>
          <span>{eatery.district}</span>
        </CardEyebrow>

        <CardTitle href={`/eateries/${eatery.slug}`}>{eatery.name}</CardTitle>

        <CardLine icon={MapPin}>{eatery.location}</CardLine>
        <CardDescription>{eatery.description}</CardDescription>

        <CardMeta>
          <CardFact icon={Clock} label="Opening hours">
            {hoursSummary(eatery.timings)}
          </CardFact>
          {eatery.acceptsReservations && (
            <CardFact icon={CalendarCheck} label="Booking">
              Takes reservations
            </CardFact>
          )}
        </CardMeta>

        <CardFoot>
          <CardPrice
            value={
              <>
                <span aria-hidden="true">{priceRangeLabel(eatery.priceRange)}</span>
                <span className="ml-1.5 font-sans text-sm text-muted-foreground">
                  {PRICE_WORD[eatery.priceRange]}
                </span>
              </>
            }
            label="Price range"
          />
          <CardRating rating={eatery.rating} count={eatery.reviewCount} />
        </CardFoot>
      </CardBody>
    </CardShell>
  );
}
