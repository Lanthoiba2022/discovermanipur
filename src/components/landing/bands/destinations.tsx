import {
  Accessibility,
  Bird,
  Building2,
  Church,
  Clock,
  Droplets,
  Flag,
  Home,
  Landmark,
  Milestone,
  Mountain,
  Store,
  TreePine,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { IntentLink } from "@/components/shared/intent-link";

import { BandRail } from "@/components/landing/band-rail";
import { ShowcaseBand } from "@/components/landing/showcase-band";
import { meiteiAlias } from "@/lib/utils";
import type { Hotspot, HotspotCategory } from "@/types";

import {
  BandEmpty,
  BandPill,
  CardChip,
  CardMedia,
  CardMeta,
  RAIL_ITEM,
} from "./showcase-card";

/**
 * The opening showcase band: a full-bleed photograph with the word knocked out
 * of it in white.
 *
 * On the national board's page this is the loudest moment of the sequence, and
 * it works because the photograph is doing the persuading while the word just
 * labels the chapter. Ours takes the same move and then departs from it in two
 * ways: the band is left-aligned rather than centred, so the run of sections
 * below it does not march down one axis; and the copy sits in a darkened
 * reading column rather than over a flat wash, which keeps the valley behind it
 * legible as a landscape instead of reducing it to grey texture.
 */

/**
 * Category is shown as an icon AND its word. Colour never carries it alone;
 * these chips are one neutral ground throughout, on purpose.
 */
const CATEGORY: Record<HotspotCategory, { label: string; icon: LucideIcon }> = {
  lake: { label: "Lake", icon: Waves },
  hill: { label: "Hills", icon: Mountain },
  heritage: { label: "Heritage", icon: Landmark },
  wildlife: { label: "Wildlife", icon: Bird },
  waterfall: { label: "Waterfall", icon: Droplets },
  temple: { label: "Temple", icon: Church },
  museum: { label: "Museum", icon: Building2 },
  market: { label: "Market", icon: Store },
  village: { label: "Village", icon: Home },
  memorial: { label: "Memorial", icon: Flag },
  cave: { label: "Cave", icon: Mountain },
  park: { label: "Park", icon: TreePine },
};

/** Hours read as human text: 2.5 is "2 hr 30 min", not "2.5 hours". */
function readableHours(hours: number) {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  if (whole === 0) return `${minutes} min`;
  return minutes === 0 ? `${whole} hr` : `${whole} hr ${minutes} min`;
}

function DestinationCard({ hotspot }: { hotspot: Hotspot }) {
  const category = CATEGORY[hotspot.category];
  const alias = meiteiAlias(hotspot.name, hotspot.meiteiName);

  return (
    <li className={RAIL_ITEM}>
      <IntentLink
        href={`/hotspots/${hotspot.slug}`}
        className="block rounded-[var(--radius-lg)] transition-transform duration-[var(--dur-base)] ease-[var(--ease-flat)] hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <CardMedia
          image={hotspot.images[0]}
          fallbackAlt={`A view of ${hotspot.location}, ${hotspot.district} district`}
        >
          <div aria-hidden className="scrim-copy absolute inset-0" />

          {/* A fixed badge row, so the card does not reflow as the photograph
              decodes behind it. */}
          <div className="absolute inset-x-4 top-4 flex min-h-8 items-start justify-between gap-2">
            <CardChip icon={category.icon} tone="overlay">
              {category.label}
            </CardChip>
            {hotspot.accessibility.wheelchairAccessible && (
              <CardChip icon={Accessibility} tone="overlay" className="px-2">
                <span className="sr-only">Step-free access available</span>
              </CardChip>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5">
            {/* Place names wrap. A clipped name is a broken promise, whatever
                it costs in card-height symmetry. */}
            <h3 className="font-display text-[1.55rem] leading-[1.15] text-ivory-50">
              {hotspot.name}
            </h3>
            {alias && <p className="mt-0.5 font-mayek text-sm text-brass-300">{alias}</p>}
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ivory-50/85">
              {hotspot.tagline}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-ivory-50/75">
              <CardMeta icon={Milestone}>
                {hotspot.distanceFromImphalKm === 0
                  ? "In Imphal"
                  : `${hotspot.distanceFromImphalKm} km from Imphal`}
              </CardMeta>
              <CardMeta icon={Clock}>{readableHours(hotspot.durationHours)}</CardMeta>
            </div>
          </div>
        </CardMedia>
      </IntentLink>
    </li>
  );
}

export function DestinationsBand({ hotspots }: { hotspots: Hotspot[] }) {
  return (
    <ShowcaseBand
      id="destinations"
      tone="photo"
      align="left"
      eyebrow="Sixteen districts"
      word="Destinations"
      tail="for every kind of traveller: lake, ridge, fort and forest."
      action={
        <BandPill href="/hotspots" tone="dark">
          All destinations
        </BandPill>
      }
      backdrop={
        <div aria-hidden className="absolute inset-0 -z-10">
          {/* Verified: a terraced valley in the Manipur hills at dusk
              (Huishu, Ukhrul; CC BY-SA 4.0, credited in photo-credits.ts).
              Not preloaded: the hero owns the LCP. */}
          <Image
            src="/file-uploads/terraced-valley-dusk.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Three layers, because one is never enough over a dusk sky: a base
              wash for the whole band, the reading column for the masthead, and
              the bottom anchor under the rail controls. */}
          <div className="absolute inset-0 bg-ink-950/38" />
          <div className="scrim-reading absolute inset-0" />
          <div className="scrim-copy absolute inset-0" />
        </div>
      }
    >
      {hotspots.length > 0 ? (
        <BandRail label="Featured destinations" tone="dark">
          {hotspots.map((hotspot) => (
            <DestinationCard key={hotspot.slug} hotspot={hotspot} />
          ))}
        </BandRail>
      ) : (
        <BandEmpty
          tone="dark"
          title="The map is still being drawn"
          body="Featured places appear here the moment the first are published. The full gazetteer of sixty-odd places across the sixteen districts is already open."
          href="/hotspots"
          cta="Browse every place"
        />
      )}
    </ShowcaseBand>
  );
}
