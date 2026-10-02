/**
 * Reads for community places. Server-only: it imports the database client.
 *
 * The connection is the table owner and there is no row-level security, so
 * the visibility rules are written into each function here:
 *
 * - public readers see `published` places only;
 * - places collecting votes are seen by signed-in verified users, their
 *   submitter and admins;
 * - held and rejected places are seen by their submitter and admins;
 * - photos that an admin removed are never returned outside the admin views.
 *
 * Functions named `admin*` return submitter emails and every row. They must
 * only ever be called behind `requireAdmin`.
 */

import { and, asc, count, desc, eq, gt, ilike, inArray, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { getDb, schema, type Db } from "@/lib/db";
import { neonAuthUser } from "@/lib/db/neon-auth";
import { logDbError } from "@/lib/log";

import { effectiveStatus, hoursLeft, isVotingOpen, UPVOTES_REQUIRED, type CommunityPlaceStatus } from "./rules";
import { photoCredit, photoUrl } from "./photo-links";
import type {
  AdminPerson,
  AdminPhoto,
  AdminPlaceDetail,
  AdminPlaceRow,
  CommunityPhoto,
  CommunityPlaceCard,
  CommunityPlaceDetail,
  CommunityStats,
  CommunityViewer,
  ContributorRow,
  MySubmission,
  VerificationQueueItem,
  VoteState,
} from "./types";
import { displayName } from "./viewer";

const { community_places: places, community_place_photos: photos, community_place_votes: votes, profiles } = schema;

type PlaceRow = typeof places.$inferSelect;

/**
 * The photo columns a card or gallery shows, and the two that order them.
 * Storage keys, uploader and byte size are left out: nothing outside the
 * admin photo list (which selects its own columns) and the photo route
 * (likewise) reads them, and every byte selected here is Neon egress.
 */
export const photoColumns = {
  id: photos.id,
  place_id: photos.place_id,
  width: photos.width,
  height: photos.height,
  alt: photos.alt,
  licence: photos.licence,
  author: photos.author,
  source_url: photos.source_url,
  sort_order: photos.sort_order,
  created_at: photos.created_at,
};

/** A photo row as `photosFor` selects it (`photoColumns`). */
export type PhotoCardRow = Pick<
  typeof photos.$inferSelect,
  "id" | "place_id" | "width" | "height" | "alt" | "licence" | "author" | "source_url" | "sort_order" | "created_at"
>;

/** The place columns `toCard` reads, so a narrow select can be mapped as well as a whole row. */
export type PlaceCardRow = Pick<
  PlaceRow,
  "id" | "slug" | "name" | "category" | "district" | "location" | "description" | "published_at"
>;

/** The place columns the visibility and vote rules read (`canView`, `voteStateFor`). */
type PlaceRuleRow = Pick<PlaceRow, "status" | "voting_ends_at" | "submitted_by">;

/* --------------------------------- mapping --------------------------------- */

/*
 * The mappers below are exported for `./public-reads`, which builds the
 * cached public cards and place pages with them so the public and signed-in
 * views of a place can never drift apart. They are pure and JSON-safe.
 */

export function toPhoto(
  photo: Omit<PhotoCardRow, "place_id" | "sort_order" | "created_at">,
  placeName: string,
): CommunityPhoto {
  return {
    id: photo.id,
    src: photoUrl(photo.id),
    thumbSrc: photoUrl(photo.id, "thumb"),
    width: photo.width,
    height: photo.height,
    alt: photo.alt?.trim() || placeName,
    licence: photo.licence,
    author: photo.author,
    sourceUrl: photo.source_url,
    credit: photoCredit(photo.author, photo.licence),
  };
}

export function excerptOf(text: string, max = 180) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

export const iso = (value: Date | null) => (value ? value.toISOString() : null);

const statusOf = (row: Pick<PlaceRow, "status" | "voting_ends_at">, now: Date) =>
  effectiveStatus({ status: row.status, votingEndsAt: row.voting_ends_at }, now);

export function toCard(row: PlaceCardRow, rowPhotos: PhotoCardRow[]): CommunityPlaceCard {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    district: row.district,
    location: row.location,
    excerpt: excerptOf(row.description),
    cover: rowPhotos[0] ? toPhoto(rowPhotos[0], row.name) : null,
    photoCount: rowPhotos.length,
    publishedAt: iso(row.published_at),
  };
}

