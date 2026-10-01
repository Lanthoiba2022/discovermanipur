import Image from "next/image";

import type { Craft } from "@/types";

import { BandRail } from "@/components/landing/band-rail";
import { BandPill } from "@/components/landing/bands/showcase-card";
import { ShowcaseBand } from "@/components/landing/showcase-band";

import { BandEmpty } from "./gs-empty";
import { CraftShowcaseCard } from "./craft-card";

/**
 * EXQUISITE CRAFTS — the pigment band.
 *
 * The national board runs its crafts stripe as one loud, saturated field with
 * the word knocked out in white, and the instinct is right: after four bands
 * the page needs a stripe that reads as *dye* rather than as landscape. Ours
 * gets there through a full-bleed photograph of stacked handloom graded almost
 * to the phanek crimson, rather than a flat fill — which keeps the stripe
 * saturated while staying distinguishable from the CELEBRATION band directly
 * above it, which is already `tone="crimson"`. (If that band's tone ever
 * changes, this one can go back to a flat `crimson` ground and drop the
 * backdrop.)
 *
 * Left-aligned, because the band above is centred and a page of nine centred
 * mastheads is precisely the failure mode of the site being borrowed from.
 *
 * Rows arrive as a prop — `page.tsx` calls `getCrafts({ featured: true,
 * limit: 8 })` — so the band is a pure server component with no data
 * dependency of its own, and it never assumes a row exists.
 */
export function CraftsBand({ crafts }: { crafts: Craft[] }) {
  return (
    <ShowcaseBand
      id="crafts"
      tone="photo"
      align="left"
      eyebrow="Bought from the maker"
      word="Exquisite crafts"
      tail="of a thousand-year loom"
      backdrop={
        <div aria-hidden className="absolute inset-0 -z-10">
          {/* Verified by eye before use: stacked unglazed black clay pots and
              storage jars, the Andro form. Deliberately NOT the phanek frame —
              that photograph is the Moirang Phee card's own cover, and running
              it here made the band's backdrop repeat one of its own cards. At
              3456px it also has the resolution a full-bleed ground needs.
              Not preloaded — the hero owns the LCP. */}
          <Image
            src="/file-uploads/pot.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Graded to the phanek crimson: a heavy dye layer that turns the
              flat-lay into a colour field, a reading column under the
              left-hand masthead, and a crimson anchor under the rail controls.
              Ivory on the result measures ~9:1 even where the underlying
              photograph is pure white. */}
          <div className="absolute inset-0 bg-ningthou-900/88" />
          <div className="scrim-reading absolute inset-0 opacity-70" />
          {/* The bottom anchor is graded to the crimson rather than to ink:
              `.scrim-copy` ends at 90% black, which turned the lower half of
              the band charcoal and lost the pigment the band exists for. */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ningthou-900 to-transparent" />
        </div>
      }
      action={
        <BandPill href="/store" tone="dark">
          Every craft and maker
        </BandPill>
      }
    >
      {crafts.length > 0 ? (
        <BandRail label="Crafts from Manipuri makers" tone="dark">
          {crafts.map((craft) => (
            <CraftShowcaseCard key={craft.slug} craft={craft} />
          ))}
        </BandRail>
      ) : (
        <BandEmpty
          tone="dark"
          title="The maker directory is still being strung"
          body="Weavers, potters and bamboo workers are listed one at a time, each with their own contact details. Discover Manipur takes no commission on any of it — the money and the relationship stay with the artisan."
          href="/store"
          cta="See what is listed so far"
        />
      )}
    </ShowcaseBand>
  );
}
