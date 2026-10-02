/**
 * Cached reads of published community places, for signed-out visitors.
 * Server-only by convention: it imports the database client.
 *
 * Why this exists: `/community` and `/community/[slug]` render per request
 * (they read `searchParams`), and the photo route is a Route Handler, so
 * before this file every anonymous view, crawler hit and CDN miss queried
 * Neon. Those were the only anonymous paths that kept the free-plan compute
 * awake. Here each of them reads a cross-request `sharedRead` entry instead,
 * so once the entries are warm a signed-out visitor costs no database query
 * at all:
 *
 * - `readPublishedIndex`: every published card, newest first. Filters are
 *   applied in memory (`filterPublishedCards`), so each category, district
 *   and search permutation is free.
 * - `readPublishedSlugs`: every published slug with its last change. The
 *   sitemap lists it, and the place page checks a slug against it before
 *   anything else, so unknown, old and non-public slugs 404 without a query.
 * - `readPublishedPlace`: one published place page, keyed by slug. Only
 *   called for slugs already in the published set, so random slugs cannot
 *   fill the cache with entries.
 * - `readPublishedPhotoKeys`: storage keys of every live photo of a published
 *   place, for the photo route.
 *
 * Rules that keep this safe:
 *
 * - Only `status = 'published'` rows enter these entries. Pending, held and
 *   rejected places, and removed or discarded photos, never do, so nothing a
 *   signed-out visitor may not see can be served from here.
 * - Nothing in them depends on who is looking. Signed-in viewers (who may see
 *   pending places, have voted, or listed the place) keep the live per-viewer
 *   reads in `./queries`; their vote state is never cached.
 * - The cached functions THROW on a database error and return JSON-safe
 *   values (ISO strings, no `Date`), as `src/lib/data/cache.ts` requires. Each
 *   fallback (an empty sitemap list, the "temporarily unavailable" page) is
 *   decided outside the cache, so an outage is never pinned.
 * - No timed revalidate. Every Server Action that changes what the public can
 *   see calls `updateTag(COMMUNITY_TAG)`: a vote that publishes a place
 *   (`./actions`), and every admin publish, reject, hold and photo removal
 *   (`./admin-actions`, in `refresh()`). Listing a new place does not, because
 *   a pending place is never in these entries.
 *
 * Accepted staleness: the upvote count, the submitter's first name and other
 * details on a published page are as of the last `COMMUNITY_TAG` update. A
 * ban applied outside the app (which lowers the live count) or an edit made
 * in the Neon console shows after the next update or the next deploy (the
 * cache key carries the deployment id). Votes on a published place are
 * closed, so its count only changes that way.
 */

import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { isAuthConfigured } from "@/lib/auth/env";
import { isProductionBuild, sharedRead } from "@/lib/data/cache";
import { getDb, isDatabaseConfigured, schema, type Db } from "@/lib/db";

import { liveUpvotes, photosFor, submitterFirstName, toCard, toPhoto, voteStateFor } from "./queries";
import type { CommunityCategory } from "./taxonomy";
import type {
  CommunityPlaceCard,
  CommunityPlaceDetail,
  PublicPlaceSnapshot,
  PublishedCardsResult,
  PublishedPhotoKey,
  PublishedSlug,
} from "./types";

/**
 * Cache tag on every cached public community read in this file. Any Server
 * Action that changes what the public can see (a place published, rejected
 * or held, a photo removed) must call `updateTag(COMMUNITY_TAG)`, so the
 * change shows on the next request. It lives here rather than beside
 * CATALOGUE_TAG in `src/lib/data/cache.ts` because only community code uses it.
 */
export const COMMUNITY_TAG = "community";

const { community_places: places, community_place_photos: photos } = schema;

/** The feature is on: both the database and sign-in are configured. */
const isConfigured = isDatabaseConfigured && isAuthConfigured;

/** The same slug shape `getPlaceForViewer` accepts. */
const SLUG = /^[a-z0-9-]{1,140}$/;

/**
 * How many of the newest published places the list entry holds. Far above the
 * 60 a page shows, so filters still search a wide set; the slug entry has no
 * cap, so an older place past this still has its page and sitemap URL.
 */
const INDEX_LIMIT = 500;

