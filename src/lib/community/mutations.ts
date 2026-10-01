/**
 * The writes behind listing and voting, as plain functions of a database and
 * an already-authenticated user id. Server-only.
 *
 * Kept apart from the Server Actions (`./actions`) so the rules can be
 * exercised directly against a database: the actions add the session, the
 * rate limits and cache revalidation, and nothing else. A rule broken here
 * throws `RuleViolation` with a message meant for the person.
 */

import { randomBytes } from "node:crypto";

import { and, count, eq, gt, isNull, ne, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

import { schema, type Db } from "@/lib/db";
import { neonAuthUser } from "@/lib/db/neon-auth";

import { LIMITS, meetsThreshold, VOTING_WINDOW_HOURS, type CommunityPlaceStatus } from "./rules";
import type { PlaceSubmission } from "./schema";

const { community_places: places, community_place_photos: photos, community_place_votes: votes } = schema;

export class RuleViolation extends Error {
  constructor(
    message: string,
    /** The form field the message belongs to, if any. */
    readonly field?: string,
  ) {
    super(message);
    this.name = "RuleViolation";
  }
}

/** A readable, unique-enough slug: "loktak-view-point-3f9a1c". Built only on the server. */
export function makeSlug(name: string) {
  const base =
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/, "") || "place";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

/** Where a listing with this name already exists in this district, if anywhere. */
async function findDuplicate(db: Db, name: string, district: string): Promise<string | null> {
  const { hotspots, eateries, homestays, crafts } = schema;
  const sameName = (column: AnyPgColumn) => sql`lower(${column}) = lower(${name})`;
  const [community, hotspot, eatery, homestay, craft] = await Promise.all([
    db
      .select({ slug: places.slug })
      .from(places)
      .where(and(sameName(places.name), eq(places.district, district), ne(places.status, "rejected")))
      .limit(1),
    db.select({ slug: hotspots.slug }).from(hotspots).where(and(sameName(hotspots.name), eq(hotspots.district, district))).limit(1),
    db.select({ slug: eateries.slug }).from(eateries).where(and(sameName(eateries.name), eq(eateries.district, district))).limit(1),
    db.select({ slug: homestays.slug }).from(homestays).where(and(sameName(homestays.title), eq(homestays.district, district))).limit(1),
    db.select({ slug: crafts.slug }).from(crafts).where(and(sameName(crafts.name), eq(crafts.district, district))).limit(1),
  ]);
  if (community[0]) return "Someone has already listed a place with this name in this district.";
  if (hotspot[0]) return `This place is already on the site: /hotspots/${hotspot[0].slug}`;
  if (eatery[0]) return `This place is already on the site: /eateries/${eatery[0].slug}`;
  if (homestay[0]) return `This place is already on the site: /homestays/${homestay[0].slug}`;
  if (craft[0]) return `This maker is already on the site: /store/${craft[0].slug}`;
  return null;
}

/**
 * List a new place for `userId`. It starts `pending`, with its voting window
 * fixed now by the database clock, and takes the caller's own unattached
 * uploads as its photos.
 */
export async function createPlace(db: Db, userId: string, values: PlaceSubmission): Promise<{ id: string; slug: string }> {
  // Friendly message for the common case. The unique index on (lower(name),
  // district) is what actually guarantees it, including under a race.
  const duplicate = await findDuplicate(db, values.name, values.district);
  if (duplicate) throw new RuleViolation(duplicate, "name");

  try {
    return await insertPlace(db, userId, values);
  } catch (err) {
    if (isUniqueViolation(err, "community_places_name_district_key")) {
      throw new RuleViolation("Someone has already listed a place with this name in this district.", "name");
    }
    throw err;
  }
}

/** True when `err` (raw or wrapped by Drizzle) is a unique violation of `constraint`. */
export function isUniqueViolation(err: unknown, constraint: string): boolean {
  // node-postgres reports it directly; Drizzle wraps it as `cause`.
  for (let e = err as { code?: string; constraint?: string; cause?: unknown } | undefined; e; e = e.cause as typeof e) {
    if (e.code === "23505" && e.constraint === constraint) return true;
  }
  return false;
}

async function insertPlace(db: Db, userId: string, values: PlaceSubmission) {
  return db.transaction(async (tx) => {
    // Serialises one account's submissions, so two at once cannot both pass
    // the limits below.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`community_submit:${userId}`}))`);

    const [[{ today }], [{ open }]] = await Promise.all([
      tx
        .select({ today: count() })
        .from(places)
        .where(and(eq(places.submitted_by, userId), gt(places.created_at, sql`now() - interval '24 hours'`))),
      tx
        .select({ open: count() })
        .from(places)
        .where(and(eq(places.submitted_by, userId), eq(places.status, "pending"), gt(places.voting_ends_at, sql`now()`))),
    ]);
    if (today >= LIMITS.submissionsPerDay) {
      throw new RuleViolation(`You can list up to ${LIMITS.submissionsPerDay} places a day. Try again tomorrow.`);
    }
    if (open >= LIMITS.openSubmissions) {
      throw new RuleViolation(`You already have ${LIMITS.openSubmissions} places collecting votes. Wait for one to finish first.`);
    }

    const [created] = await tx
      .insert(places)
      .values({
        slug: makeSlug(values.name),
        submitted_by: userId,
        name: values.name,
        category: values.category,
        district: values.district,
        location: values.location,
        lat: values.lat ?? null,
        lng: values.lng ?? null,
        description: values.description,
        practical_details: values.practicalDetails || null,
        sources: values.sources,
        relationship: values.relationship,
        status: "pending",
        // The database clock, the same one every later "is it still open" check reads.
        voting_ends_at: sql`now() + make_interval(hours => ${VOTING_WINDOW_HOURS})`,
      })
      .returning({ id: places.id, slug: places.slug });

    // Only the caller's own, still-unattached, recent uploads can be attached.
    for (const [index, photoId] of values.photoIds.entries()) {
      const attached = await tx
        .update(photos)
        .set({ place_id: created.id, sort_order: index, ...(values.photoAlts[photoId] ? { alt: values.photoAlts[photoId] } : {}) })
        .where(
          and(
            eq(photos.id, photoId),
            eq(photos.uploaded_by, userId),
            isNull(photos.place_id),
            isNull(photos.removed_at),
            isNull(photos.discarded_at),
            gt(photos.created_at, sql`now() - make_interval(hours => ${LIMITS.unattachedPhotoHours})`),
          ),
        )
        .returning({ id: photos.id });
      if (attached.length === 0) {
        throw new RuleViolation("One of the photos could not be added. It may have expired; upload it again.", "photoIds");
      }
    }
    return created;
  });
}

export interface VoteOutcome {
  slug: string;
  upvotes: number;
  hasVoted: boolean;
  status: CommunityPlaceStatus;
}

/**
 * The votes that count: those cast by accounts that are verified and not
 * banned right now. A vote from an account banned or unverified after voting
 * stops counting, so a ring of throwaway accounts cannot publish a place by
 * outlasting its own ban.
 */
export function eligibleVotes(placeId: SQL | string) {
  return sql<number>`(
    select count(*)::int from ${votes}
    join ${neonAuthUser} on ${neonAuthUser.id} = ${votes.user_id}
    where ${votes.place_id} = ${placeId}
      and ${neonAuthUser.emailVerified}
      and coalesce(${neonAuthUser.banned}, false) = false
  )`;
}

/**
 * Set `userId`'s upvote on a place to `want` (cast it, or withdraw it).
 * Idempotent: asking for the state that already holds changes nothing, so a
 * stale button in another tab can never flip a vote the wrong way.
 *
 * The place row is locked for the whole transaction, so concurrent votes are
 * counted one at a time and the place is published exactly once, by the vote
 * that reaches the threshold. Eligibility of the voter (verified, not banned)
 * is the caller's job; everything about the place is checked here.
 */
export async function setVote(db: Db, placeId: string, userId: string, want: boolean): Promise<VoteOutcome> {
  // A refusal is returned out of the transaction, not thrown inside it: one of
  // them (the window has closed) writes `held`, and a throw would roll it back.
  const result = await db.transaction(async (tx): Promise<VoteOutcome | { refused: string }> => {
    // The window is checked against the database clock, inside the lock.
    const [locked] = await tx
      .select({ place: places, windowOpen: sql<boolean>`${places.voting_ends_at} > now()` })
      .from(places)
      .where(eq(places.id, placeId))
      .for("update")
      .limit(1);
    if (!locked) return { refused: "That place could not be found." };

    const { place, windowOpen } = locked;
    if (place.submitted_by === userId) return { refused: "You listed this place, so you cannot vote for it." };
    if (place.status === "published") return { refused: "This place is already published." };
    if (place.status !== "pending" || !windowOpen) {
      if (place.status === "pending") await tx.update(places).set({ status: "held" }).where(eq(places.id, place.id));
      return { refused: "Voting on this place has closed." };
    }

    if (want) {
      await tx.insert(votes).values({ place_id: place.id, user_id: userId }).onConflictDoNothing();
    } else {
      await tx.delete(votes).where(and(eq(votes.place_id, place.id), eq(votes.user_id, userId)));
    }

    // Recounted from eligible voters on every vote, never incremented.
    const {
      rows: [{ upvotes }],
    } = await tx.execute<{ upvotes: number }>(sql`select ${eligibleVotes(place.id)} as upvotes`);
    const publish = want && meetsThreshold(upvotes);
    await tx
      .update(places)
      .set(publish ? { upvote_count: upvotes, status: "published", published_at: sql`now()` } : { upvote_count: upvotes })
      .where(eq(places.id, place.id));

    return { slug: place.slug, upvotes, hasVoted: want, status: publish ? "published" : "pending" };
  });

  if ("refused" in result) throw new RuleViolation(result.refused);
  return result;
}

/**
 * Throw away one of `userId`'s own uploads not yet attached to a place.
 * Returns its storage keys (the caller deletes the bytes), or `null`.
 *
 * The row is kept, marked `discarded_at`, so it still counts against the
 * daily upload quota; the upload route purges it after a day.
 */
export async function discardOwnUpload(db: Db, photoId: string, userId: string): Promise<string[] | null> {
  const [row] = await db
    .update(photos)
    .set({ discarded_at: sql`now()` })
    .where(
      and(eq(photos.id, photoId), eq(photos.uploaded_by, userId), isNull(photos.place_id), isNull(photos.discarded_at)),
    )
    .returning({ storageKey: photos.storage_key, thumbKey: photos.thumb_key });
  return row ? [row.storageKey, row.thumbKey] : null;
}
