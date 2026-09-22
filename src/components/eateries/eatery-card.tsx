import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, MapPin, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/components/filters";
import type { Eatery } from "@/types";

import { priceRangeLabel } from "./eatery-filters";

export function EateryCard({ eatery, preload = false }: { eatery: Eatery; preload?: boolean }) {
  const cover = eatery.images[0];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-sm)] transition-shadow duration-300 hover:shadow-[var(--shadow-md)]">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-sunken">
        {cover ? (
          <Image
            src={cover.src}
            alt={cover.alt}
            fill
            preload={preload}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          />
        ) : null}
        <Badge variant="glass" className="absolute left-4 top-4">
          <span aria-hidden="true">{priceRangeLabel(eatery.priceRange)}</span>
          <span className="sr-only">
            {eatery.priceRange === 1 ? "Budget" : eatery.priceRange === 2 ? "Mid-range" : "Upmarket"}
          </span>
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl leading-tight">
            <Link
              href={`/eateries/${eatery.slug}`}
              className="after:absolute after:inset-0 focus-visible:outline-none"
            >
              {eatery.name}
            </Link>
          </h3>
          {eatery.rating > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm">
              <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
              <span className="font-medium">{eatery.rating.toFixed(1)}</span>
            </span>
          )}
        </div>

        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4" aria-hidden="true" />
          {eatery.location}
        </p>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {eatery.description}
        </p>

        <ul className="mt-auto flex flex-wrap gap-2 pt-2">
          {eatery.cuisines.slice(0, 3).map((cuisine) => (
            <li key={cuisine}>
              <Badge variant="outline">{titleCase(cuisine)}</Badge>
            </li>
          ))}
        </ul>

        {eatery.acceptsReservations && (
          <p className="flex items-center gap-1.5 border-t border-border pt-3 text-sm text-success">
            <CalendarCheck className="size-4" aria-hidden="true" />
            Takes table reservations
          </p>
        )}
      </div>
    </article>
  );
}
