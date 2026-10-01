/**
 * Photo URLs and credit lines. Safe in the browser. Every community photo is
 * served by `/api/community/photos/[id]`, which checks the viewer may see it.
 */

import { LICENCE_LABELS, type PhotoLicence } from "./taxonomy";

export function photoUrl(photoId: string, size: "full" | "thumb" = "full") {
  return size === "thumb" ? `/api/community/photos/${photoId}?size=thumb` : `/api/community/photos/${photoId}`;
}

/** "Photo: Thoibi Devi" for the uploader's own work, "Photo: Thoibi Devi, CC BY 4.0" otherwise. */
export function photoCredit(author: string, licence: PhotoLicence) {
  return licence === "own-work" ? `Photo: ${author}` : `Photo: ${author}, ${LICENCE_LABELS[licence]}`;
}

/*
 * CDN cache tags on a published photo response: one for the photo and one for
 * its place, so an admin taking either down can purge it at once.
 */
export const photoCacheTag = (photoId: string) => `community-photo-${photoId}`;
export const placeCacheTag = (placeId: string) => `community-place-${placeId}`;
