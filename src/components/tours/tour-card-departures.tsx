"use client";

import { formatDeparture } from "./tour-filters";
import { useUpcomingDepartures } from "./tour-departures";

/**
 * The "Departs ..." line on a tour card.
 *
 * Same approach as `TourDepartures` on the tour page (see
 * `useUpcomingDepartures`): /tours, the one page that renders `TourCard`, is
 * prerendered, so the server render and the hydration render filter against
 * the `anchorDate` the server passed, and the line is filtered again against
 * the reader's real day in India once mounted. The prerendered HTML therefore
 * names real dates rather than a placeholder. Only the date strings and the
 * anchor cross into the client.
 */
export function TourCardDepartures({
  dates,
  anchorDate,
}: {
  dates: string[];
  /** `YYYY-MM-DD` the server took as today; used until hydration. */
  anchorDate: string;
}) {
  const departures = useUpcomingDepartures(dates, anchorDate);

  if (departures.length === 0) return <>Private departures on request</>;

  return (
    <>
      Departs {departures.slice(0, 2).map(formatDeparture).join(", ")}
      {departures.length > 2 ? ` +${departures.length - 2} more` : ""}
    </>
  );
}
