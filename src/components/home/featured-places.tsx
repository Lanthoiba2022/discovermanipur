import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import type { Hotspot } from "@/types";

import { EmptyNote } from "./empty-note";
import { PlacesRail } from "./places-rail";

export function FeaturedPlaces({ hotspots }: { hotspots: Hotspot[] }) {
  return (
    <Section
      tone="dark"
      eyebrow="Featured places"
      title="Sixty places, and the sixteen districts they hide in"
      description="Start with the ones people cross the country for — a lake with a walking floor, a fort with a dragon, a hill that flowers for three weeks a year."
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
    >
      {hotspots.length > 0 ? (
        <PlacesRail hotspots={hotspots} />
      ) : (
        <EmptyNote
          title="The map is still being drawn"
          body="Featured places appear here as soon as the first spots are published."
          href="/hotspots"
          cta="Browse all places"
        />
      )}
    </Section>
  );
}
