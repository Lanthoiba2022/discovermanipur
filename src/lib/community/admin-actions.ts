"use server";

/**
 * Admin review of community places and photos. Every export is a public POST
 * endpoint, so each one re-reads the caller's role from `public.profiles`
 * before doing anything, and records who decided and when. Nothing here
 * deletes a place: rejecting or holding one only hides it.
 */

import { dangerouslyDeleteByTag } from "@vercel/functions";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { after } from "next/server";

import { getSessionProfile } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";
import { logDbError, logDbWarn } from "@/lib/log";

import { isUniqueViolation } from "./mutations";
import { photoCacheTag, placeCacheTag } from "./photo-links";
import { COMMUNITY_TAG } from "./public-reads";
import { adminDecisionSchema, photoIdSchema, REJECT_NOTE_MIN } from "./schema";
import { getPhotoStore } from "./storage";
import type { ActionFailure, ActionResult } from "./types";
import type { CommunityPlaceStatus } from "./rules";

const { community_places: places, community_place_photos: photos } = schema;

const fail = (error: string): ActionFailure => ({ ok: false, error });
const NOT_ALLOWED = fail("You do not have permission to do that.");
const FAILED = fail("That change could not be saved. Try again in a moment.");

async function adminId(): Promise<string | null> {
  const profile = await getSessionProfile();
  return profile?.role === "admin" ? profile.id : null;
}

/**
 * Drop CDN copies of photos (a no-op off Vercel). Deleted, not just
 * invalidated: a takedown must not be served stale while revalidating.
 *
 * Tried twice, because the photo route lets the CDN keep a published photo
 * for a day (`Vercel-CDN-Cache-Control`): a purge that fails both times
 * leaves the old copy at the edge until then (browsers keep theirs for five
 * minutes at most). That is logged as an error, with the tags, so it can be
 * purged by hand. The admin action still succeeds: the database change is
 * made and the app itself stops serving the photo (the cached key map is
 * dropped by `refresh()`, and the live route refuses it).
 */
async function purgeCached(tags: string[]) {
  try {
    await dangerouslyDeleteByTag(tags);
  } catch (first) {
    console.warn("[community-admin] CDN purge failed, retrying:", (first as Error).message);
    try {
      await dangerouslyDeleteByTag(tags);
    } catch (second) {
      console.error(
        "[community-admin] CDN purge failed twice; purge these tags by hand:",
        tags.join(", "),
        (second as Error).message,
      );
    }
  }
}

/**
 * Purge the CDN only once the app itself has stopped serving the photo.
 *
 * Order matters. `updateTag` inside a Server Action only queues the tag
 * (`pendingRevalidatedTags`, node_modules/next/dist/server/web/spec-extension/revalidate.js);
 * the cached published-photo map (`getPublishedPhotoKey` in `./public-reads`)
 * is not dropped until the action returns. Purging the edge before that left
 * a window in which an anonymous request missed the purged edge, was served
 * the bytes from the still-cached map, and put them back at the edge for a
 * day.
 *
 * `after()` closes the window. Every caller has already called `refresh()`,
 * whose `revalidatePath` calls make the action re-render the page, and the
 * action handler awaits `executeRevalidates` (the tag write included) before
 * that render (the `finally` of `executeActionAndPrepareForRender` in
 * node_modules/next/dist/server/app-render/action-handler.js). `after()`
 * callbacks only run once the response has closed
 * (`AfterContext.runCallbacksOnClose`), so the purge always lands after the
 * revalidation is applied, and a request that misses the edge from then on
 * reads the fresh map and gets a 404, which the CDN does not keep. One purge
 * is enough for that, so there is no second, delayed one.
 *
 * Should `after()` be unavailable (it throws when the runtime has no
 * `waitUntil`), the purge runs inline instead: the old, racy order, which
 * still beats no purge at all.
 */
async function purgeAfterResponse(tags: string[]) {
  try {
    after(() => purgeCached(tags));
  } catch {
    await purgeCached(tags);
  }
}

/**
 * After any admin decision: `updateTag(COMMUNITY_TAG)` drops the cached
 * public reads (`./public-reads`: the published list, slugs, place pages and
 * photo keys), so a publish shows and a reject, hold or photo removal
 * disappears on the next request. All callers are Server Actions, where
 * `updateTag` is allowed. The paths then re-render with the change. Call it
 * BEFORE `purgeAfterResponse`; see there for why.
 */
