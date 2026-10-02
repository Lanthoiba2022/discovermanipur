/**
 * GET /api/place-photo?ref=places/<place_id>/photos/<photo_id>&w=<width>[&s=<signature>]
 *
 * Resolves a Google Places photo reference to an image, server-side.
 *
 * Why this route exists rather than storing the files:
 *
 *   Google Maps Platform terms let you cache a place `id` and a photo reference
 *   indefinitely, but NOT the image bytes. So `photo_refs` holds references and
 *   the image is fetched per request.
 *
 *   It also keeps the Places key on the server: the browser only ever sees
 *   this route's URL. Set `GOOGLE_PLACES_API_KEY` to a server-only key
 *   restricted to the Places API (New). `GOOGLE_API_KEY` is still accepted as
 *   a fallback, but that is the Maps key the Kangla map sends to the browser,
 *   so sharing it lets anyone who copies it out of the page bill Places calls.
 *   A production instance using the fallback says so once in its logs.
 *
 * Request handling, in this order, cheapest first. Nothing before step 6 calls
 * Google, and every answer short of an upstream failure is one the CDN keeps,
 * so repeats stop there:
 *
 *   1. Per-IP rate limit.
 *   2. Parse the query.
 *   3. Canonicalise. The query string must be, byte for byte, the one
 *      `canonicalLocation` builds: `ref`, `w` and optionally `s`, in that
 *      order, each once, `w` exactly one of WIDTHS, and `ref` and `s`
 *      percent-encoded exactly as `encodeURIComponent` does it. Anything else
 *      (a missing or odd width, an extra parameter, a different order, or
 *      the same values spelt differently: `?r%65f=`, `%2f` for `%2F`, `+` for
 *      `%20`) gets a 308 to the canonical URL. The CDN keys on the raw query
 *      string, so each spelling is a separate entry, and without this a
 *      caller could miss the cache at will. The site itself only emits
 *      canonical URLs (`placePhotoUrl` in src/lib/data/photos.ts, plus a
 *      base64url `s`), so real traffic never takes the extra hop.
 *      The redirect cannot loop: the canonical string is built from the
 *      decoded values, and decoding `encodeURIComponent` output gives back
 *      the same values, so the redirect target is canonical itself.
 *   4. Validate the `ref` shape.
 *   5. Verify the signature (src/lib/data/place-photo-signature.ts). Off until
 *      PLACE_PHOTO_URL_SECRET is set; once it is, a ref this site did not
 *      render 404s, so the route stops being an open Places proxy.
 *   6. Resolve the API key, then call Places.
 *
 * Failures are cached rather than marked `no-store`, so a burst of bad
 * requests is answered by the CDN instead of by this function: a missing or
 * malformed ref for a day, a bad signature for a day, an unconfigured key for
 * five minutes. All three answer 404, not 400, because Vercel's CDN only
 * caches 200, 404, 410, 301, 302, 307 and 308: a 400 would reach this
 * function every time, whatever its `s-maxage`. An upstream failure is a 502,
 * which the CDN never caches either (its one-minute `s-maxage` only matters
 * to a cache that does), and Next's data cache stores only 200 responses
 * (node_modules/next/dist/server/lib/patch-fetch.js), so while Places is
 * failing every view of an uncached photo is a function call and a Places
 * call. The per-IP rate limit is the only brake on that.
 *
 * The caller MUST render the attribution that ships alongside each ref in
 * `photo_refs[].attribution`. That is a licence condition, not a courtesy;
 * see `PlacePhoto` in src/components for the component that does it.
 *
 * Without a key the route 404s, which makes `<Image>` fall back to whatever the
 * card renders for a missing photo. Nothing throws at import time and the site
 * behaves normally on a machine with no Google credentials.
 */

import { verifyPlaceRef } from "@/lib/data/place-photo-signature";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";

export const runtime = "nodejs";

/*
 * Caching of the success path, in two layers. Google bills per Places call, so
 * the aim is one call per photo per PHOTO_URI_TTL, however many people view it.
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
 * real lifetime. Raise PHOTO_URI_TTL only once it shows URLs outliving it;
 * both values are a licensing decision as much as a cost one.
 *
 * Note `prebuild` clears the data cache, so every deploy re-resolves each
 * photo on first view.
 */
const PHOTO_URI_TTL = 12 * 60 * 60;
const REDIRECT_MAX_AGE = 60 * 60;

/** Cache-Control for each non-success answer; see the header for the reasoning. */
const CACHE = {
  /** The canonical URL for a given query never changes. */
  canonical: "public, max-age=86400, s-maxage=31536000",
  /** Sent with a 404, which the CDN keeps (it never keeps a 400). */
  badRef: "public, max-age=3600, s-maxage=86400",
  /**
   * CDN only, never the browser: Vercel's CDN copy goes with the next deploy,
   * which is also when a new secret or a newly signed URL arrives.
   */
  badSignature: "public, s-maxage=86400",
  /** Short: a key missing from one environment should not pin blank photos for long. */
  unconfigured: "public, s-maxage=300",
  /** Sent with a 502, which Vercel's CDN never caches; see the header. */
  upstream: "public, s-maxage=60",
} as const;

