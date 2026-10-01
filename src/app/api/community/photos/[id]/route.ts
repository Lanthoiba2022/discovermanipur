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
 * probed for existence. Only published photos are cached: by the CDN for up
 * to an hour, tagged so that taking a photo or its place down purges it at
 * once (`src/lib/community/admin-actions.ts`), and by browsers for five
 * minutes, which nothing can purge.
 */

import { addCacheTag } from "@vercel/functions";
import { eq } from "drizzle-orm";

import { photoCacheTag, placeCacheTag } from "@/lib/community/photo-links";
import { canView } from "@/lib/community/queries";
import { getPhotoStore } from "@/lib/community/storage";
import { getCommunityViewer } from "@/lib/community/viewer";
import { getDb, schema } from "@/lib/db";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** A gallery page shows a few dozen photos, each fetched once and then cached. */
const RATE = { limit: 600, windowMs: 60_000 };

const PUBLIC_CACHE = "public, max-age=300, s-maxage=3600";
const PRIVATE_CACHE = "private, no-store";

const notFound = () =>
  new Response("Not found", { status: 404, headers: { "Cache-Control": PRIVATE_CACHE } });

const { community_place_photos: photos, community_places: places } = schema;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const verdict = rateLimit("community-photo", clientIp(request.headers), RATE);
  if (!verdict.ok) return tooManyRequests(verdict);

  const { id } = await params;
  if (!ID.test(id)) return notFound();
  const size = new URL(request.url).searchParams.get("size") === "thumb" ? "thumb" : "full";

  const db = getDb();
  const store = getPhotoStore();
  if (!db || !store) return notFound();

  const [row] = await db
    .select({ photo: photos, place: places })
    .from(photos)
    .leftJoin(places, eq(places.id, photos.place_id))
    .where(eq(photos.id, id))
    .limit(1);
  if (!row || row.photo.removed_at || row.photo.discarded_at) return notFound();

  // Published photos never read the session, so they stay cacheable.
  const isPublic = row.place?.status === "published";
  if (!isPublic) {
    const viewer = await getCommunityViewer();
    const allowed = row.place
      ? canView(row.place, viewer)
      : viewer !== null && (viewer.role === "admin" || row.photo.uploaded_by === viewer.userId);
    if (!allowed) return notFound();
  }

  const object = await store.get(size === "thumb" ? row.photo.thumb_key : row.photo.storage_key);
  if (!object) return notFound();
  if (isPublic && row.place) await addCacheTag([photoCacheTag(row.photo.id), placeCacheTag(row.place.id)]);

  return new Response(object.body, {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(object.size),
      "Cache-Control": isPublic ? PUBLIC_CACHE : PRIVATE_CACHE,
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}
