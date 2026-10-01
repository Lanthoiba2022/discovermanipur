"use client";

import Link from "next/link";
import { Map } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useSavedItineraries } from "@/lib/itineraries";
import { SavedItineraryCard } from "./saved-itinerary-card";

export function ItinerariesPanel() {
  const { user } = useAuth();
  const rows = useSavedItineraries(user?.id);

  return (
    <section aria-labelledby="itineraries-heading">
      <h2 id="itineraries-heading" className="font-display text-2xl">
        Saved itineraries
      </h2>
      <p className="mt-2 text-muted-foreground">
        Plans you built with the Discover Manipur concierge. Open one to see the day-by-day timeline, rename
        it, or copy it for your travel group.
      </p>

      {rows.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sunken px-6 py-16 text-center">
          <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Map className="size-6" aria-hidden="true" />
          </span>
          <h3 className="font-display text-xl">No plans saved yet</h3>
          <p className="mt-2 max-w-sm text-muted-foreground">
            Tell the concierge how long you have and what you love, then hit “Save this plan” — it
            will be waiting here.
          </p>
          <Button asChild className="mt-6">
            <Link href="/plan">Plan a trip</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {rows.map((row) => (
            <SavedItineraryCard key={row.id} row={row} />
          ))}
        </ul>
      )}
    </section>
  );
}
