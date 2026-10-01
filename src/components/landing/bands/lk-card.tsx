import {
  Castle,
  Church,
  Clock,
  Droplets,
  Flag,
  House,
  Landmark,
  Milestone,
  Mountain,
  PawPrint,
  Sailboat,
  Store,
  Torus,
  TreePine,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";

import { isPlacePhoto } from "@/lib/data/photos";
import Link from "next/link";

import type { Hotspot, HotspotCategory } from "@/types";

import { RAIL_ITEM, RAIL_SIZES } from "@/components/landing/bands/showcase-card";
import { cn, meiteiAlias } from "@/lib/utils";

/** Icon plus word, never a bare colour chip. */
const CATEGORY: Record<HotspotCategory, { label: string; Icon: LucideIcon }> = {
  lake: { label: "Lake", Icon: Sailboat },
  hill: { label: "Hill", Icon: Mountain },
  heritage: { label: "Heritage", Icon: Castle },
  wildlife: { label: "Wildlife", Icon: PawPrint },
  waterfall: { label: "Waterfall", Icon: Droplets },
  temple: { label: "Temple", Icon: Church },
  museum: { label: "Museum", Icon: Landmark },
  market: { label: "Market", Icon: Store },
  village: { label: "Village", Icon: House },
  memorial: { label: "Memorial", Icon: Flag },
  cave: { label: "Cave", Icon: Torus },
  park: { label: "Park", Icon: TreePine },
};

/** Hours read as human text: 2.5 is "2 hr 30 min", not "2.5 hours". */
function readableHours(hours: number) {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  if (whole === 0) return `${minutes} min`;
  return minutes === 0 ? `${whole} hr` : `${whole} hr ${minutes} min`;
}

/**
 * One quieter place on the rail.
 *
 * The photograph is masked to the Manipuri gateway arch (the shape the site
 * uses for places) and sits on a white card rather than carrying the copy
 * itself, which is what separates this band from the destinations rail above:
 * those are postcards, these are entries in a gazetteer.
 *
 * District and the drive from Imphal are the two facts the band exists to
 * surface, so they sit in a ruled two-column footer that is always present,
 * even when the distance is 0 km.
 */
export function LesserKnownCard({ hotspot }: { hotspot: Hotspot }) {
  const photo = hotspot.images[0];
  const { label, Icon } = CATEGORY[hotspot.category];
  const alias = meiteiAlias(hotspot.name, hotspot.meiteiName);

  return (
    <li className={RAIL_ITEM}>
      <article className="relative flex h-full flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-3 transition-transform duration-[var(--dur-base)] ease-[var(--ease-flat)] hover:-translate-y-1 focus-within:-translate-y-1">
        <div className="mask-arch relative aspect-[3/4] shrink-0 bg-ink-900">
          {photo ? (
            <Image
              src={photo.src}
              alt={photo.alt || `A view of ${hotspot.location}, ${hotspot.district} district`}
              fill
              unoptimized={isPlacePhoto(photo.src)}
              sizes={RAIL_SIZES}
              className="object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease-flat)] group-hover:scale-[1.04]"
            />
          ) : (
            <div aria-hidden className="absolute inset-0 grid place-items-center bg-ink-800">
              <span className="font-mayek text-5xl text-ivory-50/20">ꯃ</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2.5 px-2 pt-5 pb-2">
          {/* The chip sits BELOW the arch, not on it: `.mask-arch` clips with
              `overflow: hidden` and its dome eats the top corners, which took
              a bite out of every category label. It reads better here anyway:
              on a light card the chip needs no scrim to stay legible. */}
          <p className="eyebrow flex min-h-5 items-center gap-2 text-brass-700">
            <Icon aria-hidden className="size-3.5 shrink-0" />
            {label}
          </p>

          {/* Place names wrap. A clipped name is a broken promise, whatever it
              costs in card-height symmetry. */}
          <h3 className="font-display text-[1.375rem] leading-[1.18] text-balance text-foreground">
            <Link
              href={`/hotspots/${hotspot.slug}`}
              className={cn(
                "after:absolute after:inset-0 after:rounded-[var(--radius-lg)]",
                // The ring is drawn on the STRETCHED pseudo-element, not on the
                // anchor box: `outline-none` with nothing to replace it left the
                // whole rail unusable by keyboard, and an outline on the inline
                // anchor would ring the title rather than the card.
                "focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ring",
              )}
            >
              {hotspot.name}
            </Link>
          </h3>

          {alias && <p className="-mt-1 font-mayek text-sm text-stone-700">{alias}</p>}

          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{hotspot.tagline}</p>

          {/* `brass-700`, not `brass-500`: the lighter brass is 2.90:1 on this
              ground and cannot carry text. */}
          <dl className="mt-auto grid grid-cols-2 gap-x-4 border-t border-border pt-4 text-sm">
            <div>
              <dt className="eyebrow mb-2 text-stone-700">District</dt>
              <dd className="leading-snug font-medium text-foreground">{hotspot.district}</dd>
            </div>
            <div>
              <dt className="eyebrow mb-2 text-stone-700">From Imphal</dt>
              <dd className="flex items-center gap-1.5 leading-snug font-medium text-brass-700">
                <Milestone aria-hidden className="size-3.5 shrink-0" />
                <span className="tabular-nums">
                  {hotspot.distanceFromImphalKm === 0 ? "In Imphal" : `${hotspot.distanceFromImphalKm} km`}
                </span>
              </dd>
            </div>
          </dl>

          <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
            <Clock aria-hidden className="size-3.5 shrink-0" />
            Allow about {readableHours(hotspot.durationHours)}
          </p>
        </div>
      </article>
    </li>
  );
}
