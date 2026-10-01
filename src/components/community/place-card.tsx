import {
  BedDouble,
  CalendarCheck,
  ImageOff,
  Images,
  Landmark,
  type LucideIcon,
  MapPin,
  Spool,
  UtensilsCrossed,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  CardBody,
  CardDescription,
  CardEyebrow,
  CardFact,
  CardFoot,
  CardLine,
  CardMedia,
  CardMeta,
  CardShell,
  CardTitle,
  type CardTone,
} from "@/components/cards/card-kit";
import { CATEGORY_LABELS, CATEGORY_SHORT_LABELS, type CommunityCategory } from "@/lib/community/taxonomy";
import type { CommunityPlaceCard } from "@/lib/community/types";

/** An icon per category, so the category never rides on colour alone. */
export const COMMUNITY_CATEGORY_ICON: Record<CommunityCategory, LucideIcon> = {
  attraction: Landmark,
  eatery: UtensilsCrossed,
  stay: BedDouble,
  craft: Spool,
};

const CATEGORY_TONE: Record<CommunityCategory, CardTone> = {
  attraction: "pine",
  eatery: "terracotta",
  stay: "brass",
  craft: "crimson",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

export function formatCommunityDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

/**
 * A community place in a listing grid. The title is the card's one link; any
 * interactive control passed as `footer` sits above the link's overlay.
 */
export function PlaceCard({
  place,
  preload = false,
  status,
  footer,
  className,
}: {
  place: CommunityPlaceCard;
  preload?: boolean;
  /** Chip line above the title, e.g. a status badge. */
  status?: ReactNode;
  /** Replaces the default foot (photo count and publish date). */
  footer?: ReactNode;
  className?: string;
}) {
  const Icon = COMMUNITY_CATEGORY_ICON[place.category] ?? Landmark;

  return (
    <CardShell tone={CATEGORY_TONE[place.category] ?? "stone"} className={className}>
      {place.cover ? (
        <CardMedia
          image={{ src: place.cover.thumbSrc, alt: place.cover.alt, credit: place.cover.credit }}
          fallbackAlt={`${place.name}, ${CATEGORY_LABELS[place.category].toLowerCase()} at ${place.location}, ${place.district} district, Manipur`}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          preload={preload}
          reserveChip={false}
        />
      ) : (
        // Never a stock photo here: on a community listing it would read as a
        // picture of this place.
        <div className="mask-arch flex aspect-[4/3] w-full shrink-0 flex-col items-center justify-center gap-2 bg-surface-sunken text-muted-foreground">
          <ImageOff className="size-6" aria-hidden="true" />
          <span className="text-sm">No photo yet</span>
        </div>
      )}

      <CardBody>
        {status && <div className="flex flex-wrap gap-2">{status}</div>}
        <CardEyebrow icon={Icon}>
          <span>{CATEGORY_SHORT_LABELS[place.category]}</span>
          <span aria-hidden="true" className="opacity-40">
            /
          </span>
          <span>{place.district}</span>
        </CardEyebrow>

        <CardTitle href={`/community/${place.slug}`}>{place.name}</CardTitle>
        <CardLine icon={MapPin}>{place.location}</CardLine>
        <CardDescription>{place.excerpt}</CardDescription>

        {footer ? (
          <div className="relative z-10 mt-auto border-t border-border pt-4">{footer}</div>
        ) : (
          <>
            <CardMeta>
              <CardFact icon={Images} label="Photos">
                {place.photoCount === 1 ? "1 photo" : `${place.photoCount} photos`}
              </CardFact>
            </CardMeta>
            {place.publishedAt && (
              <CardFoot>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarCheck className="size-3.5 shrink-0 text-[var(--card-accent)]" aria-hidden="true" />
                  Published {formatCommunityDate(place.publishedAt)}
                </p>
              </CardFoot>
            )}
          </>
        )}
      </CardBody>
    </CardShell>
  );
}
