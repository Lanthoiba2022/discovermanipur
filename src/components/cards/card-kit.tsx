import type { LucideIcon } from "lucide-react";
import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { PLACEHOLDER_IMAGE } from "@/components/places/taxonomy";
import { cn } from "@/lib/utils";
import type { MediaImage } from "@/types";

/**
 * The shared card grammar.
 *
 * Every listing card on the site (places, festivals, experiences, eateries,
 * homestays, tours, transport, crafts) is assembled from these parts, so the
 * eight of them read as one family instead of eight house styles:
 *
 *   shell        surface card, 12px inset, 4px lift on hover, one focus ring
 *   media        arch-masked photo (the Manipuri gateway profile), 4:3,
 *                receding saturation that comes back on hover
 *   eyebrow      tone-coloured category line: ICON + WORDS, never colour alone
 *   title        display face, always wraps, never clamped
 *   line         place / host / operator, wraps
 *   description  the only clamped text; the card links to the full page
 *   meta         two-to-three domain facts, icon + value, wraps
 *   foot         a rule, then the commitment (price, fee, dates) and rating
 *
 * Accessibility rules baked in here rather than left to each card:
 * names/prices/districts wrap; media reserves its ratio and its chip slot;
 * exactly one anchor spans the card and the ring is drawn on the card itself.
 */

/* ------------------------------------------------------------------ tone --- */

/**
 * Category coding. Each tone is a text-safe value on the ivory ground with a
 * lighter step swapped in under `.dark` (the project toggles theme by class).
 * The -500 earth steps are 3.10:1. They are only ever used for icon fills and
 * rules here, never for the small copy.
 */
export type CardTone = "pine" | "terracotta" | "crimson" | "brass" | "stone";

const TONE_CLASS: Record<CardTone, string> = {
  pine: "[--card-accent:var(--pine-600)] [.dark_&]:[--card-accent:var(--pine-400)]",
  terracotta:
    "[--card-accent:var(--terracotta-700)] [.dark_&]:[--card-accent:var(--terracotta-500)]",
  crimson: "[--card-accent:var(--ningthou-700)] [.dark_&]:[--card-accent:var(--ningthou-400)]",
  brass: "[--card-accent:var(--brass-700)] [.dark_&]:[--card-accent:var(--brass-400)]",
  stone: "[--card-accent:var(--stone-700)] [.dark_&]:[--card-accent:var(--stone-500)]",
};

/* ----------------------------------------------------------------- shell --- */

export function CardShell({
  tone = "stone",
  children,
  className,
}: {
  tone?: CardTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative isolate flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-lg)]",
        "border border-border bg-surface p-3 shadow-[var(--shadow-sm)]",
        "transition-[transform,box-shadow,border-color] duration-[260ms] ease-[var(--ease-flat)]",
        "hover:-translate-y-1 hover:border-border-strong hover:shadow-[var(--shadow-md)]",
        // One ring for the whole card, drawn when the card's single link is
        // focused by keyboard. The anchor itself only covers its own text.
        "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-[var(--ring)]",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </article>
  );
}

/* ----------------------------------------------------------------- media --- */

/** Chip over the photo: ivory on a blurred ink scrim, readable on any image. */
export function MediaChip({
  icon: Icon,
  children,
  className,
}: {
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full bg-ink-950/72 px-2.5 py-1",
        "text-[11px] font-semibold uppercase tracking-[0.12em] text-ivory-50 backdrop-blur-sm",
        className,
      )}
    >
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
      <span className="min-w-0 break-words">{children}</span>
    </span>
  );
}

export function CardMedia({
  image,
  fallbackAlt,
  sizes,
  preload = false,
  ratio = "aspect-[4/3]",
  status,
  action,
  reserveChip = true,
  className,
}: {
  image?: MediaImage;
  /** Used only when the record carries no alt of its own. Describe the photo. */
  fallbackAlt: string;
  sizes: string;
  preload?: boolean;
  ratio?: string;
  /** Distinction chip: bottom-left, over the square shoulder of the arch. */
  status?: ReactNode;
  /** Interactive control (never inside the card's anchor): bottom-right. */
  action?: ReactNode;
  /** Keep the chip band even when empty. Off for small leading thumbnails. */
  reserveChip?: boolean;
  className?: string;
}) {
  const showChips = reserveChip || Boolean(status) || Boolean(action);
  return (
    <div
      className={cn(
        "mask-arch relative w-full shrink-0 overflow-hidden bg-surface-sunken",
        ratio,
        className,
      )}
    >
      <Image
        src={image?.src ?? PLACEHOLDER_IMAGE}
        alt={image?.alt ?? fallbackAlt}
        fill
        /* Google Places photos resolve through `/api/place-photo`, which answers
           with a 307 to a short-lived signed Google URL rather than proxying the
           bytes: the Places terms allow caching the reference, not the image.
           Next's optimizer will not follow that hop: it returns 400 and the
           card renders an empty frame. Sending these straight to the browser
           lets it follow the redirect itself. Our own files still go through the
           optimizer. */
        unoptimized={(image?.src ?? "").startsWith("/api/place-photo")}
        preload={preload}
        sizes={sizes}
        placeholder={image?.blurDataURL ? "blur" : "empty"}
        blurDataURL={image?.blurDataURL}
        className={cn(
          "object-cover brightness-[0.94] saturate-[0.78]",
          "transition-[transform,filter] duration-[450ms] ease-[var(--ease-flat)]",
          "group-hover:scale-[1.03] group-hover:brightness-100 group-hover:saturate-100",
          "motion-reduce:transition-none motion-reduce:group-hover:scale-100",
        )}
      />
      {image?.credit && (
        /* Google Places photos may be displayed only with the photographer's
           credit shown. Small, bottom-right, above the scrim so it stays legible
           on any photo, but out of the way of the chip band on the left. */
        <span
          className="pointer-events-none absolute bottom-1.5 right-2 z-10 max-w-[70%] truncate
                     text-[10px] leading-none text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
          title={image.credit}
        >
          {image.credit}
        </span>
      )}
      {showChips && (
        <>
          {/* Scrim sized to the chip band only, so the photo still reads. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950/62 via-ink-950/18 to-transparent"
          />
          {/* Reserved slot: the row exists whether or not a chip does, so a
              card never reflows as its image or its client controls arrive. */}
          <div className="absolute inset-x-3 bottom-3 flex min-h-8 items-end justify-between gap-2">
            <span className="flex min-w-0 flex-wrap gap-1.5">{status}</span>
            <span className="z-10 flex shrink-0 items-center gap-1.5">{action}</span>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ body --- */

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-1 flex-col gap-2 px-2 pb-1 pt-4", className)}>{children}</div>
  );
}

/** Category line. Always an icon plus words. Category is never colour alone. */
export function CardEyebrow({
  icon: Icon,
  children,
  className,
}: {
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "eyebrow flex flex-wrap items-center gap-x-2 gap-y-1 text-[var(--card-accent)]",
        className,
      )}
    >
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
      {children}
    </p>
  );
}

