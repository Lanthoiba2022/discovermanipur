import { Bath, BedDouble, Home, MapPin, Users } from "lucide-react";

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
} from "@/components/cards/card-kit";
import { AMENITY_META } from "@/components/homestays/amenities";
import { SaveButton } from "@/components/homestays/save-button";
import { PLACEHOLDER_IMAGE } from "@/components/places/taxonomy";
import { isPriced } from "@/lib/data/sort";
import { formatINR } from "@/lib/utils";
import type { Homestay } from "@/types";

export function HomestayCard({
  homestay,
  preload = false,
  className,
}: {
  homestay: Homestay;
  preload?: boolean;
  className?: string;
}) {
  const cover = homestay.images[0];
  // Two amenities, in the card's own meta voice. The rest are on the page.
  const amenities = homestay.amenities.map((a) => AMENITY_META[a]).filter(Boolean).slice(0, 2);

  return (
    <CardShell tone="pine" className={className}>
      <CardMedia
        image={cover}
        fallbackAlt={`The house and grounds at ${homestay.title}, a homestay in ${homestay.location}, Manipur`}
        sizes={CARD_SIZES.grid4}
        preload={preload}
        // The one nested control in the family. It is a sibling of the card's
        // anchor, never inside it, and sits above the anchor's overlay.
        action={
          <SaveButton
            // 44x44 touch target, up from the shared overlay default.
            className="size-11"
            item={{
              kind: "homestay",
              slug: homestay.slug,
              title: homestay.title,
              subtitle: homestay.location,
              image: cover?.src ?? PLACEHOLDER_IMAGE,
              // Travels with the photo: a licence condition for Places photos.
              imageCredit: cover?.credit,
              href: `/homestays/${homestay.slug}`,
            }}
          />
        }
      />

      <CardBody>
        <CardEyebrow icon={Home}>
          <span>Homestay</span>
          <span aria-hidden="true" className="opacity-40">
            /
          </span>
          <span>{homestay.district}</span>
        </CardEyebrow>

        <CardTitle href={`/homestays/${homestay.slug}`}>{homestay.title}</CardTitle>

        <CardLine icon={MapPin}>
          {homestay.location} · hosted by {homestay.hostName}
        </CardLine>
        <CardDescription>{homestay.description}</CardDescription>

        <CardMeta>
          <CardFact icon={Users} label="Sleeps">
            {homestay.maxGuests} guests
          </CardFact>
          <CardFact icon={BedDouble} label="Bedrooms">
            {homestay.bedrooms} {homestay.bedrooms === 1 ? "bedroom" : "bedrooms"}
          </CardFact>
          <CardFact icon={Bath} label="Bathrooms">
            {homestay.bathrooms} {homestay.bathrooms === 1 ? "bath" : "baths"}
          </CardFact>
          {amenities.map((meta) => (
            <CardFact key={meta.label} icon={meta.icon} label="Amenity">
              {meta.label}
            </CardFact>
          ))}
        </CardMeta>

        <CardFoot>
          {/* Most research stays carry no published rate (stored as 0). That
              means "ask the host", not "free", so never print ₹0. */}
          {isPriced(homestay.pricePerNight) ? (
            <CardPrice
              value={formatINR(homestay.pricePerNight)}
              unit="/ night"
              label="Price per night"
            />
          ) : (
            <CardPrice value="Rate on request" label="Price per night" />
          )}
          <CardRating rating={homestay.rating} count={homestay.reviewCount} />
        </CardFoot>
      </CardBody>
    </CardShell>
  );
}
