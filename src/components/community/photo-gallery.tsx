"use client";

import { ArrowUpRight, ChevronLeft, ChevronRight, Expand } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { CommunityPhoto } from "@/lib/community/types";
import { cn } from "@/lib/utils";

/** The photo's credit, and a link to the page that proves its licence when there is one. */
function Credit({ photo, className }: { photo: CommunityPhoto; className?: string }) {
  return (
    <span className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      <span>{photo.credit}</span>
      {photo.sourceUrl && (
        <a
          href={photo.sourceUrl}
          target="_blank"
          rel="nofollow ugc noopener noreferrer"
          className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:no-underline"
        >
          Source
          <ArrowUpRight className="size-3" aria-hidden="true" />
          <span className="sr-only">for this photo (opens in a new tab)</span>
        </a>
      )}
    </span>
  );
}

/**
 * Community photos as a grid of thumbnails, each opening full size in a
 * dialog. Credits are printed under every thumbnail and in the dialog, not
 * only on hover. Arrow keys move between photos while the dialog is open.
 *
 * Every image is rendered `unoptimized`: the files are resized on upload, and
 * the photo route checks the viewer's session, which the optimizer would not
 * carry.
 */
export function PhotoGallery({
  photos,
  title,
  className,
}: {
  photos: CommunityPhoto[];
  title: string;
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isOpen = openIndex !== null;
  const count = photos.length;

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) => (current === null ? null : (current + delta + count) % count));
    },
    [count],
  );

  useEffect(() => {
    if (!isOpen || count < 2) return;
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
  }, [isOpen, count, step]);

  if (count === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        No photos have been added for {title} yet.
      </p>
    );
  }

  const active = openIndex === null ? null : photos[openIndex];

  return (
    <>
      <ul
        className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3", className)}
        aria-label={`Photos of ${title}`}
      >
        {photos.map((photo, index) => (
          <li key={photo.id} className={cn(index === 0 && "col-span-2 sm:col-span-3")}>
            <figure>
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                className={cn(
                  "group relative block w-full overflow-hidden",
                  index === 0 ? "aspect-[16/9]" : "aspect-[4/3]",
                  " rounded-[var(--radius)] bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                )}
              >
                <Image
                  src={index === 0 ? photo.src : photo.thumbSrc}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  unoptimized
                  className="absolute inset-0 size-full object-cover transition-transform duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-ink-900/0 opacity-0 transition-opacity duration-200 group-hover:bg-ink-900/30 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
                  <Expand className="size-5 text-cream-50" aria-hidden="true" />
                </span>
                <span className="sr-only">
                  Enlarge photo {index + 1} of {count}
                </span>
              </button>
              <figcaption className="mt-2 text-xs leading-snug text-muted-foreground">
                <Credit photo={photo} />
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <Dialog open={isOpen} onOpenChange={(next) => !next && setOpenIndex(null)}>
        <DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">
            {title}, photo {(openIndex ?? 0) + 1} of {count}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {count > 1
              ? "Use the left and right arrow keys to move between photos, Escape to close."
              : "Press Escape to close."}
          </DialogDescription>

          {active && (
            <figure className="relative">
              <div className="relative flex max-h-[78vh] w-full items-center justify-center overflow-hidden rounded-[var(--radius-lg)] bg-ink-900">
                <Image
                  key={active.id}
                  src={active.src}
                  alt={active.alt}
                  width={active.width}
                  height={active.height}
                  unoptimized
                  className="h-auto max-h-[78vh] w-auto max-w-full object-contain"
                />
              </div>
              <figcaption className="mt-3 flex flex-wrap items-start justify-between gap-3 text-sm text-cream-50">
                <span className="min-w-0">{active.alt}</span>
                <span className="flex flex-wrap items-center gap-x-2 text-xs text-cream-200">
                  <span>
                    {(openIndex ?? 0) + 1} / {count}
                  </span>
                  <Credit photo={active} />
                </span>
              </figcaption>

              {count > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous photo"
                    className="glass absolute left-3 top-[39vh] -translate-y-1/2 rounded-full p-3 text-foreground transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <ChevronLeft className="size-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next photo"
                    className="glass absolute right-3 top-[39vh] -translate-y-1/2 rounded-full p-3 text-foreground transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <ChevronRight className="size-5" aria-hidden="true" />
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
