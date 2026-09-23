import type { Testimonial } from "@/types";

import { Band, BandHeader } from "./band";
import { EmptyNote } from "./empty-note";
import { QuoteCarousel } from "./quote-carousel";

/**
 * Third rung of the ladder (62.5rem). A quote wants a short line, so the column
 * narrows again here — and keeps narrowing to the closing call to action.
 */
export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <Band tone="light" measure="tight" pad="md" label="What travellers say">
      <BandHeader
        tone="light"
        eyebrow="Travellers"
        word="What people say."
        completion="After they come down from the hills."
      />

      {testimonials.length === 0 ? (
        <EmptyNote
          title="The first stories are on their way"
          body="Traveller accounts appear here as trips are completed."
          href="/about"
          cta="About Manipur Tourism"
        />
      ) : (
        <QuoteCarousel testimonials={testimonials} />
      )}
    </Band>
  );
}
