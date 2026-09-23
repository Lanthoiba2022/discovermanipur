"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

import { HERO_SLIDES } from "./hero-slides";
import { SLIDE_MS } from "./use-hero-carousel";

/**
 * The hero backdrop.
 *
 * A horizontal track: every frame sits side by side in one row and the row
 * slides left, so the reel reads as one continuous pan across the state. The
 * row carries a trailing copy of the first frame, which is what lets the pan
 * keep going the same way at the wrap instead of rewinding (see the hook).
 *
 * Underneath, the frame on screen drifts slowly back from a 12% zoom, so the
 * fold is never completely still without ever moving enough to distract from
 * the headline sitting on top of it.
 *
 * Still images only, deliberately: the one ambient clip in the project is a
 * general hills montage, and running it under a frame captioned "Loktak Lake"
 * made the fold claim a place it was not showing.
 */
export function HeroStage({
  index,
  animated,
  shown,
}: {
  index: number;
  animated: boolean;
  shown: number;
}) {
  // The trailing clone of the first frame. Rendering it as a real slide is
  // what keeps the pan one-directional across the wrap.
  const frames = [...HERO_SLIDES, HERO_SLIDES[0]];

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className={cn(
          "flex h-full w-full ease-[var(--ease-flat)]",
          animated ? "transition-transform" : "transition-none",
        )}
        style={{
          transform: `translate3d(-${index * 100}%, 0, 0)`,
          transitionDuration: animated ? `${SLIDE_MS}ms` : "0ms",
        }}
      >
        {frames.map((slide, i) => {
          // The clone repeats slide 0's file, so it must not repeat its alt —
          // that would announce the same photograph twice.
          const isClone = i === HERO_SLIDES.length;
          const isLcp = i === 0;
          return (
            <div key={i} className="relative h-full w-full flex-none">
              <Image
                src={slide.src}
                alt={isClone ? "" : slide.alt}
                aria-hidden={isClone || undefined}
                fill
                sizes="100vw"
                preload={isLcp}
                loading={isLcp ? "eager" : "lazy"}
                fetchPriority={isLcp ? "high" : "auto"}
                className={cn(
                  "object-cover object-center",
                  // Only the frame actually on screen drifts; the rest sit
                  // neutral so nothing animates off-screen.
                  i === shown && "hero-drift",
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