/** Inside a cached read the database must be there; the callers check first. */
function requireDb(): Db {
  const db = getDb();
  if (!db) throw new Error("[community] public read without a database");
  return db;
}

/* ------------------------------ cached entries ----------------------------- */

/**
 * Every published card, newest published first, capped at INDEX_LIMIT. Two
 * queries on a miss: the places with only the columns a card shows (the
 * description cut to 400 characters in SQL, enough for the 180-character
 * excerpt), then their live photos.
 */
const readPublishedIndex = sharedRead("community:published", COMMUNITY_TAG, async (): Promise<CommunityPlaceCard[]> => {
  const db = requireDb();
  const rows = await db
    .select({
      id: places.id,
      slug: places.slug,
      name: places.name,
      category: places.category,
      district: places.district,
      location: places.location,
      description: sql<string>`left(${places.description}, 400)`,
      published_at: places.published_at,
    })
    .from(places)
    .where(eq(places.status, "published"))
    .orderBy(desc(places.published_at))
    .limit(INDEX_LIMIT);
  const grouped = await photosFor(db, rows.map((r) => r.id));
  return rows.map((row) => toCard(row, grouped.get(row.id) ?? []));
});

/** Every published slug and when its row last changed. One small query on a miss. */
const readPublishedSlugs = sharedRead("community:slugs", COMMUNITY_TAG, async (): Promise<PublishedSlug[]> => {
  const rows = await requireDb()
    .select({ slug: places.slug, updatedAt: places.updated_at })
    .from(places)
    .where(eq(places.status, "published"));
  return rows.map((r) => ({ slug: r.slug, updatedAt: r.updatedAt.toISOString() }));
});

/**
 * Storage keys of every live photo of a published place, by photo id. One
 * query on a miss. Removed and discarded photos, and photos of places that
 * are not published, are left out, so the photo route can serve whatever it
 * finds here to anyone.
 */
const readPublishedPhotoKeys = sharedRead(
  "community:photos",
  COMMUNITY_TAG,
  async (): Promise<Record<string, PublishedPhotoKey>> => {
    const rows = await requireDb()
      .select({ id: photos.id, storageKey: photos.storage_key, thumbKey: photos.thumb_key, placeId: places.id })
      .from(photos)
      .innerJoin(places, eq(places.id, photos.place_id))
      .where(and(eq(places.status, "published"), isNull(photos.removed_at), isNull(photos.discarded_at)));
    return Object.fromEntries(
      rows.map((r) => [r.id, { storageKey: r.storageKey, thumbKey: r.thumbKey, placeId: r.placeId }]),
    );
  },
);

/**
 * What a published place page shows to everyone, or `null` when the slug is
 * not a published place. Up to four queries on a miss: the place, then its
 * live upvotes, live photos and the submitter's first name together.
 */
const readPublishedPlace = sharedRead(
  "community:place",
  COMMUNITY_TAG,
  async (slug: string): Promise<PublicPlaceSnapshot | null> => {
    const db = requireDb();
    const [row] = await db
      .select({
        id: places.id,
        slug: places.slug,
        name: places.name,
        category: places.category,
        district: places.district,
        location: places.location,
        lat: places.lat,
        lng: places.lng,
        description: places.description,
        practical_details: places.practical_details,
        sources: places.sources,
        relationship: places.relationship,
        submitted_by: places.submitted_by,
        voting_ends_at: places.voting_ends_at,
        published_at: places.published_at,
        created_at: places.created_at,
      })
      .from(places)
      .where(and(eq(places.slug, slug), eq(places.status, "published")))
      .limit(1);
    if (!row) return null;

    const [live, grouped, listedBy] = await Promise.all([
      liveUpvotes(db, [row.id]),
      photosFor(db, [row.id]),
      submitterFirstName(db, row.submitted_by),
    ]);
    const rowPhotos = grouped.get(row.id) ?? [];

    return {
      ...toCard(row, rowPhotos),
      description: row.description,
      practicalDetails: row.practical_details,
      sources: row.sources,
      relationship: row.relationship,
      lat: row.lat,
      lng: row.lng,
      photos: rowPhotos.map((p) => toPhoto(p, row.name)),
      createdAt: row.created_at.toISOString(),
      listedBy,
      upvotes: live.get(row.id) ?? 0,
      votingEndsAt: row.voting_ends_at.toISOString(),
    };
  },
);

