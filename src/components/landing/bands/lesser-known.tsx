import type { Hotspot } from "@/types";

import { BandRail } from "@/components/landing/band-rail";
import { BandPill } from "@/components/landing/bands/showcase-card";
import { ShowcaseBand } from "@/components/landing/showcase-band";

import { BandEmpty } from "./gs-empty";
import { LesserKnownCard } from "./lk-card";

/**
 * LESSER KNOWN: the quiet band.
 *
 * Deliberately the lightest ground on the page and the one with the most air:
 * it lands straight after the crimson crafts stripe, and the whole argument of
 * the band is that these places are not the loud ones. Centred masthead, to
 * put the axis back after the crafts band pushed it left.
 *
 * `hotspots` is whatever `page.tsx` passes in: it filters the catalogue down
 * to the first eight NON-featured rows, so the prop is simply "quieter places"
 * as far as this band is concerned. It makes
 * no assumption about `featured` itself, which means the filter can move or
 * change shape without touching this file.
 */
export function LesserKnownBand({ hotspots }: { hotspots: Hotspot[] }) {
  return (
    <ShowcaseBand
      id="lesser-known"
      tone="ivory"
      align="center"
      eyebrow="Off the obvious route"
      word="Lesser known"
      tail="worth the extra hour on the road"
      ghost="ꯂꯝ"
      action={<BandPill href="/hotspots">The full gazetteer</BandPill>}
    >
      {hotspots.length === 0 ? (
        <BandEmpty
          title="Every place we have is already on the front page"
          body="The quieter corners (the hill waterfalls, the single-street villages, the caves nobody signposts) are still being written up district by district."
          href="/hotspots"
          cta="Browse all places"
        />
      ) : (
        <BandRail label="Quieter places in Manipur">
          {hotspots.map((hotspot) => (
            <LesserKnownCard key={hotspot.id} hotspot={hotspot} />
          ))}
        </BandRail>
      )}
    </ShowcaseBand>
  );
}
