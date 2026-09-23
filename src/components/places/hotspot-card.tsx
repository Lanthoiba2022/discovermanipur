import {
  Accessibility,
  Building2,
  Church,
  Clock,
  Droplets,
  Flag,
  Home,
  Landmark,
  type LucideIcon,
  MapPin,
  Mountain,
  MountainSnow,
  Navigation,
  PawPrint,
  ShoppingBasket,
  TreePine,
  Waves,
} from "lucide-react";

import {
  CARD_SIZES,
  CardAlias,
  CardBody,
  CardDescription,
  CardEyebrow,
  CardFact,
  CardFoot,
  CardLine,
  CardMedia,
  CardMeta,
  CardPrice,
  CardShell,
  CardTitle,
  MediaChip,
} from "@/components/cards/card-kit";
import { meiteiAlias } from "@/lib/utils";
import type { Hotspot, HotspotCategory } from "@/types";

import { categoryLabel, formatDuration, formatKm } from "./taxonomy";

/** An icon per category, so the category never rides on colour alone. */
const CATEGORY_ICON: Record<HotspotCategory, LucideIcon> = {
  lake: Waves,
  hill: Mountain,
  heritage: Landmark,
  wildlife: PawPrint,
  waterfall: Droplets,
  temple: Church,
  museum: Building2,
  market: ShoppingBasket,
  village: Home,
  memorial: Flag,
  cave: MountainSnow,
  park: TreePine,
};

/**
 * Entry fees are written as sentences ("Free; guide ₹500–800 per group"), which
 * is right on the detail page and far too long for the card's foot. Condense to
 * the one thing a planner scans for; the full wording is a click away.
 */
function entrySummary(fee: string): string {
  const text = fee.trim();
  if (!text) return "Entry details on page";
  if (/^free/i.test(text)) return "Free entry";
  const amount = text.match(/₹[\d,]+/);
  if (amount) return `Entry from ${amount[0]}`;
  if (/permit|permission/i.test(text)) return "Permit required";
  return "Entry fee applies";
}

export function HotspotCard({
  hotspot,
  preload = false,
  className,
}: {
  hotspot: Hotspot;
  preload?: boolean;
  className?: string;
}) {
  const alias = meiteiAlias(hotspot.name, hotspot.meiteiName);
  const CategoryIcon = CATEGORY_ICON[hotspot.category] ?? Landmark;

  return (
    <CardShell tone="pine" className={className}>
      <CardMedia
        image={hotspot.images[0]}
        fallbackAlt={`${hotspot.name}, a ${categoryLabel(hotspot.category).toLowerCase()} at ${hotspot.location} in ${hotspot.district} district, Manipur`}
        sizes={CARD_SIZES.grid3}
        preload={preload}
        status={
          hotspot.accessibility?.wheelchairAccessible ? (
            <MediaChip icon={Accessibility}>Step-free</MediaChip>
          ) : null
        }
      />

      <CardBody>
        <CardEyebrow icon={CategoryIcon}>
          <span>{categoryLabel(hotspot.category)}</span>
          <span aria-hidden="true" className="opacity-40">
            /
          </span>
          <span>{hotspot.district}</span>
        </CardEyebrow>

        <CardTitle href={`/hotspots/${hotspot.slug}`}>{hotspot.name}</CardTitle>
        {alias && <CardAlias>{alias}</CardAlias>}

        <CardLine icon={MapPin}>{hotspot.location}</CardLine>
        <CardDescription>{hotspot.tagline}</CardDescription>

        <CardMeta>
          <CardFact icon={Navigation} label="Distance from Imphal">
            {formatKm(hotspot.distanceFromImphalKm)} from Imphal
          </CardFact>
          <CardFact icon={Clock} label="Time to allow">
            {formatDuration(hotspot.durationHours)}
          </CardFact>
        </CardMeta>

        <CardFoot>
          <CardPrice value={entrySummary(hotspot.entryFee)} label="Entry" />
        </CardFoot>
      </CardBody>
    </CardShell>
  );
}
