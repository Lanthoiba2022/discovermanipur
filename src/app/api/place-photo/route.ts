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
 *   It also keeps the Places key on the server: the browser only ever sees
 *   this route's URL. Set `GOOGLE_PLACES_API_KEY` to a server-only key
 *   restricted to the Places API (New). `GOOGLE_API_KEY` is accepted as a
 *   fallback, but that is the Maps key the Kangla map sends to the browser,
 *   so sharing it lets anyone who copies it out of the page bill Places calls.
 *
 * Abuse limits: a per-IP rate limit, a strict `ref` shape, and widths snapped
 * to a few sizes, so a caller cannot bypass the upstream cache (and run up
 * the Places bill) by varying `w`. The upstream host is fixed; only the
 * validated path segments come from the request.
 *
 * The caller MUST render the attribution that ships alongside each ref in
 * `photo_refs[].attribution`. That is a licence condition, not a courtesy;
 * see `PlacePhoto` in src/components for the component that does it.
 *
 * Without a key the route 404s, which makes `<Image>` fall back to whatever the
 * card renders for a missing photo. Nothing throws at import time and the site
 * behaves normally on a machine with no Google credentials.
 */

import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";

export const runtime = "nodejs";

/*
 * Caching, in two layers. Google bills per Places call, so the aim is one call
 * per photo per PHOTO_URI_TTL, however many people view it.
 *
 *   1. Server: the Places response (the signed `photoUri`, never the image) is
 *      held in Next's data cache via `fetch(..., { next: { revalidate } })`.
 *      That cache is keyed by the upstream URL, so it is shared across every
 *      visitor. A segment-level `export const revalidate` would do nothing
 *      here: reading `request.url` makes this handler dynamic.
 *
 *   2. Browser and CDN: the redirect carries its own Cache-Control, so repeat
 *      views within REDIRECT_MAX_AGE never reach this function at all.
 *
 * Google does not document how long a `photoUri` stays valid; the image it
 * points at is served with `max-age=86400`. PHOTO_URI_TTL sits under that with
 * margin, and REDIRECT_MAX_AGE is short enough that a CDN copy plus the server
 * copy together stay inside it. `scripts/probe-place-photo-ttl.mjs` measures the
 * real lifetime. Raise PHOTO_URI_TTL only once it shows URLs outliving it.
 *
 * Note `prebuild` clears the data cache, so every deploy re-resolves each
 * photo on first view.
 */
const PHOTO_URI_TTL = 12 * 60 * 60;
const REDIRECT_MAX_AGE = 60 * 60;

/** `places/<id>/photos/<id>`; anything else is a caller bug or a probe. */
const REF = /^places\/[A-Za-z0-9_-]{1,256}\/photos\/[A-Za-z0-9_-]{1,1024}$/;

/** Requested widths round up to one of these; see the abuse note above. */
const WIDTHS = [480, 800, 1200, 1600] as const;
const DEFAULT_WIDTH = 1200;

/** A gallery page shows a few dozen photos and the browser caches each hour. */
const RATE = { limit: 300, windowMs: 60_000 };

function snapWidth(raw: string | null) {
  const asked = Number(raw) || DEFAULT_WIDTH;
  return WIDTHS.find((w) => w >= asked) ?? WIDTHS[WIDTHS.length - 1];
}

/** Google serves Places photos from its own CDN; refuse a redirect anywhere else. */
function isGooglePhotoUri(value: string) {
  try {
    const target = new URL(value);
    return (
      target.protocol === "https:" &&
      (target.hostname.endsWith(".googleusercontent.com") || target.hostname.endsWith(".ggpht.com"))
    );
  } catch {
    return false;
  }
}

const plain = (body: string, status: number) =>
  new Response(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  const verdict = rateLimit("place-photo", clientIp(request.headers), RATE);
  if (!verdict.ok) return tooManyRequests(verdict);

  const url = new URL(request.url);
  const ref = url.searchParams.get("ref");
  const width = snapWidth(url.searchParams.get("w"));

  if (!ref || !REF.test(ref)) return plain("Bad photo reference", 400);

  const key = (process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY)?.trim();
  if (!key) {
    // Not an error state: a dev machine without the key should still render.
    return plain("Place photos unconfigured", 404);
  }

  // The key travels in a header, not the query string, so it never appears in
  // a logged or cached URL.
  const endpoint =
    `https://places.googleapis.com/v1/${ref}/media` +
    `?maxWidthPx=${width}&skipHttpRedirect=true`;

  try {
    const res = await fetch(endpoint, {
      headers: { "X-Goog-Api-Key": key },
      next: { revalidate: PHOTO_URI_TTL },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return plain("Upstream photo unavailable", 502);

    // `skipHttpRedirect` returns JSON holding the real, expiring image URL
    // instead of a 302, so we can hand the browser a clean redirect and never
    // proxy the bytes through this server.
    const { photoUri } = (await res.json()) as { photoUri?: string };
    if (!photoUri || !isGooglePhotoUri(photoUri)) return plain("Upstream photo unavailable", 502);

    // Built by hand: `Response.redirect` returns immutable headers, so it
    // cannot carry the Cache-Control that lets browsers and CDNs keep it.
    return new Response(null, {
      status: 307,
      headers: {
        Location: photoUri,
        "Cache-Control": `public, max-age=${REDIRECT_MAX_AGE}, s-maxage=${REDIRECT_MAX_AGE}`,
      },
    });
  } catch {
    return plain("Upstream photo unavailable", 502);
  }
}
