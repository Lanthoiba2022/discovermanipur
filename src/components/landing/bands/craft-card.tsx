import { Amphora, BadgeCheck, Gem, Hammer, Leaf, Music, Shirt, Wheat, type LucideIcon } from "lucide-react";
import Image from "next/image";

import { isPlacePhoto } from "@/lib/data/photos";
import Link from "next/link";

import type { Craft, CraftCategory } from "@/types";

import { RAIL_ITEM, RAIL_SIZES } from "@/components/landing/bands/showcase-card";
import { cn, formatINR, meiteiAlias } from "@/lib/utils";

/**
 * Category is carried by an icon AND a word, never by the chip colour alone;
 * every chip on the crafts rail is the same brass, so a reader who cannot
 * separate the hues loses nothing.
 */
const CATEGORY: Record<CraftCategory, { label: string; Icon: LucideIcon }> = {
  handloom: { label: "Handloom", Icon: Shirt },
  pottery: { label: "Pottery", Icon: Amphora },
  bamboo: { label: "Bamboo & cane", Icon: Leaf },
  jewellery: { label: "Jewellery", Icon: Gem },
  sculpture: { label: "Sculpture", Icon: Hammer },
  "food-produce": { label: "Food & produce", Icon: Wheat },
  instrument: { label: "Instrument", Icon: Music },
};

/**
 * One craft on the rail.
 *
 * Deliberately a *panelled* card rather than the copy-over-photograph card the
 * destinations and festivals rails use. A craft listing has four facts that
 * have to be read rather than glanced at (the object, the maker, where they
 * work and what it costs), and none of them survives being set over a
 * photograph. The photograph gets its own plate; the facts get a crimson panel
 * under it.
 *
 * The maker's name is essential text: it wraps, it is never clamped to square
 * the cards off, and neither is the price. Only the description clamps.
 *
 * `RAIL_ITEM`/`RAIL_SIZES` are imported rather than restated so every rail on
 * the landing page steps by the same card width.
 */
export function CraftShowcaseCard({ craft }: { craft: Craft }) {
  const photo = craft.images[0];
  const { label, Icon } = CATEGORY[craft.category];
  const mayek = meiteiAlias(craft.name, craft.meiteiName);
  const place =
    craft.location.trim().toLowerCase() === craft.district.trim().toLowerCase()
      ? craft.district
      : `${craft.location}, ${craft.district}`;

  return (
    <li className={RAIL_ITEM}>
      <article className="relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-brass-300/30 bg-ningthou-800 transition-transform duration-[var(--dur-base)] ease-[var(--ease-flat)] hover:-translate-y-1 focus-within:-translate-y-1">
        {/* The media slot reserves its own space with an aspect ratio, so the
            rail never reflows as photographs decode one by one. */}
        <div className="relative aspect-[4/5] shrink-0 overflow-hidden bg-ningthou-900">
          {photo ? (
            <Image
              src={photo.src}
              alt={photo.alt || `${craft.name} made by ${craft.maker} in ${craft.location}`}
              fill
              unoptimized={isPlacePhoto(photo.src)}
              sizes={RAIL_SIZES}
              className="object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease-flat)] group-hover:scale-[1.04]"
            />
          ) : (
            <div aria-hidden className="absolute inset-0 grid place-items-center bg-ningthou-900">
              <span className="font-mayek text-5xl text-ivory-50/20">ꯃ</span>
            </div>
          )}

          {/* A fixed badge rail, present whether or not there is a badge, so
              every plate on the row crops identically. */}
          <div className="absolute inset-x-4 top-4 flex min-h-8 flex-wrap items-start gap-2">
            {craft.giTagged && (
              <span className="eyebrow inline-flex items-center gap-1.5 rounded-full bg-ink-950/78 px-2.5 py-1.5 text-brass-300">
                <BadgeCheck aria-hidden className="size-3.5 shrink-0" />
                GI tag
              </span>
            )}
            {craft.madeToOrder && (
              <span className="eyebrow inline-flex items-center gap-1.5 rounded-full bg-ink-950/78 px-2.5 py-1.5 text-ivory-50">
                To order
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <p className="eyebrow flex items-center gap-2 text-brass-300">
            <Icon aria-hidden className="size-3.5 shrink-0" />
            {label}
          </p>

          <h3 className="font-display text-[1.375rem] leading-[1.18] text-balance text-ivory-50">
            <Link
              href={`/store/${craft.slug}`}
              // Stretched link: the whole card is the target, and the
              // accessible name stays the craft's name alone.
              className={cn(
                "after:absolute after:inset-0 after:rounded-[var(--radius-lg)]",
                // The ring is drawn on the STRETCHED pseudo-element, not on the
                // anchor box: `outline-none` with nothing to replace it left the
                // whole rail unusable by keyboard, and an outline on the inline
                // anchor would ring the title rather than the card.
                "focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ring",
              )}
            >
              {craft.name}
            </Link>
          </h3>

          {mayek && <p className="-mt-1 font-mayek text-sm text-lily-300">{mayek}</p>}

          <p className="line-clamp-2 text-sm leading-relaxed text-ivory-50/82">{craft.description}</p>

          <p className="mt-auto pt-2 text-sm text-lily-300">
            Made by <span className="font-medium text-ivory-50">{craft.maker}</span>
            {/* Several rows name the town and the district identically
                ("Imphal East, Imphal East"), so the pair is collapsed. */}
            <span className="block">{place}</span>
          </p>

          {/* Prices are money, not machine-issued text, so they stay in the
              body sans: `tabular-nums` only, no mono. */}
          <p className="border-t border-brass-300/25 pt-3.5 text-base text-ivory-50">
            <span className="font-medium tabular-nums">{formatINR(craft.price)}</span>
            {craft.priceNote && (
              <span className="block text-xs leading-relaxed text-lily-300">{craft.priceNote}</span>
            )}
          </p>
        </div>
      </article>
    </li>
  );
}
