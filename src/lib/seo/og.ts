/**
 * Open Graph images: one place that decides what a crawler is pointed at.
 *
 * A share preview is fetched by WhatsApp, Telegram, Slack, X, Facebook and
 * LinkedIn, often once per share, always over Fast Data Transfer, and several
 * of them silently drop an image above a few hundred KB. So the rule is that
 * `openGraph.images` never names a raw source file: the photo library holds
 * originals of up to several MB (collages stored as lossless PNG, 2560 px
 * JPEGs), and those were exactly what the detail pages used to advertise.
 *
 * Two shapes come out of here:
 *
 * - **`DEFAULT_OG_IMAGE`**, the site card: a static 1200x630 JPEG of about
 *   75 KB, the same bytes as `src/app/opengraph-image.jpg`. It lives in
 *   `public/og/` as well because a page-level `openGraph` object replaces the
 *   inherited one wholesale, dropping the root file-based card, so any page
 *   that sets `openGraph` must name an image itself. The path is a contract
 *   other modules reference; keep the file where it is.
 * - **An optimizer URL** for a self-hosted JPEG or WebP photo:
 *   `/_next/image?url=...&w=1200&q=75`. That is a cached transformation, a
 *   few hundred KB at most, and the optimizer negotiates the format: WebP for
 *   a crawler that accepts it, the source format (JPEG) for one that does not.
 *   1200 must stay in `images.deviceSizes` (next.config.ts) or the optimizer
 *   answers 400. No width or height is declared because the output keeps the
 *   source's aspect ratio, which is not 1200x630; a wrong declaration is worse
 *   than none (some platforms then crop or reject the card).
 *
 * Everything else falls back to the site card:
 *
 * - PNG sources: a crawler that does not accept WebP gets a PNG back, and a
 *   1200 px PNG of a photographic collage can still exceed 1 MB.
 * - Google Places photos (`/api/place-photo`): the route answers with a
 *   redirect to a signed Google URL that expires, so a scraper's cached card
 *   goes dead, and the Places terms forbid the optimizer caching the bytes
 *   (`skipsOptimizer` in `src/lib/data/photos.ts`).
 * - Community uploads (`/api/community/photos/...`): served through an access
 *   check, and not in `images.localPatterns`, so the optimizer refuses them.
 * - Anything remote, or no image at all.
 *
 * Relative URLs are fine: the root layout's `metadataBase` makes them absolute.
 */
import type { MediaImage } from "@/types";

/** One `openGraph.images` entry, structurally Next's `OGImageDescriptor`. */
export type OgImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

/** Same wording as `src/app/opengraph-image.alt.txt`; keep the two in step. */
export const DEFAULT_OG_ALT =
  "Discover Manipur: floating islands, cloud-caught hills and a thousand-year weave";

/** The static site card. Its dimensions are real, so they are declared. */
export const DEFAULT_OG_IMAGE = {
  url: "/og/discover-manipur.jpg",
  width: 1200,
  height: 630,
  alt: DEFAULT_OG_ALT,
} as const satisfies OgImage;

/** Self-hosted photos the optimizer may serve: JPEG or WebP under file-uploads. */
const OPTIMIZABLE_PHOTO = /^\/file-uploads\/[^?#]+\.(jpe?g|webp)$/i;

/**
 * The `openGraph.images` value for a page whose subject has a photo.
 *
 * `image` is usually `entity.images[0]`; `alt` overrides its alt text (pass
 * the entity's name when the photo's own alt is generic). Always returns a
 * non-empty array, so a page that calls this never loses its card.
 */
export function ogImagesFor(image?: Pick<MediaImage, "src" | "alt">, alt?: string): OgImage[] {
  if (image && OPTIMIZABLE_PHOTO.test(image.src)) {
    return [
      {
        url: `/_next/image?url=${encodeURIComponent(image.src)}&w=1200&q=75`,
        alt: alt ?? image.alt,
      },
    ];
  }
  return [DEFAULT_OG_IMAGE];
}