/** `places/<id>/photos/<id>`; anything else is a caller bug or a probe. */
const REF = /^places\/[A-Za-z0-9_-]{1,256}\/photos\/[A-Za-z0-9_-]{1,1024}$/;

/** Requested widths round up to one of these; see the canonical step above. */
const WIDTHS = [480, 800, 1200, 1600] as const;
const DEFAULT_WIDTH = 1200;

/** A gallery page shows a few dozen photos and the browser caches each hour. */
const RATE = { limit: 300, windowMs: 60_000 };

function snapWidth(raw: string | null) {
  const asked = Number(raw) || DEFAULT_WIDTH;
  return WIDTHS.find((w) => w >= asked) ?? WIDTHS[WIDTHS.length - 1];
}

function canonicalLocation(ref: string, width: number, signature: string | null) {
  const base = `/api/place-photo?ref=${encodeURIComponent(ref)}&w=${width}`;
  return signature === null ? base : `${base}&s=${encodeURIComponent(signature)}`;
}

/**
 * Is the raw query string exactly the one `canonicalLocation` builds from its
 * decoded values? Compared byte for byte, because the CDN keys on the raw
 * bytes: `?ref=places%2fx` and `?ref=places%2Fx` decode alike but are two
 * cache entries. The one comparison covers every other rule too: a missing,
 * odd or zero-padded width, an extra or repeated parameter and a different
 * order all produce a string that differs from the canonical one.
 */
function isCanonical(url: URL, location: string) {
  return url.search === location.slice(location.indexOf("?"));
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

const plain = (body: string, status: number, cacheControl: string) =>
  new Response(body, { status, headers: { "Cache-Control": cacheControl } });

/** Set once per instance, so the fallback warning does not repeat per photo. */
let warnedSharedKey = false;

/**
 * The Places key: the dedicated server key, else the browser Maps key. The
 * fallback stays until a server key is set in every environment; removing it
 * before then would blank every Places photo on the site.
 */
function placesKey(): string | undefined {
  const dedicated = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (dedicated) return dedicated;
  const shared = process.env.GOOGLE_API_KEY?.trim();
  if (shared && process.env.NODE_ENV === "production" && !warnedSharedKey) {
    warnedSharedKey = true;
    console.warn(
      JSON.stringify({
        level: "warn",
        scope: "place-photo",
        message:
          "GOOGLE_PLACES_API_KEY is not set, so Places calls are billed to GOOGLE_API_KEY, " +
          "the Maps key the browser can see. Set a server-only Places key.",
      }),
    );
  }
  return shared || undefined;
}

export async function GET(request: Request) {
  // 1. Rate limit.
  const verdict = rateLimit("place-photo", clientIp(request.headers), RATE);
  if (!verdict.ok) return tooManyRequests(verdict);

  // 2. Parse.
  const url = new URL(request.url);
  const params = url.searchParams;
  const ref = params.get("ref");
  const signature = params.get("s");
  if (!ref) return plain("Bad photo reference", 404, CACHE.badRef);

  // 3. Canonicalise, without calling Google.
  const location = canonicalLocation(ref, snapWidth(params.get("w")), signature);
  if (!isCanonical(url, location)) {
    return new Response(null, {
      status: 308,
      headers: { Location: location, "Cache-Control": CACHE.canonical },
    });
  }
  const width = Number(params.get("w"));

  // 4. Validate the ref shape. A 404, not a 400, so the CDN keeps it.
  if (!REF.test(ref)) return plain("Bad photo reference", 404, CACHE.badRef);

  // 5. Verify the signature (always passes while signing is off).
  if (!verifyPlaceRef(ref, signature)) return plain("Not found", 404, CACHE.badSignature);

  // 6. Key, then upstream.
  const key = placesKey();
  if (!key) {
    // Not an error state: a dev machine without the key should still render.
    return plain("Place photos unconfigured", 404, CACHE.unconfigured);
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
    if (!res.ok) return plain("Upstream photo unavailable", 502, CACHE.upstream);

    // `skipHttpRedirect` returns JSON holding the real, expiring image URL
    // instead of a 302, so we can hand the browser a clean redirect and never
    // proxy the bytes through this server.
    const { photoUri } = (await res.json()) as { photoUri?: string };
    if (!photoUri || !isGooglePhotoUri(photoUri)) {
      return plain("Upstream photo unavailable", 502, CACHE.upstream);
    }

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
    return plain("Upstream photo unavailable", 502, CACHE.upstream);
  }
}
