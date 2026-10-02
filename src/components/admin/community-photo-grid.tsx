"use client";

import { ExternalLink, ImageOff, Maximize2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import {
  CommunityStatusPill,
  formatBytes,
  formatDate,
  formatDateTime,
} from "@/components/admin/community-parts";
import { IntentLink } from "@/components/shared/intent-link";
import { CommunityRemovePhotoButton } from "@/components/admin/community-remove-photo-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LICENCE_LABELS, type PhotoLicence } from "@/lib/community/taxonomy";
import type { AdminPhoto } from "@/lib/community/types";
import { cn } from "@/lib/utils";

function licenceLabel(licence: PhotoLicence) {
  return licence === "own-work" ? "Own work of the uploader" : LICENCE_LABELS[licence];
}

/**
 * Photos with everything an admin needs to judge them: licence, author,
 * source, uploader, size. A live photo opens full size in a dialog; a removed
 * one has no image left, so it shows a placeholder with the removal date.
 *
 * `showPlace` adds the place each photo belongs to (the all-photos page);
 * `size="large"` gives fewer, bigger tiles (one place's review page).
 */
export function CommunityPhotoGrid({
  photos,
  showPlace = false,
  size = "compact",
}: {
  photos: AdminPhoto[];
  showPlace?: boolean;
  size?: "compact" | "large";
}) {
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = photos.find((p) => p.id === viewingId && !p.removedAt) ?? null;

  return (
    <>
      <ul
        className={cn(
          "grid gap-4",
          size === "large" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        )}
      >
        {photos.map((photo, i) => {
          const name = photo.placeName ?? "an unattached upload";
          const label = `photo ${i + 1}, ${name}`;
          return (
            <li
              key={photo.id}
              className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface"
            >
              {photo.removedAt ? (
                <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 bg-muted p-4 text-center text-sm text-muted-foreground">
                  <ImageOff className="size-5" aria-hidden="true" />
                  <span>Removed {formatDate(photo.removedAt)}</span>
                  <span className="text-xs">The image file was deleted. Only this record is left.</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setViewingId(photo.id)}
                  className="group relative block aspect-[4/3] overflow-hidden bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                  aria-label={`View ${label} at full size`}
                >
                  <Image
                    src={size === "large" ? photo.src : photo.thumbSrc}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    unoptimized
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute right-2 top-2 rounded-full bg-ink-900/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    <Maximize2 className="size-3.5" />
                  </span>
                </button>
              )}

              <div className="flex flex-1 flex-col gap-3 p-4 text-sm">
                {showPlace && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {photo.placeId ? (
                      <IntentLink
                        href={`/admin/places/${photo.placeId}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {photo.placeName}
                      </IntentLink>
                    ) : (
                      <span className="font-medium text-muted-foreground">Not attached to a place</span>
                    )}
                    {photo.placeStatus && <CommunityStatusPill status={photo.placeStatus} />}
                  </div>
                )}

                <dl className="grid gap-x-3 gap-y-1.5 text-xs [grid-template-columns:auto_1fr]">
                  <dt className="text-muted-foreground">Licence</dt>
                  <dd className="text-foreground">{licenceLabel(photo.licence)}</dd>
                  <dt className="text-muted-foreground">Author</dt>
                  <dd className="break-words text-foreground">{photo.author}</dd>
                  <dt className="text-muted-foreground">Source</dt>
                  <dd className="min-w-0">
                    {photo.sourceUrl ? (
                      <a
                        href={photo.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex max-w-full items-center gap-1 text-primary underline-offset-4 hover:underline"
                      >
                        <span className="truncate">{photo.sourceUrl.replace(/^https:\/\//, "")}</span>
                        <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground">None given</span>
                    )}
                  </dd>
                  <dt className="text-muted-foreground">Uploaded by</dt>
                  <dd className="min-w-0 text-foreground">
                    {photo.uploader ? (
                      <>
                        <IntentLink
                          href={`/admin/photos?uploader=${photo.uploader.id}`}
                          className="hover:underline"
                        >
                          {photo.uploader.name}
                        </IntentLink>
                        <span className="block break-all text-muted-foreground">{photo.uploader.email}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Account deleted</span>
                    )}
                  </dd>
                  <dt className="text-muted-foreground">Uploaded</dt>
                  <dd className="tabular-nums text-foreground">{formatDateTime(photo.createdAt)}</dd>
                  <dt className="text-muted-foreground">Size</dt>
                  <dd className="tabular-nums text-foreground">
                    {photo.width} × {photo.height} px · {formatBytes(photo.bytes)}
                  </dd>
                  <dt className="text-muted-foreground">Alt text</dt>
                  <dd className={photo.altProvided ? "break-words text-foreground" : "text-muted-foreground"}>
                    {photo.altProvided ? photo.alt : "None written (the place name is used)"}
                  </dd>
                </dl>

                {!photo.removedAt && (
                  <div className="mt-auto pt-1">
                    <CommunityRemovePhotoButton photoId={photo.id} label={label} />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={viewing !== null} onOpenChange={(v) => !v && setViewingId(null)}>
        <DialogContent className="max-w-5xl">
          {viewing && (
            <>
              <DialogHeader className="pr-10">
                <DialogTitle>{viewing.placeName ?? "Unattached upload"}</DialogTitle>
                <DialogDescription>
                  {viewing.credit} · {viewing.width} × {viewing.height} px
                </DialogDescription>
              </DialogHeader>
              <Image
                src={viewing.src}
                alt={viewing.alt}
                width={viewing.width}
                height={viewing.height}
                unoptimized
                className="mx-auto h-auto max-h-[70vh] w-auto max-w-full rounded-[var(--radius)] object-contain"
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