/**
 * Live photos of the given places (not removed by an admin, not discarded by
 * their uploader), grouped by place and in display order.
 */
export async function photosFor(db: Db, placeIds: string[]): Promise<Map<string, PhotoCardRow[]>> {
  const grouped = new Map<string, PhotoCardRow[]>();
  if (placeIds.length === 0) return grouped;
  const rows = await db
    .select(photoColumns)
    .from(photos)
    .where(and(inArray(photos.place_id, placeIds), isNull(photos.removed_at), isNull(photos.discarded_at)))
    .orderBy(asc(photos.sort_order), asc(photos.created_at));
  for (const row of rows) {
    const list = grouped.get(row.place_id!) ?? [];
    list.push(row);
    grouped.set(row.place_id!, list);
  }
  return grouped;
}

/**
 * Current upvotes from eligible voters (verified, not banned), per place. The
 * stored `upvote_count` is only rewritten when someone votes, so a ban or a
 * deleted account would otherwise leave the shown number too high.
 */
export async function liveUpvotes(db: Db, placeIds: string[]): Promise<Map<string, number>> {
  if (placeIds.length === 0) return new Map();
  const rows = await db
    .select({ placeId: votes.place_id, value: count() })
    .from(votes)
    .innerJoin(neonAuthUser, eq(neonAuthUser.id, votes.user_id))
    .where(
      and(
        inArray(votes.place_id, placeIds),
        eq(neonAuthUser.emailVerified, true),
        sql`coalesce(${neonAuthUser.banned}, false) = false`,
      ),
    )
    .groupBy(votes.place_id);
  return new Map(rows.map((r) => [r.placeId, r.value]));
}

/** The rows with `upvote_count` replaced by the live count of eligible votes. */
async function withLiveUpvotes<T extends { id: string; upvote_count: number }>(db: Db, rows: T[]): Promise<T[]> {
  const live = await liveUpvotes(db, rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, upvote_count: live.get(r.id) ?? 0 }));
}

/** Why a held place is held: its window closed, or an admin took it down. */
function heldBy(row: PlaceRow, now: Date): "window" | "admin" | null {
  if (statusOf(row, now) !== "held") return null;
  return row.status === "held" && row.decided_by ? "admin" : "window";
}

/** Which of these places the viewer has upvoted. */
async function votedBy(db: Db, userId: string, placeIds: string[]): Promise<Set<string>> {
  if (placeIds.length === 0) return new Set();
  const rows = await db
    .select({ placeId: votes.place_id })
    .from(votes)
    .where(and(eq(votes.user_id, userId), inArray(votes.place_id, placeIds)));
  return new Set(rows.map((r) => r.placeId));
}

/**
 * What `viewer` may do about a place's vote. Pure, so `./public-reads` can
 * apply the same rules to a cached published place for a signed-out visitor.
 */
export function voteStateFor(
  row: PlaceRuleRow & Pick<PlaceRow, "upvote_count">,
  viewer: CommunityViewer | null,
  hasVoted: boolean,
  now = new Date(),
): VoteState {
  const open = isVotingOpen({ status: row.status, votingEndsAt: row.voting_ends_at }, now);
  const isOwn = viewer !== null && row.submitted_by === viewer.userId;

  let reason: string | null = null;
  if (row.status === "published") reason = "This place is already published.";
  else if (!open) reason = "Voting on this place has closed.";
  else if (!viewer) reason = "Sign in with a verified email address to vote.";
  else if (viewer.banned) reason = "This account cannot vote.";
  else if (!viewer.emailVerified) reason = "Verify your email address to vote.";
  else if (isOwn) reason = "You listed this place, so you cannot vote for it.";

  return {
    upvotes: row.upvote_count,
    upvotesRequired: UPVOTES_REQUIRED,
    votingEndsAt: row.voting_ends_at.toISOString(),
    hoursLeft: hoursLeft(row.voting_ends_at, now),
    open,
    hasVoted,
    canVote: reason === null,
    reason,
  };
}