function refresh(slug?: string) {
  updateTag(COMMUNITY_TAG);
  revalidatePath("/admin", "layout");
  revalidatePath("/community");
  revalidatePath("/community/verify");
  revalidatePath("/account/places");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/community/${slug}`);
}

async function decide(
  input: unknown,
  next: CommunityPlaceStatus,
  from: CommunityPlaceStatus[],
  noteRequired: boolean,
): Promise<ActionResult> {
  const decidedBy = await adminId();
  if (!decidedBy) return NOT_ALLOWED;

  const parsed = adminDecisionSchema.safeParse(input);
  if (!parsed.success) return FAILED;
  const note = parsed.data.note || null;
  if (noteRequired && (note?.length ?? 0) < REJECT_NOTE_MIN) {
    return fail(`Add a reason of at least ${REJECT_NOTE_MIN} characters. The person who listed it will see it.`);
  }

  const db = getDb();
  if (!db) return FAILED;

  try {
    const [row] = await db
      .update(places)
      .set({
        status: next,
        admin_note: note,
        decided_by: decidedBy,
        decided_at: sql`now()`,
        ...(next === "published" ? { published_at: sql`coalesce(${places.published_at}, now())` } : {}),
      })
      .where(and(eq(places.id, parsed.data.placeId), inArray(places.status, from)))
      .returning({ slug: places.slug });
    if (!row) return fail("This place has changed since you opened it. Refresh and try again.");
    refresh(row.slug);
    // Leaving `published`: its photos must stop being served from the CDN,
    // once the refresh above has dropped them from the app's own cache.
    if (next !== "published") await purgeAfterResponse([placeCacheTag(parsed.data.placeId)]);
    return { ok: true };
  } catch (err) {
    if (isUniqueViolation(err, "community_places_name_district_key")) {
      return fail(
        "Another live listing in this district now has the same name, so this one cannot be published or held. Reject one of them first.",
      );
    }
    logDbError(`community-admin.${next}`, err);
    return FAILED;
  }
}

/** Publish a place by hand: one held for review, still collecting votes, or rejected earlier. */
export async function publishPlace(input: { placeId: string; note?: string }): Promise<ActionResult> {
  return decide(input, "published", ["pending", "held", "rejected"], false);
}

/** Turn a place down. The reason is required and shown to the person who listed it. */
export async function rejectPlace(input: { placeId: string; note: string }): Promise<ActionResult> {
  return decide(input, "rejected", ["pending", "held", "published"], true);
}

/** Take a place off the public site (or out of voting) and back into the review queue. */
export async function holdPlace(input: { placeId: string; note?: string }): Promise<ActionResult> {
  return decide(input, "held", ["pending", "published", "rejected"], false);
}

/**
 * Take one photo down. Its bytes are deleted from storage; the row stays, with
 * `removed_at` set, as the record of what was there and who uploaded it.
 */
export async function removePhoto(photoId: unknown): Promise<ActionResult> {
  if (!(await adminId())) return NOT_ALLOWED;

  const parsed = photoIdSchema.safeParse(photoId);
  if (!parsed.success) return FAILED;

  const db = getDb();
  if (!db) return FAILED;

  try {
    const [row] = await db
      .update(photos)
      .set({ removed_at: sql`now()` })
      .where(and(eq(photos.id, parsed.data), isNull(photos.removed_at)))
      .returning({ storageKey: photos.storage_key, thumbKey: photos.thumb_key, placeId: photos.place_id });
    if (!row) return fail("That photo is already removed.");

    // Bytes first: from here on even a stale cached key map can only lead the
    // photo route to a missing object, which it answers with an uncached 404.
    // A storage hiccup here leaves bytes behind, but they are not served: the
    // live route refuses removed photos and the refreshed key map drops them.
    await getPhotoStore()
      ?.delete([row.storageKey, row.thumbKey])
      .catch((err) => console.warn("[community-admin] photo bytes not deleted:", (err as Error).message));

    // The slug only adds the place page to the paths re-rendered; a failed
    // lookup must not skip the refresh and purge below, now the row is removed.
    let slug: string | undefined;
    if (row.placeId) {
      try {
        const [place] = await db.select({ slug: places.slug }).from(places).where(eq(places.id, row.placeId)).limit(1);
        slug = place?.slug;
      } catch (err) {
        logDbWarn("community-admin.remove-photo-slug", err);
      }
    }
    refresh(slug);
    await purgeAfterResponse([photoCacheTag(parsed.data)]);
    return { ok: true };
  } catch (err) {
    logDbError("community-admin.remove-photo", err);
    return FAILED;
  }
}
