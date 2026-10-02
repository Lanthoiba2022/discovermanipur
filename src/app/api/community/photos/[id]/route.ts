/**
 * GET /api/community/photos/[id]?size=thumb: serve one community photo.
 *
 * Photos are stored privately, so this route is the only way to see one, and
 * it applies the same visibility rule as the place pages (`canView`):
 *
 * - a photo of a published place is public and cacheable;
 * - a photo of a place still collecting votes is for signed-in verified
 *   users, the submitter and admins;
 * - a held or rejected place's photos are for the submitter and admins;
 * - an upload not attached to a place yet is for its uploader and admins;
 * - a photo an admin removed is gone for everyone.
 *
 * Anything the viewer may not see answers 404, not 403, so ids cannot be
 * probed for existence. A 404 is never cacheable by the CDN: signed-in voters
 * and signed-out visitors share its cache key, so one person's "not for you"
 * must not become everyone's.
 *
 * What it costs, in order:
 *
 * 1. Only the two URLs `photoUrl()` builds are accepted, byte for byte: the
 *    id in lowercase (as Postgres prints a uuid, which is what `photoUrl()`
 *    is given), not percent-encoded, and then no query string or exactly
 *    `?size=thumb`. Anything else is a 404 before any I/O. The CDN keys on
 *    the raw URL while `params.id` arrives decoded, so without this
 *    `/photos/ABC...`, `/photos/%61bc...`, a bare trailing `?` and `?x=1`
 *    would each be a new CDN key costing a function call and a Blob read for
 *    the same photo.
 * 2. Published photos are looked up in the cached key map
 *    (`getPublishedPhotoKey`, one `sharedRead` entry for all of them), so a
 *    CDN miss on a public photo costs a Blob read and no database query.
 * 3. Anything else is not public. A signed-out visitor gets a 404 with no
 *    database query, which makes random-id probes free. A signed-in viewer
 *    gets the live check (one narrow query plus `canView`), which also covers
 *    a published photo the cached map does not have yet, and the case where
 *    the cached read itself failed.
 *
 * Published photos are cached by the CDN for a day
 * (`Vercel-CDN-Cache-Control`) and by browsers for five minutes. Both
 * responses carry tags for the photo and its place, so taking either down
 * purges the CDN copy at once (`src/lib/community/admin-actions.ts`). The
 * edge TTL stops at a day, not longer, because a purge that fails twice is
 * only logged; nothing can purge a browser's five-minute copy.
 */

import { addCacheTag } from "@vercel/functions";
import { eq } from "drizzle-orm";

import { photoCacheTag, photoUrl, placeCacheTag } from "@/lib/community/photo-links";
import { getPublishedPhotoKey } from "@/lib/community/public-reads";
import { canView } from "@/lib/community/queries";
import { getPhotoStore, type PhotoStore } from "@/lib/community/storage";
import { getCommunityViewer } from "@/lib/community/viewer";
import { getDb, schema, type Db } from "@/lib/db";
import { logDbWarn } from "@/lib/log";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lowercase only: see step 1 of the header. */
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** A gallery page shows a few dozen photos, each fetched once and then cached. */
const RATE = { limit: 600, windowMs: 60_000 };

/** Browsers: five minutes, which nothing can purge, so keep it short. */
const PUBLIC_CACHE = "public, max-age=300";
/** The Vercel CDN only: a day, purged by tag on takedown. */
const PUBLIC_CDN_CACHE = "public, max-age=86400";
const PRIVATE_CACHE = "private, no-store";

const notFound = () =>
  new Response("Not found", { status: 404, headers: { "Cache-Control": PRIVATE_CACHE } });

const { community_place_photos: photos, community_places: places } = schema;

type Size = "full" | "thumb";

/** The photo bytes, with the CDN tags and cache headers for a public photo. */
async function serve(
  store: PhotoStore,
  key: string,
  publicTags: { photoId: string; placeId: string } | null,
): Promise<Response> {
  const object = await store.get(key);
  if (!object) return notFound();
  if (publicTags) await addCacheTag([photoCacheTag(publicTags.photoId), placeCacheTag(publicTags.placeId)]);

  const headers: Record<string, string> = {
    "Content-Type": "image/webp",
    "Content-Length": String(object.size),
    "Cache-Control": publicTags ? PUBLIC_CACHE : PRIVATE_CACHE,
    "Content-Disposition": "inline",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
  if (publicTags) headers["Vercel-CDN-Cache-Control"] = PUBLIC_CDN_CACHE;
  return new Response(object.body, { headers });
}

/**
 * The live path, for signed-in viewers only: one narrow query, then the same
 * `canView` rule as the place pages. Signed-out visitors never reach the
 * database here; the only photos they may see are in the cached map.
 */
async function serveLive(db: Db, store: PhotoStore, id: string, size: Size): Promise<Response> {
  const viewer = await getCommunityViewer();
  if (!viewer) return notFound();

  const [row] = await db
    .select({
      photo: {
        id: photos.id,
        storage_key: photos.storage_key,
        thumb_key: photos.thumb_key,
        uploaded_by: photos.uploaded_by,
        removed_at: photos.removed_at,
        discarded_at: photos.discarded_at,
      },
      place: {
        id: places.id,
        status: places.status,
        voting_ends_at: places.voting_ends_at,
        submitted_by: places.submitted_by,
      },
    })
    .from(photos)
    .leftJoin(places, eq(places.id, photos.place_id))
    .where(eq(photos.id, id))
    .limit(1);
  if (!row || row.photo.removed_at || row.photo.discarded_at) return notFound();

  const allowed = row.place
    ? canView(row.place, viewer)
    : viewer.role === "admin" || row.photo.uploaded_by === viewer.userId;
  if (!allowed) return notFound();

  // A published photo is the same for everyone, so it may be cached publicly
  // even though this request read the session to get here.
  const isPublic = row.place?.status === "published";
  return serve(
    store,
    size === "thumb" ? row.photo.thumb_key : row.photo.storage_key,
    isPublic && row.place ? { photoId: row.photo.id, placeId: row.place.id } : null,
  );
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const verdict = rateLimit("community-photo", clientIp(request.headers), RATE);
  if (!verdict.ok) return tooManyRequests(verdict);

  const { id } = await params;
  if (!ID.test(id)) return notFound();
  // `params.id` is decoded, the CDN key is not: compare the raw path and
  // query (`href` keeps a bare trailing `?`, which `search` reports as "")
  // with the two URLs `photoUrl()` builds for this id.
  const url = new URL(request.url);
  const asked = url.href.slice(url.origin.length);
  const size: Size | null = asked === photoUrl(id) ? "full" : asked === photoUrl(id, "thumb") ? "thumb" : null;
  if (!size) return notFound();

  const db = getDb();
  const store = getPhotoStore();
  if (!db || !store) return notFound();

  let published: Awaited<ReturnType<typeof getPublishedPhotoKey>>;
  try {
    published = await getPublishedPhotoKey(id);
  } catch (err) {
    logDbWarn("community.photo-keys", err, { fallback: "live" });
    return serveLive(db, store, id, size);
  }

  if (published) {
    return serve(store, size === "thumb" ? published.thumbKey : published.storageKey, {
      photoId: id,
      placeId: published.placeId,
    });
  }
  return serveLive(db, store, id, size);
}
