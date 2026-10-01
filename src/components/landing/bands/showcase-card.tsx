import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { isPlacePhoto } from "@/lib/data/photos";
import { cn } from "@/lib/utils";
import type { MediaImage } from "@/types";

/**
 * The parts every showcase card in the landing rails is built from.
 *
 * The listing cards elsewhere in the site are a denser register: filters,
 * prices, availability, four lines of meta. A landing rail is a shop window:
 * one photograph, one name, one reason to click. So these primitives are
 * deliberately thin, and each band composes its own card on top of them
 * rather than passing a dozen flags into one universal card.
 *
 * Three rules are baked in here rather than left to each band:
 *  - Media reserves its space with `aspect-ratio` and a ground colour, and the
 *    badge slot is a fixed row, so nothing reflows as photographs arrive.
 *  - Nothing that names a thing is ever truncated. Only descriptions clamp.
 *  - A category is always an icon AND a word, never a colour on its own.
 */

/** Rail item geometry: one card is always partly visible past the fold. */
export const RAIL_ITEM = "group w-[78vw] shrink-0 snap-start sm:w-[21rem] lg:w-[22.5rem]";

/** The `sizes` that matches `RAIL_ITEM`. */
export const RAIL_SIZES = "(max-width: 640px) 78vw, (max-width: 1024px) 21rem, 22.5rem";

const ASPECT: Record<"portrait" | "arch" | "landscape", string> = {
  portrait: "aspect-[4/5]",
  arch: "aspect-[3/4]",
  landscape: "aspect-[3/2]",
};

/**
 * A card photograph, or an honest placeholder when a row has no image.
 *
 * `alt` falls back to a described scene rather than the record's title: a
 * screen-reader user who has just heard the heading gains nothing from hearing
 * it again as the image description.
 */
export function CardMedia({
  image,
  fallbackAlt,
  shape = "portrait",
  arch = false,
  className,
  children,
}: {
  image?: MediaImage;
  fallbackAlt: string;
  shape?: "portrait" | "arch" | "landscape";
  /** Masks the media into the Manipuri gateway profile. */
  arch?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-ink-900",
        ASPECT[shape],
        arch ? "mask-arch" : "rounded-[var(--radius-lg)]",
        className,
      )}
    >
      {image?.src ? (
        <Image
          src={image.src}
          alt={image.alt || fallbackAlt}
          fill
          unoptimized={isPlacePhoto(image.src)}
          sizes={RAIL_SIZES}
          className="object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease-flat)] group-hover:scale-[1.04]"
        />
      ) : (
        // No photograph on file. A flat woven ground beats a broken frame, and
        // it holds exactly the same space so the rail never jumps.
        <div aria-hidden className="absolute inset-0 grid place-items-center bg-ink-800">
          <span className="font-mayek text-5xl text-ivory-50/20">ꯃ</span>
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * A category or attribute chip. Always an icon plus its word; colour alone
 * never carries the meaning.
 */
export function CardChip({
  icon: Icon,
  children,
  tone = "light",
  className,
}: {
  icon: LucideIcon;
  children: ReactNode;
  tone?: "light" | "dark" | "overlay";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "eyebrow inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5",
        tone === "light" && "bg-ivory-100 text-ink-800",
        tone === "dark" && "bg-ivory-50/12 text-ivory-50",
        // Over a photograph the chip carries its own ground; measured unbacked
        // over an open sky the label drops well under 4.5:1.
        tone === "overlay" && "bg-ink-950/75 text-ivory-50",
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5 shrink-0" />
      {children}
    </span>
  );
}

/** A small icon-led fact: distance, duration, dates, group size. */
export function CardMeta({
  icon: Icon,
  children,
  className,
}: {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <Icon aria-hidden className="size-3.5 shrink-0" />
      {children}
    </span>
  );
}

/** The single pill that closes every band. */
export function BandPill({
  href,
  children,
  tone = "light",
}: {
  href: string;
  children: ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <Button
      asChild
      variant="outline"
      size="pill"
      className={cn(
        "group/pill",
        tone === "dark"
          ? "border-ivory-50/45 text-ivory-50 hover:bg-ivory-50 hover:text-ink-950"
          : "border-ink-900/25 text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground",
      )}
    >
      <Link href={href}>
        {children}
        <ArrowRight
          aria-hidden
          className="transition-transform duration-[var(--dur-fast)] ease-[var(--ease-flat)] group-hover/pill:translate-x-1"
        />
      </Link>
    </Button>
  );
}

/**
 * What a band shows when its query comes back empty.
 *
 * Every one of these getters can legitimately return nothing (an unconfigured
 * database, a filter that matches no published row), and a band that assumes
 * `rows[0]` takes the whole page down with it. So the empty state is a real
 * piece of the design with a real way onward, not a console warning.
 */
export function BandEmpty({
  title,
  body,
  href,
  cta,
  tone = "light",
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div
      className={cn(
        "mx-auto max-w-[46rem] rounded-[var(--radius-lg)] border border-dashed px-6 py-12 text-center md:px-10",
        dark ? "border-ivory-50/30 bg-ink-950/30" : "border-border-strong bg-surface",
      )}
    >
      <h3 className={cn("text-title", dark ? "text-ivory-50" : "text-foreground")}>{title}</h3>
      <p
        className={cn(
          "mx-auto mt-3 max-w-[48ch] text-sm leading-relaxed",
          dark ? "text-ivory-50/80" : "text-muted-foreground",
        )}
      >
        {body}
      </p>
      <div className="mt-7 flex justify-center">
        <BandPill href={href} tone={tone}>
          {cta}
        </BandPill>
      </div>
    </div>
  );
}
