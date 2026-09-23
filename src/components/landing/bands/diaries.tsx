import type { Testimonial } from "@/types";

import { BandPill } from "@/components/landing/bands/showcase-card";
import { ShowcaseBand } from "@/components/landing/showcase-band";

import { BandEmpty } from "./gs-empty";
import { DiaryQuoteCard } from "./dia-quote-card";

/**
 * TRAVEL DIARIES — the quotes band.
 *
 * A static grid, on purpose. The obvious move here is an auto-rotating quote
 * carousel, and the obvious move is wrong: a timer that moves text a reader is
 * part-way through is a catalogued accessibility failure, and doing it
 * *properly* means a pause button, pause on hover, pause on `focusin`, pause
 * off-screen, pause on tab-hide and an opt-out under `prefers-reduced-motion`
 * — a lot of machinery whose best outcome is that nothing moves. Six quotes
 * shown at once say more than one quote shown six times, so there is no timer
 * here and no `"use client"` in this subtree at all.
 *
 * Sand ground and a left masthead: it sits between the ivory places band and
 * the crimson close, and the warm ground stops three light bands running
 * together.
 */
export function DiariesBand({
  testimonials,
  limit = 6,
}: {
  testimonials: Testimonial[];
  /** The grid reads as an editorial spread at six; beyond that it is a list. */
  limit?: number;
}) {
  const shown = testimonials.slice(0, limit);

  return (
    <ShowcaseBand
      id="diaries"
      tone="sand"
      align="left"
      eyebrow="In their own words"
      word="Travel diaries"
      tail="worth a thousand stories"
      ghost="ꯋꯥ"
      action={<BandPill href="/plan">Write your own</BandPill>}
    >
      {shown.length === 0 ? (
        <BandEmpty
          title="The first diaries are still on the road"
          body="Accounts appear here as travellers come back down from the hills and tell us how it went — unedited, hosts named, nothing bought."
          href="/about"
          cta="How Manipur Tourism works"
        />
      ) : (
        <ul
          aria-label="What travellers said"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {shown.map((testimonial) => (
            <DiaryQuoteCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </ul>
      )}
    </ShowcaseBand>
  );
}
