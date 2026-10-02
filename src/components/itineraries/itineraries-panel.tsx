"use client";

import { Map } from "lucide-react";

import { IntentLink } from "@/components/shared/intent-link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/use-auth";
import { useItineraryStorage, useSavedItineraries, type ItineraryStorage } from "@/lib/itineraries";
import { SavedItineraryCard } from "./saved-itinerary-card";

const WHERE: Record<ItineraryStorage, string> = {
  account: "They are saved to your account and follow you to any device you sign in on.",
  browser: "They are kept in this browser only, so clearing site data removes them.",
  pending: "",
  error: "We could not load your saved plans just now. Refresh the page to try again.",
};

export function ItinerariesPanel() {
  const { user } = useAuth();
  const rows = useSavedItineraries(user?.id);
  const storage = useItineraryStorage(user?.id);

  return (
    <section aria-labelledby="itineraries-heading">
      <h2 id="itineraries-heading" className="font-display text-2xl">
        Saved itineraries
      </h2>
      <p className="mt-2 text-muted-foreground">
        Plans you built with the Discover Manipur concierge. Open one to see the day-by-day timeline, rename
        it, or copy it for your travel group. {WHERE[storage]}
      </p>

      {storage === "pending" ? (
        <div className="mt-8 space-y-4" aria-busy="true">
          <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
        </div>
      ) : storage === "error" ? null : rows.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sunken px-6 py-16 text-center">
          <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Map className="size-6" aria-hidden="true" />
          </span>
          <h3 className="font-display text-xl">No plans saved yet</h3>
          <p className="mt-2 max-w-sm text-muted-foreground">
            Tell the concierge how long you have and what you love, then hit “Save this plan”. It
            will be waiting here.
          </p>
          <Button asChild className="mt-6">
            <IntentLink href="/plan">Plan a trip</IntentLink>
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