/* --------------------------------- public ---------------------------------- */

export interface PublishedFilters {
  category?: CommunityCategory;
  district?: string;
  q?: string;
  limit?: number;
}

/**
 * Apply the `/community` filters to cached cards, keeping their order (newest
 * first). Matches what the SQL used to do: category and district by equality,
 * and `q` as a case-insensitive substring of the name or the location (the
 * old escaped `ilike '%q%'`), trimmed and cut to 100 characters. Pure, so it
 * can be tested without a database.
 */
export function filterPublishedCards(cards: CommunityPlaceCard[], filters: PublishedFilters = {}): CommunityPlaceCard[] {
  const needle = filters.q?.trim().slice(0, 100).toLowerCase();
  const limit = Math.min(filters.limit ?? 60, 200);
  const matches = cards.filter(
    (card) =>
      (!filters.category || card.category === filters.category) &&
      (!filters.district || card.district === filters.district) &&
      (!needle || card.name.toLowerCase().includes(needle) || card.location.toLowerCase().includes(needle)),
  );
  return matches.slice(0, limit);
}

/**
 * Published places for `/community`, filtered in memory. `{ ok: false }` when
 * the read failed, so the page can say the list is temporarily unavailable
 * instead of claiming nothing is published. An empty list when the feature
 * is not configured (the page shows its switched-off state before asking).
 */
export async function listPublishedCards(filters: PublishedFilters = {}): Promise<PublishedCardsResult> {
  if (!isConfigured) return { ok: true, places: [] };
  try {
    return { ok: true, places: filterPublishedCards(await readPublishedIndex(), filters) };
  } catch (err) {
    console.error("[community] published list failed:", (err as Error).message);
    return { ok: false };
  }
}

/**
 * A published place as a signed-out visitor sees it, or `null` (the page
 * 404s). A slug that is malformed or not in the published set returns before
 * any per-place read, so probes and stale links cost nothing once the slug
 * entry is warm. A database error propagates, as `getPlaceForViewer`'s does,
 * so the page shows its error state rather than a false 404.
 *
 * The vote state is built here, per request, from the cached fields, with
 * the rules `voteStateFor` applies to a signed-out viewer on a published
 * place: voting closed, no vote possible, "This place is already published.",
 * and the hours left counted from now.
 */
export async function getPublicPlace(slug: string): Promise<CommunityPlaceDetail | null> {
  if (!isConfigured || !SLUG.test(slug)) return null;
  const published = await readPublishedSlugs();
  if (!published.some((row) => row.slug === slug)) return null;

  const snapshot = await readPublishedPlace(slug);
  if (!snapshot) return null;

  const { upvotes, votingEndsAt, ...place } = snapshot;
  const vote = voteStateFor(
    { status: "published", voting_ends_at: new Date(votingEndsAt), submitted_by: null, upvote_count: upvotes },
    null,
    false,
  );
  return { ...place, status: "published", heldBy: null, isOwn: false, vote };
}

/**
 * Storage keys of a live photo of a published place, or `null` when the id
 * is not one (it may still be a photo a signed-in viewer can see: the photo
 * route then reads live). Throws when the read fails; the route falls back.
 */
export async function getPublishedPhotoKey(photoId: string): Promise<PublishedPhotoKey | null> {
  if (!isConfigured) return null;
  const keys = await readPublishedPhotoKeys();
  return Object.hasOwn(keys, photoId) ? keys[photoId] : null;
}

/**
 * Published slugs for the sitemap. Empty when the feature is not configured.
 * On a read error a Vercel Production build fails (rethrows) rather than
 * baking a sitemap without community URLs into the deployment; anywhere else
 * it logs and returns an empty list, so the rest of the sitemap still serves.
 * "Production build" is the catalogue loaders' rule, `isProductionBuild` in
 * `src/lib/data/cache.ts`, `ALLOW_SEED_FALLBACK=1` override included.
 */
export async function listPublishedSlugsCached(): Promise<PublishedSlug[]> {
  if (!isConfigured) return [];
  try {
    return await readPublishedSlugs();
  } catch (err) {
    if (isProductionBuild()) throw err;
    console.error("[community] published slugs failed:", (err as Error).message);
    return [];
  }
}
