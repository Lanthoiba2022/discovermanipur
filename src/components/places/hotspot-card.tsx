import { Accessibility, Clock, MapPin, Navigation } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn, meiteiAlias } from "@/lib/utils";
import type { Hotspot } from "@/types";

import { categoryLabel, formatDuration, formatKm, PLACEHOLDER_IMAGE } from "./taxonomy";

export function HotspotCard({
  hotspot,
  preload = false,
  className,
}: {
  hotspot: Hotspot;
  preload?: boolean;
  className?: string;
}) {
  const cover = hotspot.images[0];

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-sm)] transition-shadow duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[var(--shadow-md)] focus-within:shadow-[var(--shadow-md)]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={cover?.src ?? PLACEHOLDER_IMAGE}
          alt={cover?.alt ?? `${hotspot.name} in ${hotspot.location}, Manipur`}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
          preload={preload}
          className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] motion-reduce:transform-none motion-reduce:transition-none"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/5 to-transparent"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge variant="glass" className="text-[11px] uppercase tracking-[0.14em]">
            {categoryLabel(hotspot.category)}
          </Badge>
          {hotspot.accessibility?.wheelchairAccessible && (
            <Badge variant="glass" className="text-[11px]">
              <Accessibility className="size-3" aria-hidden />
              Accessible
            </Badge>
          )}
        </div>
        <p className="absolute bottom-3 left-4 right-4 flex items-center gap-1.5 text-xs font-medium text-cream-50">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{hotspot.district}</span>
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-display text-xl leading-tight">
            <Link
              href={`/hotspots/${hotspot.slug}`}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {hotspot.name}
            </Link>
          </h3>
          {meiteiAlias(hotspot.name, hotspot.meiteiName) && (
            <p className="font-mayek mt-1 text-sm text-muted-foreground" lang="mni-Mtei">
              {meiteiAlias(hotspot.name, hotspot.meiteiName)}
            </p>
          )}
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {hotspot.tagline}
        </p>

        <dl className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Navigation className="size-3.5" aria-hidden />
            <dt className="sr-only">Distance from Imphal</dt>
            <dd>{formatKm(hotspot.distanceFromImphalKm)} from Imphal</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden />
            <dt className="sr-only">Suggested time</dt>
            <dd>{formatDuration(hotspot.durationHours)}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