/**
 * Whether `viewer` may see a place in this state at all. It reads only the
 * three rule columns, so the photo route can pass a narrow select.
 */
export function canView(row: PlaceRuleRow, viewer: CommunityViewer | null, now = new Date()): boolean {
  const status = statusOf(row, now);
  if (status === "published") return true;
  if (!viewer) return false;
  if (viewer.role === "admin" || row.submitted_by === viewer.userId) return true;
  return status === "pending" && viewer.canParticipate;
}

/* ------------------------------- maintenance ------------------------------- */

/**
 * Write down what `effectiveStatus` already says: pending places whose window
 * has closed become `held`. Idempotent and cheap (indexed). No reader depends
 * on it having run; it keeps the stored status honest for the admin queue.
 */
export async function sweepExpired(db: Db): Promise<number> {
  const rows = await db
    .update(places)
    .set({ status: "held" })
    .where(and(eq(places.status, "pending"), lte(places.voting_ends_at, sql`now()`)))
    .returning({ id: places.id });
  return rows.length;
}

/* --------------------------------- public ---------------------------------- */

/*
 * The signed-out reads (the published list, the sitemap slugs, a published
 * place page and the photo key map) are cached across requests and live in
 * `./public-reads`. Everything below reads live, per viewer.
 */

/** The first name of the person who listed a place, as public pages show it. */
export async function submitterFirstName(db: Db, profileId: string | null): Promise<string | null> {
  if (!profileId) return null;
  const [row] = await db
    .select({ first_name: profiles.first_name })
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);
  return row?.first_name?.trim() || null;
}

/**
 * One place, or `null` when it does not exist or the viewer may not see it
 * (the page 404s). Live on every call: it is the path for signed-in viewers,
 * whose vote state and access depend on who they are. Signed-out visitors go
 * through `getPublicPlace` in `./public-reads` instead.
 */
export async function getPlaceForViewer(
  slug: string,
  viewer: CommunityViewer | null,
): Promise<CommunityPlaceDetail | null> {
  const db = getDb();
  if (!db || !/^[a-z0-9-]{1,140}$/.test(slug)) return null;

  const now = new Date();
  const [found] = await db.select().from(places).where(eq(places.slug, slug)).limit(1);
  if (!found || !canView(found, viewer, now)) return null;

  // Each of these needs only the place id, so they share one round trip.
  const [live, grouped, voted, listedBy] = await Promise.all([
    liveUpvotes(db, [found.id]),
    photosFor(db, [found.id]),
    viewer ? votedBy(db, viewer.userId, [found.id]) : Promise.resolve(new Set<string>()),
    submitterFirstName(db, found.submitted_by),
  ]);
  const row = { ...found, upvote_count: live.get(found.id) ?? 0 };
  const rowPhotos = grouped.get(row.id) ?? [];

  return {
    ...toCard(row, rowPhotos),
    status: statusOf(row, now),
    description: row.description,
    practicalDetails: row.practical_details,
    sources: row.sources,
    relationship: row.relationship,
    lat: row.lat,
    lng: row.lng,
    photos: rowPhotos.map((p) => toPhoto(p, row.name)),
    createdAt: row.created_at.toISOString(),
    listedBy,
    heldBy: heldBy(row, now),
    isOwn: viewer !== null && row.submitted_by === viewer.userId,
    vote: voteStateFor(row, viewer, voted.has(row.id), now),
  };
}

