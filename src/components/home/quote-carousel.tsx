"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, Quote, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Testimonial } from "@/types";
import { cn } from "@/lib/utils";

export function QuoteCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: "center", skipSnaps: false });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (!embla) return;
    setSelected(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    embla.on("init", onSelect);
    embla.on("select", onSelect);
    embla.on("reInit", onSelect);
    return () => {
      embla.off("init", onSelect);
      embla.off("select", onSelect);
      embla.off("reInit", onSelect);
    };
  }, [embla, onSelect]);

  if (testimonials.length === 0) return null;

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <ul className="flex touch-pan-y">
          {testimonials.map((t) => (
            <li key={t.id} className="min-w-0 shrink-0 grow-0 basis-full px-2 md:px-8">
              <figure className="mx-auto max-w-3xl text-center">
                <Quote aria-hidden className="mx-auto mb-6 size-7 text-accent" />
                <blockquote className="font-display text-2xl leading-[1.3] tracking-[-0.02em] text-foreground sm:text-3xl md:text-[2.15rem]">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-8 flex flex-col items-center gap-3">
                  <Avatar className="size-12">
                    {t.avatar && <AvatarImage src={t.avatar} alt="" />}
                    <AvatarFallback>{t.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{t.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.origin} · {t.tripType}
                    </p>
                  </div>
                  <p className="flex items-center gap-0.5" aria-label={`Rated ${t.rating} out of 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        aria-hidden
                        className={cn(
                          "size-3.5",
                          i < Math.round(t.rating)
                            ? "fill-accent text-accent"
                            : "text-border-strong",
                        )}
                      />
                    ))}
                  </p>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>

      {testimonials.length > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => embla?.scrollPrev()}
            aria-label="Previous review"
            className="grid size-10 place-items-center rounded-full border border-border-strong transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft aria-hidden className="size-4" />
          </button>

          <ul className="flex items-center gap-2">
            {testimonials.map((t, i) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => embla?.scrollTo(i)}
                  aria-label={`Show review ${i + 1} of ${testimonials.length}`}
                  aria-current={i === selected}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    i === selected ? "w-7 bg-primary" : "w-1.5 bg-border-strong",
                  )}
                />
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => embla?.scrollNext()}
            aria-label="Next review"
            className="grid size-10 place-items-center rounded-full border border-border-strong transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowRight aria-hidden className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