/**
 * The card's one link. The name wraps (it is never truncated to equalise
 * card heights), and the anchor's overlay spans the whole shell.
 */
export function CardTitle({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        'font-display text-xl leading-[1.22] tracking-[-0.008em] [font-variation-settings:"opsz"_24]',
        className,
      )}
    >
      <Link
        href={href}
        className="after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:outline-none"
      >
        {children}
      </Link>
    </h3>
  );
}

/** Meitei-script alias under the title. */
export function CardAlias({ children }: { children: ReactNode }) {
  return (
    <p className="font-mayek -mt-1 text-sm text-muted-foreground" lang="mni-Mtei">
      {children}
    </p>
  );
}

/** Place, host or operator line. Wraps: Manipuri place names run long. */
export function CardLine({
  icon: Icon,
  children,
  className,
}: {
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("flex items-start gap-1.5 text-sm text-muted-foreground", className)}>
      {Icon && (
        <Icon className="mt-[0.3em] size-3.5 shrink-0 text-[var(--card-accent)]" aria-hidden="true" />
      )}
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/** The only clamped text on a card. The detail page carries the full copy. */
export function CardDescription({ children }: { children: ReactNode }) {
  return <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{children}</p>;
}

/** Two or three domain facts. Wraps rather than overflowing. */
export function CardMeta({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <dl
      className={cn(
        "mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[0.8125rem] text-muted-foreground",
        className,
      )}
    >
      {children}
    </dl>
  );
}

export function CardFact({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  /** Screen-reader name for the value. The icon alone never carries it. */
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Icon className="size-3.5 shrink-0 text-[var(--card-accent)]" aria-hidden="true" />
      <dt className="sr-only">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ foot --- */

/** Rule, then the commitment on the left and the rating slot on the right. */
export function CardFoot({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mt-3 flex min-h-8 flex-wrap items-end justify-between gap-x-4 gap-y-1 border-t border-border pt-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * The commitment: a price, an entry fee, a set of dates. Set in the display
 * face: these are read as money, not as machine output, so never mono.
 */
export function CardPrice({
  value,
  unit,
  label,
}: {
  value: ReactNode;
  unit?: string;
  /** Screen-reader gloss, e.g. "Price per person". */
  label?: string;
}) {
  return (
    <p className="min-w-0">
      {label && <span className="sr-only">{label}: </span>}
      <span className="font-display text-lg leading-tight">{value}</span>
      {unit && <span className="text-sm text-muted-foreground"> {unit}</span>}
    </p>
  );
}

export function CardRating({ rating, count }: { rating: number; count?: number }) {
  if (!rating) return null;
  return (
    <p className="flex shrink-0 items-center gap-1.5 text-sm">
      <Star
        className="size-4 shrink-0 fill-[var(--brass-500)] text-[var(--brass-500)]"
        aria-hidden="true"
      />
      <span className="font-medium">{rating.toFixed(1)}</span>
      <span className="sr-only">out of 5</span>
      {count !== undefined && count > 0 && (
        <span className="text-muted-foreground">({count})</span>
      )}
    </p>
  );
}

/* ----------------------------------------------------------------- sizes --- */

/**
 * One `sizes` string per grid shape, so the eight listings request comparable
 * bytes instead of each card guessing.
 */
export const CARD_SIZES = {
  /** 1 / 2 / 3 column listing grid. */
  grid3: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  /** 1 / 2 / 3 / 4 column listing grid. */
  grid4: "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw",
  /** Small leading thumbnail in a horizontal card. */
  thumb: "(min-width: 640px) 132px, 104px",
} as const;
