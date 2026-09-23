/**
 * Picking a photo for a listing, and crediting it correctly.
 *
 * Two kinds of photo exist in the catalogue and they are not interchangeable:
 *
 *   `images`     files we host in /public/file-uploads. Ours to resize, cache and
 *                serve. Credits, where needed, live in `photo-credits.ts`.
 *
 *   `photoRefs`  Google Places photos. Licensed for display only — the bytes must
 *                not be stored, so they resolve through /api/place-photo on every
 *                request, and the photographer's attribution must be rendered
 *                wherever the photo is. See data/research/PHOTOS.md.
 *
 * Prefer our own files: no per-render API cost, no attribution overlay, and we
 * control the crop. Fall back to a Places ref, which is what most of the 2026
 * research rows have — CC libraries do not photograph cafés.
 */

import type { MediaImage, PhotoRef } from "@/types";

/** What a card or gallery needs in order to render one photo honestly. */
export interface ResolvedPhoto {
  src: string;
  alt: string;
  /** Present only for Places photos, where showing it is a licence condition. */
  attribution?: { name?: string; uri?: string }[];
  /** Ours, or Google's? Callers use this to decide whether to overlay a credit. */
  provider: "self-hosted" | "google-places";
  width?: number;
  height?: number;
}

/**
 * Does this `src` resolve through the Places proxy?
 *
 * Callers use it to set `unoptimized` on `next/image`. `/api/place-photo`
 * answers with a 307 to a short-lived signed Google URL rather than proxying
 * the bytes — the Places terms allow caching the reference, not the image —
 * and Next's optimizer will not follow that hop, so it returns 400 and the
 * frame renders empty. Sending these straight to the browser lets it follow
 * the redirect itself. Our own files keep going through the optimizer.
 */
export function isPlacePhoto(src: string | undefined): boolean {
  return Boolean(src?.startsWith("/api/place-photo"));
}

/** Route a Places reference through our own origin so the API key stays server-side. */
export function placePhotoUrl(ref: string, width = 1200): string {
  return `/api/place-photo?ref=${encodeURIComponent(ref)}&w=${width}`;
}

function fromRef(ref: PhotoRef, alt: string, width: number): ResolvedPhoto {
  return {
    src: placePhotoUrl(ref.ref, width),
    alt,
    attribution: ref.attribution,
    provider: "google-places",
    width: ref.width,
    height: ref.height,
  };
}

/**
 * Every photo for a listing, ours first.
 *
 * `alt` falls back to the listing name. Places photos carry no description, so
 * a generic "<name>, Manipur" is the honest ceiling — do not invent detail about
 * what a photo shows when nobody has looked at it.
 */
export function resolvePhotos(
  item: { images?: MediaImage[]; photoRefs?: PhotoRef[] },
  name: string,
  width = 1200,
): ResolvedPhoto[] {
  const own: ResolvedPhoto[] = (item.images ?? []).map((i) => ({
    src: i.src,
    alt: i.alt || name,
    provider: "self-hosted" as const,
  }));
  const refs: ResolvedPhoto[] = (item.photoRefs ?? []).map((r) =>
    fromRef(r, `${name}, Manipur`, width),
  );
  return [...own, ...refs];
}

/** The single photo a card should lead with, or `null` to use the placeholder. */
export function leadPhoto(
  item: { images?: MediaImage[]; photoRefs?: PhotoRef[] },
  name: string,
  width = 800,
): ResolvedPhoto | null {
  return resolvePhotos(item, name, width)[0] ?? null;
}

/**
 * One-line credit for a Places photo.
 *
 * Google supplies the contributor's display name; we add the source so a reader
 * can tell where the photo came from without clicking. Returns null for our own
 * files, which are credited through `photo-credits.ts` instead.
 *
 * Accepts either a raw `PhotoRef` (when synthesising images in the catalogue
 * loader) or an already-resolved photo (when rendering).
 */
export function creditLine(photo: ResolvedPhoto | PhotoRef): string | null {
  const attribution =
    "provider" in photo && photo.provider !== "google-places"
      ? null
      : photo.attribution;
  if (!attribution) return null;
  const who = attribution
    .map((a) => a.name)
    .filter(Boolean)
    .join(", ");
  return who ? `Photo: ${who} / Google Maps` : "Photo: Google Maps";
}

/**
 * Is this photo safe to hand to a social-media scraper?
 *
 * `/api/place-photo` answers with a 307 to a signed googleusercontent URL that
 * expires. A scraper follows it once, caches the result, and the card image is
 * dead soon after — worse than no image, because the stale record sticks around
 * in Slack/X/Facebook caches.
 *
 * Self-hosted files are stable, so only those belong in `openGraph.images`.
 * Returning undefined lets Next fall back to the route's own
 * `opengraph-image.tsx`, which is generated and always valid.
 */
export function ogImage(image?: MediaImage): MediaImage | undefined {
  if (!image) return undefined;
  return image.src.startsWith("/api/place-photo") ? undefined : image;
}