/**
 * Places collecting votes, the ones closing soonest first. Only for a viewer
 * who may take part; everyone else gets an empty list.
 */
export async function listVerificationQueue(viewer: CommunityViewer | null): Promise<VerificationQueueItem[]> {
  const db = getDb();
  if (!db || !viewer || (!viewer.canParticipate && viewer.role !== "admin")) return [];

  const now = new Date();
  try {
    const rows = await db
      .select()
      .from(places)
      .where(and(eq(places.status, "pending"), gt(places.voting_ends_at, sql`now()`)))
      .orderBy(asc(places.voting_ends_at))
      .limit(100)
      .then((found) => withLiveUpvotes(db, found));
    const ids = rows.map((r) => r.id);
    const [grouped, voted] = await Promise.all([photosFor(db, ids), votedBy(db, viewer.userId, ids)]);
    return rows.map((row) => ({
      ...toCard(row, grouped.get(row.id) ?? []),
      createdAt: row.created_at.toISOString(),
      isOwn: row.submitted_by === viewer.userId,
      vote: voteStateFor(row, viewer, voted.has(row.id), now),
    }));
  } catch (err) {
    logDbError("community.verification-queue", err);
    return [];
  }
}

/** The signed-in user's own listings, newest first. */
export async function listMySubmissions(userId: string): Promise<MySubmission[] | null> {
  const db = getDb();
  if (!db) return null;

  const now = new Date();
  try {
    const rows = await db
      .select()
      .from(places)
      .where(eq(places.submitted_by, userId))
      .orderBy(desc(places.created_at))
      .limit(200)
      .then((found) => withLiveUpvotes(db, found));
    const grouped = await photosFor(db, rows.map((r) => r.id));
    return rows.map((row) => {
      const rowPhotos = grouped.get(row.id) ?? [];
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        category: row.category,
        district: row.district,
        status: statusOf(row, now),
        upvotes: row.upvote_count,
        upvotesRequired: UPVOTES_REQUIRED,
        votingEndsAt: row.voting_ends_at.toISOString(),
        hoursLeft: hoursLeft(row.voting_ends_at, now),
        createdAt: row.created_at.toISOString(),
        publishedAt: iso(row.published_at),
        adminNote: row.status === "rejected" ? row.admin_note : null,
        heldBy: heldBy(row, now),
        cover: rowPhotos[0] ? toPhoto(rowPhotos[0], row.name) : null,
        photoCount: rowPhotos.length,
      };
    });
  } catch (err) {
    logDbError("community.my-submissions", err);
    return null;
  }
}

/* ---------------------------------- admin ---------------------------------- */

const submitter = alias(profiles, "submitter");
const decider = alias(profiles, "decider");
const uploader = alias(profiles, "uploader");

/* The columns `person()` reads, once per alias of `profiles`. */
const submitterColumns = { id: submitter.id, first_name: submitter.first_name, last_name: submitter.last_name, email: submitter.email };
const deciderColumns = { id: decider.id, first_name: decider.first_name, last_name: decider.last_name, email: decider.email };
const uploaderColumns = { id: uploader.id, first_name: uploader.first_name, last_name: uploader.last_name, email: uploader.email };

type PersonFields = { id: string | null; first_name: string | null; last_name: string | null; email: string | null };

function person(row: PersonFields | null): AdminPerson | null {
  if (!row?.id || !row.email) return null;
  return { id: row.id, name: displayName({ first_name: row.first_name, last_name: row.last_name, email: row.email }), email: row.email };
}

export type AdminStatusFilter = CommunityPlaceStatus | "all";

export interface AdminPlaceFilters {
  status?: AdminStatusFilter;
  submitterId?: string;
  q?: string;
}

async function adminPlaceRows(db: Db, where: SQL | undefined, limit: number) {
  return db
    .select({ place: places, submitter: submitterColumns, decider: deciderColumns })
    .from(places)
    .leftJoin(submitter, eq(submitter.id, places.submitted_by))
    .leftJoin(decider, eq(decider.id, places.decided_by))
    .where(where)
    .orderBy(desc(places.created_at))
    .limit(limit);
}

