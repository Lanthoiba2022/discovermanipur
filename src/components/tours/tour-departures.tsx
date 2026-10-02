"use client";

import { CalendarDays } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useMounted } from "@/lib/use-mounted";

import { formatDeparture, upcomingDepartures } from "./tour-filters";

/**
 * The upcoming departures, earliest first, rendered without a placeholder.
 *
 * The tour pages are static and rebuilt only when the catalogue changes, so
 * "today" read during render is frozen at the build day, and the browser
 * reading its own clock during hydration would disagree with the server's
 * HTML. The same approach as `StayDatePicker` resolves both: the server
 * component computes `anchorDate` (today in Asia/Kolkata, `YYYY-MM-DD`; see
 * `departuresAnchor` in `./tour-card`) and passes it down, and the server
 * render and the hydration render both filter against it, so the HTML that
 * crawlers, link previews and no-JS readers get lists real dates and React
 * sees the same markup on both sides. Once mounted (`useMounted` flips without
 * an effect-driven state update) the list is filtered again with
 * `upcomingDepartures`, against the reader's actual day in India, which drops
 * any departure that has passed since the build.
 *
 * The anchored filter is the same comparison `upcomingDepartures` makes
 * (stored `YYYY-MM-DD` strings compared lexicographically), with the anchor
 * standing in for today.
 */
export function useUpcomingDepartures(dates: string[], anchorDate: string): string[] {
  const mounted = useMounted();
  return mounted ? upcomingDepartures(dates) : [...dates].filter((d) => d >= anchorDate).sort();
}

/**
 * The "Departures" list on a tour page. Dates come from
 * `useUpcomingDepartures`, so the server HTML already lists them; only the
 * date strings and the anchor cross into the client.
 *
 * Even an upcoming date is the operator's published plan rather than a held
 * place, hence the short note under the list.
 */
export function TourDepartures({
  dates,
  anchorDate,
}: {
  dates: string[];
  /** `YYYY-MM-DD` the server took as today; used until hydration. */
  anchorDate: string;
}) {
  const upcoming = useUpcomingDepartures(dates, anchorDate);

  if (upcoming.length === 0) {
    return (
      <p className="mt-3 text-muted-foreground">
        No fixed departures listed. Tell us your dates and we will run this privately.
      </p>
    );
  }

  return (
    <>
      <ul className="mt-4 flex flex-wrap gap-2">
        {upcoming.map((date) => (
          <li key={date}>
            <Badge variant="outline">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              {formatDeparture(date)}
            </Badge>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Dates can change. Check with the operator before you plan around one.
      </p>
    </>
  );
}
