import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Hotspot } from "@/types";

import { Band, BandHeader } from "./band";
import { EmptyNote } from "./empty-note";
import { PlacesRail } from "./places-rail";

/**
 * The widest rung of the measure ladder (88rem) — the page opens out here and
 * narrows from this point down to the closing call to action.
 */
export function FeaturedPlaces({ hotspots }: { hotspots: Hotspot[] }) {
  return (
    <Band tone="dark" measure="wide" pad="lg" label="Featured places">
      <BandHeader
        tone="dark"
        eyebrow="Featured places"
        word="Sixty places."
        completion="And the sixteen districts they hide in."
        standfirst="Start with the ones people cross the country for — a lake with a walking floor, a fort with a dragon, a hill that flowers for three weeks a year."
        action={
          <Button
            asChild
            variant="outline"
            size="pill"
            className="w-fit border-ivory-50/40 text-ivory-50 hover:bg-ivory-50 hover:text-ink-950"
          >
            <Link href="/hotspots">All places</Link>
          </Button>
        }
      />

      {hotspots.length > 0 ? (
        <PlacesRail hotspots={hotspots} />
      ) : (
        <EmptyNote
          title="The map is still being drawn"
          body="Featured places appear here as soon as the first spots are published. The full list is already browsable."
          href="/hotspots"
          cta="Browse all places"
        />
      )}
    </Band>
  );
}
