"use client";

import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CatalogueImage } from "@/components/shared/catalogue-image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { MediaImage } from "@/types";

/**
 * Photo grid plus a keyboard-operable lightbox, used by the hotspot and
 * festival detail pages.
 *
 * Most of these photos are Google Places photos, so both frames render
 * through `CatalogueImage` (Places sources bypass `/_next/image`, our own
 * files stay optimized) and both show the photo's `credit`: on the grid tile,
 * because the photo is already on screen there, and in the lightbox caption.
 */
export function GalleryLightbox({
  images,
  title,
  className,
}: {
  images: MediaImage[];
  title: string;
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isOpen = openIndex !== null;
  const count = images.length;

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) => (current === null ? null : (current + delta + count) % count));
    },
    [count],
  );

  useEffect(() => {
    if (!isOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, step]);

  if (count === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Photographs of {title} are on their way.
      </p>
    );
  }

  const active = openIndex === null ? null : images[openIndex];

  return (
    <>
      <ul
        className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}
        aria-label={`Photo gallery of ${title}`}
      >
        {images.map((image, index) => (
          <li key={`${image.src}-${index}`}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-[var(--radius)] bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <CatalogueImage
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
                className="object-cover transition-transform duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 motion-reduce:transform-none"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-ink-900/0 opacity-0 transition-opacity duration-200 group-hover:bg-ink-900/30 group-hover:opacity-100 group-focus-visible:opacity-100">
                <Expand className="size-5 text-cream-50" aria-hidden />
              </span>
              <span className="sr-only">Enlarge photo {index + 1} of {count}</span>
              {image.credit && (
                /* Credit shows on the grid too, not only once the lightbox is
                   open; the photo is already on screen here. */
                <span className="pointer-events-none absolute bottom-1 right-1.5 text-[9px] leading-none text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {image.credit}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={isOpen} onOpenChange={(next) => !next && setOpenIndex(null)}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">
            {title}, photo {(openIndex ?? 0) + 1} of {count}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Use the left and right arrow keys to move between photos, Escape to close.
          </DialogDescription>

          {active && (
            <figure className="relative">
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[var(--radius-lg)] bg-ink-900">
                <CatalogueImage
                  src={active.src}
                  alt={active.alt}
                  fill
                  sizes="(min-width: 1024px) 60vw, 92vw"
                  className="object-contain"
                />
              </div>
              <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-cream-50">
                <span>{active.alt}</span>
                <span className="text-xs text-cream-200">
                  {(openIndex ?? 0) + 1} / {count}
                  {active.credit ? ` · ${active.credit}` : ""}
                </span>
              </figcaption>

              {count > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous photo"
                    className="glass absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-3 text-foreground transition-colors hover:bg-surface"
                  >
                    <ChevronLeft className="size-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next photo"
                    className="glass absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-3 text-foreground transition-colors hover:bg-surface"
                  >
                    <ChevronRight className="size-5" aria-hidden />
                  </button>
                </>
              )}
            </figure>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
