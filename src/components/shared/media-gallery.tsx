"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { MediaImage } from "@/types";

/**
 * Shared detail-page gallery for the experiences / eateries / tours /
 * transport slice. Main frame plus keyboard-operable thumbnails.
 */
export function MediaGallery({
  images,
  title,
  preload = true,
}: {
  images: MediaImage[];
  title: string;
  preload?: boolean;
}) {
  const [active, setActive] = useState(0);
  const current = images[active];

  if (!current) {
    return (
      <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sunken text-muted-foreground">
        <ImageOff className="size-7" aria-hidden="true" />
        <p className="text-sm">Photographs of {title} are on the way.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-lg)] bg-surface-sunken">
        <Image
          src={current.src}
          alt={current.alt}
          fill
          preload={preload}
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover"
        />
        {current.credit && (
          <span className="glass absolute bottom-3 right-3 rounded-full px-3 py-1 text-xs text-foreground">
            {current.credit}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <ul className="flex flex-wrap gap-3" aria-label={`${title} photo gallery`}>
          {images.map((image, index) => (
            <li key={`${image.src}-${index}`}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show photo ${index + 1}: ${image.alt}`}
                aria-current={index === active}
                className={cn(
                  "relative size-20 overflow-hidden rounded-[var(--radius-sm)] border-2 transition-opacity duration-200",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  index === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <Image src={image.src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
