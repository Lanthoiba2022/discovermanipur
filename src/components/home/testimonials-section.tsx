import { Section } from "@/components/layout/section";
import type { Testimonial } from "@/types";

import { EmptyNote } from "./empty-note";
import { QuoteCarousel } from "./quote-carousel";

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <Section eyebrow="Travellers" title="What people say after they come down from the hills">
      {testimonials.length === 0 ? (
        <EmptyNote
          title="The first stories are on their way"
          body="Traveller reviews will appear here as trips are completed."
          href="/about"
          cta="About Manipur Tourism"
        />
      ) : (
        <QuoteCarousel testimonials={testimonials} />
      )}
    </Section>
  );
}
