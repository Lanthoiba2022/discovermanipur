"use client";

import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Hotspot } from "@/types";
import { cn, meiteiAlias } from "@/lib/utils";

export function PlacesRail({ hotspots }: { hotspots: Hotspot[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const drag = useRef<{ active: boolean; startX: number; startLeft: number; moved: boolean }>({
    active: false,
    startX: 0,
    startLeft: 0,
    moved: false,
  });

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    sync();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync, hotspots.length]);

  function nudge(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(280, el.clientWidth * 0.66), behavior: "smooth" });
  }

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
      <div className="mb-6 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => nudge(-1)}
          disabled={atStart}
          aria-label="Scroll places left"
          className="grid size-10 place-items-center rounded-full border border-border-strong text-foreground transition-colors hover:bg-muted disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => nudge(1)}
          disabled={atEnd}
          aria-label="Scroll places right"
          className="grid size-10 place-items-center rounded-full border border-border-strong text-foreground transition-colors hover:bg-muted disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowRight aria-hidden className="size-4" />
        </button>
      </div>

      <ul
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className={cn(
          "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:-mx-8 md:gap-6 md:px-8",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {hotspots.map((h) => (
          <li
            key={h.id}
            className="group w-[76vw] shrink-0 snap-start sm:w-[42vw] lg:w-[24rem] xl:w-[25rem]"
          >
            <Link
              href={`/hotspots/${h.slug}`}
              onClick={(e) => {
                if (drag.current.moved) e.preventDefault();
              }}
              className="block overflow-hidden rounded-[var(--radius-lg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-lg)] bg-surface-sunken">
                {h.images[0]?.src && (
                  <Image
                    src={h.images[0].src}
                    alt={h.images[0].alt || `${h.name}, ${h.location}`}
                    fill
                    draggable={false}
                    sizes="(max-width: 640px) 76vw, (max-width: 1024px) 42vw, 25rem"
                    className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                  />
                )}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-loktak-900/92 via-loktak-900/45 to-loktak-900/5"
                />
                <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                  <p className="flex items-center gap-1.5 text-xs text-cream-50/75">
                    <MapPin aria-hidden className="size-3.5" />
                    {h.location}
                  </p>
                  <h3 className="mt-2 font-display text-2xl leading-tight text-cream-50">
                    {h.name}
                  </h3>
                  {meiteiAlias(h.name, h.meiteiName) && (
                    <p className="font-mayek text-sm text-kangla-400">{meiteiAlias(h.name, h.meiteiName)}</p>
                  )}
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-cream-50/70">
                    {h.tagline}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
