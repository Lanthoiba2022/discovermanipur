"use server";

/**
 * Admin review of community places and photos. Every export is a public POST
 * endpoint, so each one re-reads the caller's role from `public.profiles`
 * before doing anything, and records who decided and when. Nothing here
 * deletes a place: rejecting or holding one only hides it.
 */

import { dangerouslyDeleteByTag } from "@vercel/functions";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getSessionProfile } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";

import { isUniqueViolation } from "./mutations";
import { photoCacheTag, placeCacheTag } from "./photo-links";
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
 * Drop CDN copies of photos at once (a no-op off Vercel). Deleted, not just
 * invalidated: a takedown must not be served stale while revalidating.
 */
async function purgeCached(tags: string[]) {
  await dangerouslyDeleteByTag(tags).catch((err) =>
    console.warn("[community-admin] CDN purge failed:", (err as Error).message),
  );
}

function refresh(slug?: string) {
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
    // Leaving `published`: its photos must stop being served from the CDN.
    if (next !== "published") await purgeCached([placeCacheTag(parsed.data.placeId)]);
    refresh(row.slug);
    return { ok: true };
  } catch (err) {
    if (isUniqueViolation(err, "community_places_name_district_key")) {
      return fail(
        "Another live listing in this district now has the same name, so this one cannot be published or held. Reject one of them first.",
      );
    }
    console.error(`[community-admin] ${next} failed:`, (err as Error).message);
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

    await purgeCached([photoCacheTag(parsed.data)]);
    // The photo route already refuses removed photos, so a storage hiccup
    // here leaves bytes behind but never serves them.
    await getPhotoStore()
      ?.delete([row.storageKey, row.thumbKey])
      .catch((err) => console.warn("[community-admin] photo bytes not deleted:", (err as Error).message));

    let slug: string | undefined;
    if (row.placeId) {
      const [place] = await db.select({ slug: places.slug }).from(places).where(eq(places.id, row.placeId)).limit(1);
      slug = place?.slug;
    }
    refresh(slug);
    return { ok: true };
  } catch (err) {
    console.error("[community-admin] remove photo failed:", (err as Error).message);
    return FAILED;
  }
}
