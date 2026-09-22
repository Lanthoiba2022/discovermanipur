import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Map, Mountain, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";
import type { Tour } from "@/types";

import { formatDeparture, upcomingDepartures } from "./tour-filters";

export function TourCard({ tour, preload = false }: { tour: Tour; preload?: boolean }) {
  const cover = tour.images[0];
  const departures = upcomingDepartures(tour.departureDates);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-sm)] transition-shadow duration-300 hover:shadow-[var(--shadow-md)]">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-sunken">
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
          {tour.durationDays} {tour.durationDays === 1 ? "day" : "days"}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl leading-tight">
            <Link
              href={`/tours/${tour.slug}`}
              className="after:absolute after:inset-0 focus-visible:outline-none"
            >
              {tour.title}
            </Link>
          </h3>
          {tour.rating > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm">
              <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
              <span className="font-medium">{tour.rating.toFixed(1)}</span>
            </span>
          )}
        </div>

        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <Map className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            {tour.districtsCovered.length > 0
              ? tour.districtsCovered.join(" · ")
              : "Route published soon"}
          </span>
        </p>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {tour.description}
        </p>

        <p className="flex items-center gap-1.5 text-sm capitalize text-muted-foreground">
          <Mountain className="size-4" aria-hidden="true" />
          {tour.difficulty}
        </p>

        <p className="mt-auto flex items-start gap-1.5 pt-2 text-sm text-muted-foreground">
          <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            {departures.length > 0
              ? `Departs ${departures.slice(0, 2).map(formatDeparture).join(", ")}${
                  departures.length > 2 ? ` +${departures.length - 2} more` : ""
                }`
              : "Private departures on request"}
          </span>
        </p>

        <p className="border-t border-border pt-3">
          <span className="font-display text-xl">{formatINR(tour.pricePerPerson)}</span>
          <span className="text-sm text-muted-foreground"> / person</span>
        </p>
      </div>
    </article>
  );
}
