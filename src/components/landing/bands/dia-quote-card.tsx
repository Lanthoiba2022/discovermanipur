import { MapPin, Quote, Star } from "lucide-react";

import type { Testimonial } from "@/types";

/**
 * Five stars, drawn once.
 *
 * The glyphs are `aria-hidden` and the rating is announced as a sentence
 * instead, because "star star star star star" is not a rating. The filled
 * glyph is `brass-700`: `brass-500` measures 2.90:1 on the ivory ground and
 * fails the 3:1 non-text bar that a graphic carrying meaning has to clear.
 */
function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating);

  return (
    <p className="flex items-center gap-1">
      <span aria-hidden className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={
              i <= filled
                ? "size-4 fill-brass-700 text-brass-700"
                : "size-4 fill-transparent text-ivory-300"
            }
          />
        ))}
      </span>
      <span className="sr-only">Rated {filled} out of 5</span>
    </p>
  );
}

/**
 * One traveller's diary entry.
 *
 * A testimonial carries no slug and no link target, so this card is
 * deliberately not a link and not a `group` — nothing here is clickable, and
 * pretending otherwise would be a hover affordance that goes nowhere. The
 * quote is the only clamped text on the card: the name, the origin and the
 * trip all wrap.
 */
export function DiaryQuoteCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <li className="flex h-full flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-6 md:p-7">
      <Quote aria-hidden className="size-7 shrink-0 text-lily-400" />

      <blockquote className="mt-4 flex-1">
        <p className="line-clamp-6 text-[0.9375rem] leading-[1.65] text-foreground md:text-base">
          {testimonial.quote}
        </p>
      </blockquote>

      <footer className="mt-6 border-t border-border pt-5">
        <Stars rating={testimonial.rating} />

        <p className="mt-3 font-display text-lg leading-snug font-medium text-foreground">
          {testimonial.name}
        </p>

        <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {testimonial.origin}
        </p>

        <p className="eyebrow mt-3.5 text-brass-700">{testimonial.tripType}</p>
      </footer>
    </li>
  );
}
