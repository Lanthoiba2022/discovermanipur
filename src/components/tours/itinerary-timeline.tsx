import { Bed, MapPin, UtensilsCrossed } from "lucide-react";

import type { TourDay } from "@/types";

/** Day-by-day vertical timeline for a tour itinerary. */
export function ItineraryTimeline({ days }: { days: TourDay[] }) {
  if (days.length === 0) {
    return (
      <p className="text-muted-foreground">
        The detailed day-by-day plan for this route is being finalised with our guides.
      </p>
    );
  }

  return (
    <ol className="relative flex flex-col gap-8 border-l border-border pl-8 sm:pl-10">
      {days.map((day) => (
        <li key={day.day} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[41px] top-1 flex size-8 items-center justify-center rounded-full border border-border bg-accent text-sm font-medium text-accent-foreground sm:-left-[52px] sm:size-10"
          >
            {day.day}
          </span>

          <h3 className="font-display text-xl">
            <span className="sr-only">Day {day.day}: </span>
            {day.title}
          </h3>
          <p className="mt-2 leading-relaxed text-muted-foreground">{day.summary}</p>

          <dl className="mt-4 flex flex-col gap-3 text-sm">
            {day.stops.length > 0 && (
              <div className="flex items-start gap-2">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="size-4" aria-hidden="true" />
                  <span className="sr-only">Stops</span>
                </dt>
                <dd>{day.stops.join(" → ")}</dd>
              </div>
            )}
            {day.meals.length > 0 && (
              <div className="flex items-start gap-2">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <UtensilsCrossed className="size-4" aria-hidden="true" />
                  <span className="sr-only">Meals</span>
                </dt>
                <dd>{day.meals.join(", ")}</dd>
              </div>
            )}
            {day.stay && (
              <div className="flex items-start gap-2">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Bed className="size-4" aria-hidden="true" />
                  <span className="sr-only">Stay</span>
                </dt>
                <dd>{day.stay}</dd>
              </div>
            )}
          </dl>
        </li>
      ))}
    </ol>
  );
}
