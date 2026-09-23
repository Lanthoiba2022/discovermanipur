"use client";

import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Hotspot } from "@/types";
import { cn, meiteiAlias } from "@/lib/utils";

/**
 * The featured-places rail.
 *
 * Horizontal rails are only safe when they stay a *presentation* choice and
 * never become the navigation, so this one deliberately holds to four rules:
 *
 * - It never scroll-jacks. There is no wheel or touch handler that redirects
 *   vertical scrolling; the page scrolls past the rail exactly as it would past
 *   a paragraph.
 * - Every card is an ordinary link, and the band's masthead carries an "All
 *   places" route, so there is always a plain vertical path to the same content.
 * - Arrows AND drag AND native touch/trackpad scrolling all work.
 * - Under `prefers-reduced-motion` the arrows jump instead of gliding. Reduced
 *   motion changes only the scroll *behaviour*, never which elements render, so
 *   the SSR pass and a reduced-motion client agree.
 */
export function PlacesRail({ hotspots }: { hotspots: Hotspot[] }) {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLUListElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 8);
    setAtEnd(el.scrollLeft >= max - 8);
    // Written straight to the node: scroll fires far too often to route this
    // through React state, and nothing else renders this element.
    const bar = progressRef.current;
    if (bar) {
      const ratio = max > 0 ? Math.min(1, Math.max(0, el.scrollLeft / max)) : 1;
      bar.style.transform = `scaleX(${0.16 + ratio * 0.84})`;
    }
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync, hotspots.length]);

  const nudge = useCallback(
    (direction: 1 | -1) => {
      const el = trackRef.current;
      if (!el) return;
      el.scrollBy({
        left: direction * Math.max(280, el.clientWidth * 0.7),
        behavior: reduce ? "auto" : "smooth",
      });
    },
    [reduce],
  );

  function onPointerDown(e: React.PointerEvent<HTMLUListElement>) {
    if (e.pointerType !== "mouse") return;
    const el = trackRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false };
  }

  function onPointerMove(e: React.PointerEvent<HTMLUListElement>) {
    const el = trackRef.current;
    if (!el || !drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.startLeft - dx;
  }

  function endDrag() {
    drag.current.active = false;
  }

  if (hotspots.length === 0) return null;

  return (
    <div className="relative">
      <div className="mb-7 flex items-center gap-6">
        <span aria-hidden className="h-px flex-1 bg-ivory-50/18">
          <span
            ref={progressRef}
            className="block h-px w-full origin-left bg-brass-400 [transform:scaleX(0.16)]"
          />
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => nudge(-1)}
            disabled={atStart}
            aria-label="Scroll places left"
            className="grid size-11 place-items-center rounded-full border border-ivory-50/28 text-ivory-50 transition-colors duration-200 ease-[var(--ease-flat)] hover:border-brass-400 hover:bg-brass-400 hover:text-ink-950 disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            disabled={atEnd}
            aria-label="Scroll places right"
            className="grid size-11 place-items-center rounded-full border border-ivory-50/28 text-ivory-50 transition-colors duration-200 ease-[var(--ease-flat)] hover:border-brass-400 hover:bg-brass-400 hover:text-ink-950 disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowRight aria-hidden className="size-4" />
          </button>
        </div>
      </div>

      <ul
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className={cn(
          "-mx-4 flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 active:cursor-grabbing md:-mx-8 md:gap-6 md:px-8",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {hotspots.map((h, i) => (
          <li
            key={h.id}
            className="group w-[78vw] shrink-0 snap-start sm:w-[44vw] lg:w-[23rem] xl:w-[24.5rem]"
          >
            <Link
              href={`/hotspots/${h.slug}`}
              onClick={(e) => {
                if (drag.current.moved) e.preventDefault();
              }}
              className="block rounded-[var(--radius-lg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-lg)] bg-ink-900">
                {h.images[0]?.src && (
                  <Image
                    src={h.images[0].src}
                    alt={h.images[0].alt || `${h.name}, ${h.location}`}
                    fill
                    draggable={false}
                    sizes="(max-width: 640px) 78vw, (max-width: 1024px) 44vw, 24rem"
                    className="object-cover transition-transform duration-[600ms] ease-[var(--ease-flat)] group-hover:scale-[1.06]"
                  />
                )}
                <div aria-hidden className="scrim-copy absolute inset-0" />
                {/* A second, shorter scrim over the copy block only. The card
                    photographs vary from a dark fort to a bright midday aerial,
                    and the shared gradient alone left the smallest line at
                    3.97:1 over the brightest of them. */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-950/80 via-ink-950/45 to-transparent"
                />

                {/* The index gets its own ground rather than relying on the
                    photograph: over an open sky it measured 2.4:1 unbacked. */}
                <p className="eyebrow absolute left-5 top-5 rounded-full bg-ink-950/75 px-2.5 py-1.5 text-ivory-50 md:left-6 md:top-6">
                  {String(i + 1).padStart(2, "0")}
                </p>

                <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                  <p className="flex items-center gap-1.5 text-xs text-ivory-50/90">
                    <MapPin aria-hidden className="size-3.5 shrink-0" />
                    {h.location}
                  </p>
                  {/* Names are never clamped: a truncated place name is a
                      broken promise, whatever it does to card heights. */}
                  <h3 className="mt-2 font-display text-[1.6rem] leading-[1.12] text-ivory-50">
                    {h.name}
                  </h3>
                  {meiteiAlias(h.name, h.meiteiName) && (
                    <p className="font-mayek text-sm text-brass-300">
                      {meiteiAlias(h.name, h.meiteiName)}
                    </p>
                  )}
                  <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-ivory-50/80">
                    {h.tagline}
                  </p>
                  <span
                    aria-hidden
                    className="mt-5 block h-px w-10 origin-left bg-brass-400 transition-transform duration-[400ms] ease-[var(--ease-flat)] group-hover:scale-x-[3.2]"
                  />
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
