"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The horizontal card rail every showcase band uses.
 *
 * Deliberately an ordinary scroll container rather than a slide engine: it
 * keeps native touch, trackpad and keyboard scrolling, it never hijacks the
 * page, and it degrades to a plain scrollable row with no JavaScript. The
 * arrows page it by one card, and they disable themselves at the ends instead
 * of wrapping, so nothing moves under the reader unexpectedly.
 */
export function BandRail({
  children,
  label,
  tone = "light",
  className,
}: {
  children: React.ReactNode;
  /** Names the rail for assistive tech, e.g. "Featured places". */
  label: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, [sync]);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 24 : el.clientWidth * 0.8;
    el.scrollBy({
      left: dir * step,
      // Reduced-motion readers get the jump without the glide; this changes
      // only the behaviour, never which elements render.
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  const dark = tone === "dark";

  return (
    <div className={cn("relative", className)}>
      <ul
        ref={ref}
        aria-label={label}
        className={cn(
          "flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2",
          // The rail bleeds to the viewport edge on phones so a card is never
          // clipped mid-gutter, and is re-inset at the shell width above it.
          "-mx-4 scroll-px-4 px-4 md:-mx-8 md:scroll-px-8 md:px-8",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {children}
      </ul>

      <div className="mt-8 flex items-center justify-center gap-3">
        {([-1, 1] as const).map((dir) => {
          const disabled = dir === -1 ? atStart : atEnd;
          const Icon = dir === -1 ? ArrowLeft : ArrowRight;
          return (
            <button
              key={dir}
              type="button"
              onClick={() => page(dir)}
              disabled={disabled}
              aria-label={dir === -1 ? `Previous ${label}` : `Next ${label}`}
              className={cn(
                "grid size-11 place-items-center rounded-full border transition-colors duration-[var(--dur-base)] ease-[var(--ease-flat)]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                dark
                  ? "border-ivory-50/30 text-ivory-50 hover:border-brass-300 hover:text-brass-300"
                  : "border-border-strong text-foreground hover:border-primary hover:text-primary",
                disabled && "cursor-not-allowed opacity-35 hover:border-inherit hover:text-inherit",
              )}
            >
              <Icon aria-hidden className="size-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
