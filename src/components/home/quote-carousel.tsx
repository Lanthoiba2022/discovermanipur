"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Pause, Play, Star } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Testimonial } from "@/types";
import { cn } from "@/lib/utils";

const ROTATE_MS = 7000;

/**
 * The traveller quotes, auto-rotating — with the full guard rig.
 *
 * A carousel that advances on a bare `setInterval` is a catalogued
 * anti-pattern: it moves under the reader's eyes, it steals focus context, and
 * it keeps running in a background tab. Rotation here is therefore gated on
 * FIVE conditions, all of which must hold:
 *
 *   1. the reader has not pressed the pause control (`wantsPlay`)
 *   2. the pointer is not over the carousel (`hovered`)
 *   3. nothing inside it holds focus (`focused`, via focusin/focusout)
 *   4. it is actually on screen (`visible`, via IntersectionObserver)
 *   5. the tab is in the foreground (`docVisible`, via visibilitychange)
 *
 * …and `prefers-reduced-motion` suppresses it outright.
 *
 * Hydration: `useReducedMotion()` is null during SSR, so it must never decide
 * which ELEMENTS render (see `src/components/motion/reveal.tsx`). It is used
 * here only inside an effect, to decide whether a timer is armed. The pause
 * control's label is derived from `wantsPlay`, which is deterministically
 * `true` on the server and on the first client render, so the markup matches.
 */
export function QuoteCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const reduce = useReducedMotion();
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: "center" });
  const [selected, setSelected] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const [wantsPlay, setWantsPlay] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Both start false so the server pass and the first client render agree; the
  // observers flip them once the browser has something real to report.
  const [visible, setVisible] = useState(false);
  const [docVisible, setDocVisible] = useState(false);

  const many = testimonials.length > 1;

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

  /* Guard 4 — off-screen carousels do not rotate. */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Guard 5 — background tabs do not rotate. */
  useEffect(() => {
    const read = () => setDocVisible(document.visibilityState === "visible");
    read();
    document.addEventListener("visibilitychange", read);
    return () => document.removeEventListener("visibilitychange", read);
  }, []);

  const rotating =
    many && wantsPlay && !hovered && !focused && visible && docVisible && !reduce;

  useEffect(() => {
    if (!embla || !rotating) return;
    const id = window.setInterval(() => embla.scrollNext(), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [embla, rotating]);

  if (testimonials.length === 0) return null;

  return (
    <div
      ref={rootRef}
      role="group"
      aria-roledescription="carousel"
      aria-label="What travellers say"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="relative"
    >
      <div
        ref={emblaRef}
        className="overflow-hidden"
        /* Announce changes only while nothing is moving on its own: a live
           region that fires every seven seconds is worse than none. */
        aria-live={rotating ? "off" : "polite"}
      >
        <ul className="flex touch-pan-y">
          {testimonials.map((t, i) => (
            <li
              key={t.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${testimonials.length}`}
              className="min-w-0 shrink-0 grow-0 basis-full px-1 md:px-6"
            >
              <figure className="mx-auto flex max-w-2xl flex-col items-center text-center">
                <span aria-hidden className="mb-8 font-display text-6xl leading-none text-brass-700/35">
                  &ldquo;
                </span>
                <blockquote className="font-display text-[clamp(1.5rem,1.05rem+1.5vw,2.125rem)] leading-[1.28] tracking-[-0.015em] text-foreground">
                  {t.quote}
                </blockquote>

                <figcaption className="mt-10 flex flex-col items-center gap-3">
                  <Avatar className="size-12">
                    {t.avatar && <AvatarImage src={t.avatar} alt="" />}
                    <AvatarFallback>{t.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{t.name}</p>
                    <p className="eyebrow mt-1.5 text-muted-foreground">
                      {t.origin} · {t.tripType}
                    </p>
                  </div>
                  <p
                    className="mt-1 flex items-center gap-0.5"
                    aria-label={`Rated ${t.rating} out of 5`}
                  >
                    {Array.from({ length: 5 }).map((_, star) => (
                      <Star
                        key={star}
                        aria-hidden
                        className={cn(
                          "size-3.5",
                          // brass-500 is 2.90:1 on ivory and fails the 3:1 bar
                          // for meaningful graphics; brass-700 clears it.
                          star < Math.round(t.rating)
                            ? "fill-brass-700 text-brass-700"
                            : "text-stone-500",
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

      {many && (
        <div className="mt-12 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => embla?.scrollPrev()}
            aria-label="Previous review"
            className="grid size-10 place-items-center rounded-full border border-border-strong transition-colors duration-200 ease-[var(--ease-flat)] hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft aria-hidden className="size-4" />
          </button>

          <ul className="flex items-center gap-2 px-2">
            {testimonials.map((t, i) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => embla?.scrollTo(i)}
                  aria-label={`Show review ${i + 1} of ${testimonials.length}`}
                  aria-current={i === selected}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300 ease-[var(--ease-flat)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
                    i === selected ? "w-7 bg-brass-700" : "w-1.5 bg-stone-500",
                  )}
                />
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => embla?.scrollNext()}
            aria-label="Next review"
            className="grid size-10 place-items-center rounded-full border border-border-strong transition-colors duration-200 ease-[var(--ease-flat)] hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowRight aria-hidden className="size-4" />
          </button>

          {/* A real control, not a decoration: rotation genuinely stops and
              stays stopped until it is pressed again. */}
          <button
            type="button"
            onClick={() => setWantsPlay((v) => !v)}
            aria-pressed={!wantsPlay}
            aria-label={
              wantsPlay ? "Pause automatic rotation" : "Resume automatic rotation"
            }
            className="ml-2 grid size-10 place-items-center rounded-full border border-border-strong transition-colors duration-200 ease-[var(--ease-flat)] hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {wantsPlay ? (
              <Pause aria-hidden className="size-3.5" />
            ) : (
              <Play aria-hidden className="size-3.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
