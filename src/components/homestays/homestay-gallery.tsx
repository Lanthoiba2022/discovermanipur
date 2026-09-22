"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { MediaImage } from "@/types";

export function HomestayGallery({ images, title }: { images: MediaImage[]; title: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + images.length) % images.length),
    [images.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-[var(--radius-lg)] bg-surface-sunken text-muted-foreground">
        Photographs of this home are coming soon.
      </div>
    );
  }

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };

  const hero = images[0];
  const rest = images.slice(1, 5);
  const active = images[Math.min(index, images.length - 1)];

  return (
    <>
      <div className="grid gap-2 overflow-hidden rounded-[var(--radius-lg)] md:grid-cols-2 md:gap-3">
        <button
          type="button"
          onClick={() => openAt(0)}
          aria-label={`Open photo 1 of ${images.length}: ${hero.alt}`}
          className="group relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius)] bg-muted md:aspect-auto md:min-h-[24rem]"
        >
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            preload
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
          />
        </button>

        {rest.length > 0 && (
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {rest.map((img, i) => (
              <button
                key={img.src}
                type="button"
                onClick={() => openAt(i + 1)}
                aria-label={`Open photo ${i + 2} of ${images.length}: ${img.alt}`}
                className="group relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius)] bg-muted"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 768px) 25vw, 45vw"
                  className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => openAt(0)}
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-border-strong px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
      >
        <Expand className="size-4" aria-hidden="true" />
        Show all {images.length} photos
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl bg-surface p-4 sm:p-6">
          <DialogTitle className="sr-only">{title} — photo gallery</DialogTitle>
          <DialogDescription className="sr-only">
            Use the left and right arrow keys to move between photographs.
          </DialogDescription>

          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius)] bg-ink-900 sm:aspect-[16/10]">
            <Image
              key={active.src}
              src={active.src}
              alt={active.alt}
              fill
              sizes="(min-width: 1024px) 60vw, 92vw"
              className="object-contain"
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={images.length < 2}
              aria-label="Previous photo"
              className="rounded-full border border-border-strong p-2.5 transition-colors hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>

            <p className="text-sm text-muted-foreground" aria-live="polite">
              <span className="font-medium text-foreground">
                {index + 1} / {images.length}
              </span>
              <span className="ml-3 hidden sm:inline">{active.alt}</span>
            </p>

            <button
              type="button"
              onClick={() => go(1)}
              disabled={images.length < 2}
              aria-label="Next photo"
              className="rounded-full border border-border-strong p-2.5 transition-colors hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>

          {images.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img.src}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    "relative size-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border-2 transition-colors",
                    i === index ? "border-primary" : "border-transparent opacity-70",
                  )}
                >
                  <Image src={img.src} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
