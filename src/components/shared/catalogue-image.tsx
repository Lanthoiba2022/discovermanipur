import Image, { type ImageProps } from "next/image";

import { skipsOptimizer } from "@/lib/data/photos";

/**
 * `next/image` for anything that can hold a catalogue photo.
 *
 * A catalogue `images[].src` is one of three things, and only one of them may
 * go through `/_next/image`:
 *
 *   /file-uploads/...          Our own files: optimized, as before.
 *   /api/place-photo?...       Google Places. The route answers with an
 *                              empty-bodied 307 to a signed Google URL; Next's
 *                              optimizer rejects that with a 400 (the frame
 *                              renders empty), and one that followed it would
 *                              cache Google's bytes, which the Places terms
 *                              forbid. Sent straight to the browser instead.
 *   /api/community/photos/...  Already-resized WebP behind an access check the
 *                              optimizer cannot pass.
 *
 * Remembering that per call site is how the hotspot hero, the gallery grid and
 * the search thumbnails came to render empty frames, so the rule lives here
 * (`skipsOptimizer`, in photos.ts) and call sites stop deciding it.
 * `/api/place-photo` is not in `images.localPatterns`, so a call site that
 * still uses bare `next/image` for a Places src throws in `next dev`.
 *
 * Every prop is forwarded unchanged. An explicit `unoptimized` wins, so a
 * caller can still force either behaviour. A static import (`StaticImport`)
 * is always a bundled local file and keeps the optimizer.
 *
 * Attribution is NOT handled here: the credit overlay depends on each frame's
 * layout. Wherever this renders a Places photo, the caller must render its
 * `credit` too (a licence condition, not decoration).
 *
 * No hooks and no "use client", so Server and Client Components can both
 * render it.
 */
export function CatalogueImage(props: ImageProps) {
  const { src, unoptimized } = props;
  return (
    <Image
      {...props}
      // `alt` is required by ImageProps and arrives in the spread; restated
      // so the a11y lint rule can see it on the element.
      alt={props.alt}
      unoptimized={unoptimized ?? (typeof src === "string" && skipsOptimizer(src))}
    />
  );
}