function toAdminRow(
  row: Awaited<ReturnType<typeof adminPlaceRows>>[number],
  rowPhotos: PhotoCardRow[],
  liveCount: number,
  now: Date,
): AdminPlaceRow {
  const { place } = row;
  return {
    id: place.id,
    slug: place.slug,
    name: place.name,
    category: place.category,
    district: place.district,
    location: place.location,
    status: statusOf(place, now),
    upvotes: liveCount,
    votingEndsAt: place.voting_ends_at.toISOString(),
    createdAt: place.created_at.toISOString(),
    publishedAt: iso(place.published_at),
    relationship: place.relationship,
    submitter: person(row.submitter),
    photoCount: rowPhotos.length,
    cover: rowPhotos[0] ? toPhoto(rowPhotos[0], place.name) : null,
    adminNote: place.admin_note,
    decidedBy: person(row.decider),
    decidedAt: iso(place.decided_at),
  };
}

function adminPlaceWhere(filters: AdminPlaceFilters, withStatus: boolean): SQL[] {
  const where: SQL[] = [];
  if (withStatus && filters.status && filters.status !== "all") where.push(eq(places.status, filters.status));
  if (filters.submitterId) where.push(eq(places.submitted_by, filters.submitterId));
  const q = filters.q?.trim().slice(0, 100);
  if (q) where.push(ilike(places.name, `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`));
  return where;
}

/** Every community place matching the filters, newest first. Admin only. */
export async function adminListPlaces(filters: AdminPlaceFilters = {}): Promise<AdminPlaceRow[] | null> {
  const db = getDb();
  if (!db) return null;

  const where = adminPlaceWhere(filters, true);
  try {
    await sweepExpired(db);
    const now = new Date();
    const rows = await adminPlaceRows(db, where.length ? and(...where) : undefined, 500);
    const ids = rows.map((r) => r.place.id);
    const [grouped, live] = await Promise.all([photosFor(db, ids), liveUpvotes(db, ids)]);
    return rows.map((row) => toAdminRow(row, grouped.get(row.place.id) ?? [], live.get(row.place.id) ?? 0, now));
  } catch (err) {
    logDbError("community.admin-list", err);
    return null;
  }
}

/** How many places match the submitter and search filters, per status. Admin only. */
export async function adminCountPlaces(
  filters: Omit<AdminPlaceFilters, "status"> = {},
): Promise<Record<AdminStatusFilter, number> | null> {
  const db = getDb();
  if (!db) return null;
  const where = adminPlaceWhere(filters, false);
  try {
    // No sweep here (`adminListPlaces` runs one alongside): the effective
    // status is computed in SQL, so an expired pending row counts as held.
    const effective = sql<CommunityPlaceStatus>`case when ${places.status} = 'pending' and ${places.voting_ends_at} <= now() then 'held' else ${places.status}::text end`;
    const rows = await db
      .select({ status: effective, value: count() })
      .from(places)
      .where(where.length ? and(...where) : undefined)
      .groupBy(effective);
    const by = Object.fromEntries(rows.map((r) => [r.status, r.value])) as Partial<Record<CommunityPlaceStatus, number>>;
    const counts = { pending: by.pending ?? 0, published: by.published ?? 0, held: by.held ?? 0, rejected: by.rejected ?? 0 };
    return { ...counts, all: counts.pending + counts.published + counts.held + counts.rejected };
  } catch (err) {
    logDbError("community.admin-counts", err);
    return null;
  }
}

/** A person by profile id, for labelling a filter. Admin only. */
export async function adminGetPerson(id: string): Promise<AdminPerson | null> {
  const db = getDb();
  if (!db || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    const [row] = await db
      .select({ id: profiles.id, first_name: profiles.first_name, last_name: profiles.last_name, email: profiles.email })
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);
    return person(row ?? null);
  } catch {
    return null;
  }
}

