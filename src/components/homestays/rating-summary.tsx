import { Star } from "lucide-react";

export function RatingSummary({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  if (reviewCount === 0) {
    return (
      <section
        aria-labelledby="reviews-heading"
        className="rounded-[var(--radius-lg)] border border-dashed border-border-strong p-6"
      >
        <h2 id="reviews-heading" className="font-display text-xl">
          No reviews yet
        </h2>
        <p className="mt-2 text-muted-foreground">
          This home has just joined Discover Manipur. Be the first to stay and tell the next traveller what
          the mornings are like.
        </p>
      </section>
    );
  }

  const rounded = Math.round(rating);

  return (
    <section
      aria-labelledby="reviews-heading"
      className="rounded-[var(--radius-lg)] border border-border p-6"
    >
      <h2 id="reviews-heading" className="font-display text-xl">
        Guest rating
      </h2>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        <p className="font-display text-4xl leading-none">{rating.toFixed(1)}</p>
        <div>
          <p className="flex gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                aria-hidden="true"
                className={
                  i < rounded ? "size-4 fill-accent text-accent" : "size-4 text-border-strong"
                }
              />
            ))}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {reviewCount} verified {reviewCount === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>
    </section>
  );
}
