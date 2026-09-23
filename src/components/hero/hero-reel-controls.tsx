"use client";

import { Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";

import { HERO_SLIDES } from "./hero-slides";

/**
 * Caption, frame index and transport for the fold's reel.
 *
 * An auto-rotating region needs a visible, permanent way to stop it — a
 * timer-only carousel is a catalogued anti-pattern — so the pause control is
 * a real button with `aria-pressed`, not a hover affordance.
 *
 * The caption is also the credit line: naming the place is what makes the fold
 * read as reportage rather than stock.
 */
export function HeroReelControls({
  shown,
  paused,
  autoplaying,
  onToggle,
  onSelect,
  holdHandlers,
  className,
}: {
  shown: number;
  paused: boolean;
  autoplaying: boolean;
  onToggle: () => void;
  onSelect: (index: number) => void;
  holdHandlers: {
    onPointerEnter: () => void;
    onPointerLeave: () => void;
    onFocusCapture: () => void;
    onBlurCapture: () => void;
  };
  className?: string;
}) {
  return (
    <div
      {...holdHandlers}
      role="group"
      aria-roledescription="carousel"
      aria-label="Manipur in five frames"
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 text-ivory-50/75",
        className,
      )}
    >
      {/* Announced only when the reel is not advancing on its own — a live
          region that fires every six seconds is noise, not information. */}
      <p
        aria-live={autoplaying ? "off" : "polite"}
        /* Full width below md so a long place name is not clipped to fit
           beside the transport controls. */
        className="eyebrow w-full min-w-0 truncate text-ivory-50/70 md:w-auto"
      >
        {HERO_SLIDES[shown].caption}
      </p>

      <span aria-hidden className="hidden h-px w-5 shrink-0 bg-ivory-50/25 sm:block" />

      <ul className="flex shrink-0 items-center gap-1">
        {HERO_SLIDES.map((slide, i) => {
          const active = i === shown;
          return (
            <li key={slide.src}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={active ? "true" : undefined}
                aria-label={`Show frame ${i + 1} of ${HERO_SLIDES.length}: ${slide.caption}`}
                /* 44px hit area around a 2px rule, so the target is real
                   without the indicator being heavy. */
                className="group grid h-11 w-6 place-items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span
                  className={cn(
                    "block h-0.5 w-full rounded-full transition-all duration-[var(--dur-base)] ease-[var(--ease-flat)]",
                    active
                      ? "bg-brass-300"
                      : "bg-ivory-50/30 group-hover:bg-ivory-50/60",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onToggle}
        aria-pressed={paused}
        aria-label={paused ? "Resume the picture reel" : "Pause the picture reel"}
        className="grid size-11 shrink-0 place-items-center rounded-full border border-ivory-50/25 text-ivory-50/75 transition-colors duration-[var(--dur-base)] ease-[var(--ease-flat)] hover:border-brass-300 hover:text-brass-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {paused ? (
          <Play aria-hidden className="size-3.5" />
        ) : (
          <Pause aria-hidden className="size-3.5" />
        )}
      </button>
    </div>
  );
}