/**
 * One place with every photo, removed ones included. Admin only. `null` means
 * no database or no such place; a failed query throws, so the page shows its
 * error state rather than a 404.
 */
export async function adminGetPlace(id: string): Promise<AdminPlaceDetail | null> {
  const db = getDb();
  if (!db || !/^[0-9a-f-]{36}$/i.test(id)) return null;

  await sweepExpired(db);
  const now = new Date();
  const [row] = await adminPlaceRows(db, eq(places.id, id), 1);
  if (!row) return null;
  const [livePhotos, all, upvotes] = await Promise.all([
    photosFor(db, [id]),
    adminListPhotos({ placeId: id, includeRemoved: true }),
    liveUpvotes(db, [id]),
  ]);
  if (all === null) throw new Error("Could not load the photos of this place");
  return {
    ...toAdminRow(row, livePhotos.get(id) ?? [], upvotes.get(id) ?? 0, now),
    description: row.place.description,
    practicalDetails: row.place.practical_details,
    sources: row.place.sources,
    lat: row.place.lat,
    lng: row.place.lng,
    photos: all,
  };
}

export interface AdminPhotoFilters {
  placeId?: string;
  uploaderId?: string;
  includeRemoved?: boolean;
  limit?: number;
}

/** Every uploaded photo, newest first, with its place and uploader. Admin only. */
export async function adminListPhotos(filters: AdminPhotoFilters = {}): Promise<AdminPhoto[] | null> {
  const db = getDb();
  if (!db) return null;

  const where: SQL[] = [];
  if (filters.placeId) where.push(eq(photos.place_id, filters.placeId));
  if (filters.uploaderId) where.push(eq(photos.uploaded_by, filters.uploaderId));
  // Uploads their owner discarded before submitting are not photos of anything.
  where.push(isNull(photos.discarded_at));
  if (!filters.includeRemoved) where.push(isNull(photos.removed_at));

  const now = new Date();
  try {
    const rows = await db
      .select({
        photo: photos,
        place: { id: places.id, name: places.name, slug: places.slug, status: places.status, votingEndsAt: places.voting_ends_at },
        uploader: uploaderColumns,
      })
      .from(photos)
      .leftJoin(places, eq(places.id, photos.place_id))
      .leftJoin(uploader, eq(uploader.id, photos.uploaded_by))
      .where(where.length ? and(...where) : undefined)
      .orderBy(filters.placeId ? asc(photos.sort_order) : desc(photos.created_at))
      .limit(Math.min(filters.limit ?? 300, 1000));

    return rows.map(({ photo, place, uploader: up }) => ({
      ...toPhoto(photo, place?.name ?? "Unattached upload"),
      altProvided: Boolean(photo.alt?.trim()),
      placeId: place?.id ?? null,
      placeName: place?.name ?? null,
      placeSlug: place?.slug ?? null,
      placeStatus: place ? effectiveStatus({ status: place.status, votingEndsAt: place.votingEndsAt }, now) : null,
      uploader: person(up),
      bytes: photo.bytes,
      createdAt: photo.created_at.toISOString(),
      removedAt: iso(photo.removed_at),
    }));
  } catch (err) {
    logDbError("community.admin-photos", err);
    return null;
  }
}

