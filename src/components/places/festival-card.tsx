import { CalendarDays, MapPin, Sparkles } from "lucide-react";

import {
  CARD_SIZES,
  CardAlias,
  CardBody,
  CardDescription,
  CardEyebrow,
  CardFact,
  CardMedia,
  CardMeta,
  CardShell,
  CardTitle,
} from "@/components/cards/card-kit";
import { cn, meiteiAlias } from "@/lib/utils";
import type { Festival } from "@/types";

/**
 * The one horizontal card in the family: festivals are read down a twelve-month
 * calendar, where a full-width photo card would push the year off the screen.
 * Everything else — arch-masked media, tone-coded eyebrow with an icon, display
 * title that wraps, clamped description, icon meta — is the shared grammar.
 */
export function FestivalCard({
  festival,
  highlight = false,
  className,
}: {
  festival: Festival;
  highlight?: boolean;
  className?: string;
}) {
  const alias = meiteiAlias(festival.name, festival.meiteiName);

  return (
    <CardShell
      tone="crimson"
      className={cn(
        "flex-row items-stretch gap-4",
        highlight && "border-[var(--card-accent)] bg-surface-sand",
        className,
      )}
    >
      <CardMedia
        image={festival.images[0]}
        fallbackAlt={`${festival.name} being celebrated at ${festival.location || festival.district}, Manipur`}
        sizes={CARD_SIZES.thumb}
        ratio="aspect-[3/4]"
        reserveChip={false}
        className="w-24 self-start sm:w-32"
      />

      <CardBody className="pl-0 pt-1">
        <CardEyebrow icon={highlight ? Sparkles : CalendarDays}>
          <span>{festival.month}</span>
          {festival.featured && (
            <>
              <span aria-hidden="true" className="opacity-40">
                /
              </span>
              <span>Signature</span>
            </>
          )}
        </CardEyebrow>

        <CardTitle href={`/festivals/${festival.slug}`} className="text-lg sm:text-xl">
          {festival.name}
        </CardTitle>
        {alias && <CardAlias>{alias}</CardAlias>}

        <CardDescription>{festival.description}</CardDescription>

        <CardMeta className="border-t border-border pt-3">
          <CardFact icon={MapPin} label="Where">
            {festival.location || festival.district}
          </CardFact>
          <CardFact icon={CalendarDays} label="When">
            {festival.typicalDates || festival.month}
          </CardFact>
        </CardMeta>
      </CardBody>
    </CardShell>
  );
}
