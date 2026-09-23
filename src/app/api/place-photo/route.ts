/**
 * GET /api/place-photo?ref=places/<place_id>/photos/<photo_id>
 *
 * Resolves a Google Places photo reference to an image, server-side.
 *
 * Why this route exists rather than storing the files:
 *
 *   Google Maps Platform terms let you cache a place `id` and a photo reference
 *   indefinitely, but NOT the image bytes. So `photo_refs` holds references and
 *   the image is fetched per request. See data/research/PHOTOS.md.
 *
 *   It also keeps GOOGLE_API_KEY on the server. The key is never sent to the
 *   browser, and the browser only ever sees this route's URL.
 *
 * The caller MUST render the attribution that ships alongside each ref in
 * `photo_refs[].attribution`. That is a licence condition, not a courtesy —
 * see `PlacePhoto` in src/components for the component that does it.
 *
 * Without a key the route 404s, which makes `<Image>` fall back to whatever the
 * card renders for a missing photo. Nothing throws at import time and the site
 * behaves normally on a machine with no Google credentials.
 */

export const runtime = "nodejs";
// The upstream URL is signed and short-lived; let the CDN hold our redirect for
// a day rather than paying for a Places call on every card render.
export const revalidate = 86400;

/** `places/<id>/photos/<id>` — anything else is a caller bug or a probe. */
const REF = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

const MAX_WIDTH = 1600;
const DEFAULT_WIDTH = 1200;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ref = url.searchParams.get("ref");
  const width = Math.min(
    Number(url.searchParams.get("w")) || DEFAULT_WIDTH,
    MAX_WIDTH,
  );

  if (!ref || !REF.test(ref)) {
    return new Response("Bad photo reference", { status: 400 });
  }

  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    // Not an error state — a dev machine without the key should still render.
    return new Response("Place photos unconfigured", { status: 404 });
  }

  const endpoint =
    `https://places.googleapis.com/v1/${ref}/media` +
    `?maxWidthPx=${width}&skipHttpRedirect=true&key=${key}`;

  try {
    const res = await fetch(endpoint, { next: { revalidate } });
    if (!res.ok) {
      return new Response("Upstream photo unavailable", { status: 502 });
    }

    // `skipHttpRedirect` returns JSON holding the real, expiring image URL
    // instead of a 302, so we can hand the browser a clean redirect and never
    // proxy the bytes through this server.
    const { photoUri } = (await res.json()) as { photoUri?: string };
    if (!photoUri) {
      return new Response("Upstream photo unavailable", { status: 502 });
    }

    return Response.redirect(photoUri, 307);
  } catch {
    return new Response("Upstream photo unavailable", { status: 502 });
  }
}