/** Everyone who has listed a place or uploaded a photo, most active first. Admin only. */
export async function adminListContributors(): Promise<ContributorRow[] | null> {
  const db = getDb();
  if (!db) return null;

  const placeTotals = db
    .select({
      userId: places.submitted_by,
      submitted: count().as("submitted"),
      published: sql<number>`count(*) filter (where ${places.status} = 'published')`.mapWith(Number).as("published"),
      pending: sql<number>`count(*) filter (where ${places.status} = 'pending')`.mapWith(Number).as("pending"),
      held: sql<number>`count(*) filter (where ${places.status} = 'held')`.mapWith(Number).as("held"),
      rejected: sql<number>`count(*) filter (where ${places.status} = 'rejected')`.mapWith(Number).as("rejected"),
      lastSubmittedAt: sql<Date>`max(${places.created_at})`.as("last_submitted_at"),
    })
    .from(places)
    .groupBy(places.submitted_by)
    .as("place_totals");
  const photoTotals = db
    .select({ userId: photos.uploaded_by, photos: count().as("photos") })
    .from(photos)
    .where(and(isNull(photos.removed_at), isNull(photos.discarded_at)))
    .groupBy(photos.uploaded_by)
    .as("photo_totals");
  const voteTotals = db
    .select({ userId: votes.user_id, votesCast: count().as("votes_cast") })
    .from(votes)
    .groupBy(votes.user_id)
    .as("vote_totals");

  try {
    await sweepExpired(db);
    const rows = await db
      .select({
        profile: profiles,
        emailVerified: neonAuthUser.emailVerified,
        banned: neonAuthUser.banned,
        submitted: placeTotals.submitted,
        published: placeTotals.published,
        pending: placeTotals.pending,
        held: placeTotals.held,
        rejected: placeTotals.rejected,
        lastSubmittedAt: placeTotals.lastSubmittedAt,
        photos: photoTotals.photos,
        votesCast: voteTotals.votesCast,
      })
      .from(profiles)
      .leftJoin(neonAuthUser, eq(neonAuthUser.id, profiles.id))
      .leftJoin(placeTotals, eq(placeTotals.userId, profiles.id))
      .leftJoin(photoTotals, eq(photoTotals.userId, profiles.id))
      .leftJoin(voteTotals, eq(voteTotals.userId, profiles.id))
      .where(or(sql`${placeTotals.submitted} > 0`, sql`${photoTotals.photos} > 0`))
      .orderBy(desc(sql`coalesce(${placeTotals.submitted}, 0)`), desc(sql`${placeTotals.lastSubmittedAt}`))
      .limit(1000);

    return rows.map((r) => ({
      id: r.profile.id,
      name: displayName(r.profile),
      email: r.profile.email,
      role: r.profile.role,
      joinedAt: r.profile.created_at.toISOString(),
      emailVerified: r.emailVerified ?? false,
      banned: r.banned ?? false,
      submitted: Number(r.submitted ?? 0),
      published: Number(r.published ?? 0),
      pending: Number(r.pending ?? 0),
      held: Number(r.held ?? 0),
      rejected: Number(r.rejected ?? 0),
      photos: Number(r.photos ?? 0),
      votesCast: Number(r.votesCast ?? 0),
      lastSubmittedAt: r.lastSubmittedAt ? new Date(r.lastSubmittedAt).toISOString() : null,
    }));
  } catch (err) {
    logDbError("community.contributors", err);
    return null;
  }
}

/** Counts for the admin overview. Admin only. */
export async function adminCommunityStats(): Promise<CommunityStats | null> {
  const db = getDb();
  if (!db) return null;
  try {
    await sweepExpired(db);
    const [statusRows, [contributorRow], [photoRow]] = await Promise.all([
      db.select({ status: places.status, value: count() }).from(places).groupBy(places.status),
      db.select({ value: sql<number>`count(distinct ${places.submitted_by})`.mapWith(Number) }).from(places),
      db.select({ value: count() }).from(photos).where(and(isNull(photos.removed_at), sql`${photos.place_id} is not null`)),
    ]);
    const by = Object.fromEntries(statusRows.map((r) => [r.status, r.value])) as Partial<Record<CommunityPlaceStatus, number>>;
    return {
      pending: by.pending ?? 0,
      held: by.held ?? 0,
      published: by.published ?? 0,
      rejected: by.rejected ?? 0,
      contributors: contributorRow?.value ?? 0,
      photos: photoRow?.value ?? 0,
    };
  } catch (err) {
    logDbError("community.stats", err);
    return null;
  }
}
