/**
 * The community verification rules, in one place, for everyone to read.
 *
 * Anyone signed in with a verified email address can add a place. A new place
 * is then visible only to other signed-in, verified users, who can upvote it:
 *
 *   1. It is published once it has UPVOTES_REQUIRED upvotes from distinct
 *      verified users, all cast within VOTING_WINDOW_HOURS of it being listed.
 *   2. If the window closes first, it is hidden from the voting queue and held
 *      for manual review by an admin. Nothing is deleted.
 *   3. Nothing unverified is shown to the public: the catalogue and the
 *      public place pages only ever show published places.
 *
 * Who counts as a voter: a signed-in account whose email address is verified
 * and which is not banned. Each account has one vote per place, and nobody can
 * vote for a place they listed themselves. Votes can be withdrawn while the
 * place is still pending; once a place is published, its outcome is final.
 *
 * The same rules apply to every place and every user, admins included. On
 * top of them, an admin can publish, hold or reject a place by hand at any
 * stage (for example to review one the window closed on), and every such
 * decision is recorded with who made it and when.
 *
 * These are pure values and functions with no database access, so the server
 * and the browser show the same numbers. The enforcement is in
 * `src/lib/community/actions.ts`; change a rule here and it changes there.
 */

/** Upvotes from distinct verified users a place needs to be published. */
export const UPVOTES_REQUIRED = 10;

/** How long, from the moment it is listed, a place has to collect them. */
export const VOTING_WINDOW_HOURS = 48;

const HOUR_MS = 60 * 60 * 1000;

/** Abuse limits. Counted in the database, so they hold across server instances. */
export const LIMITS = {
  /** New places one account may list in any rolling 24 hours. */
  submissionsPerDay: 5,
  /** Places one account may have waiting for votes at the same time. */
  openSubmissions: 5,
  /** Photos attached to one place. */
  photosPerPlace: 6,
  /** Photos one account may upload in any rolling 24 hours. */
  uploadsPerDay: 40,
  /** An uploaded photo not attached to a place within this time is discarded. */
  unattachedPhotoHours: 24,
} as const;

export type CommunityPlaceStatus = "pending" | "published" | "held" | "rejected";

/** When the voting window for a place listed at `listedAt` closes. */
export function votingEndsAt(listedAt: Date): Date {
  return new Date(listedAt.getTime() + VOTING_WINDOW_HOURS * HOUR_MS);
}

/** True while a place can still collect votes. */
export function isVotingOpen(
  place: { status: CommunityPlaceStatus; votingEndsAt: Date },
  now: Date = new Date(),
): boolean {
  return place.status === "pending" && now.getTime() < place.votingEndsAt.getTime();
}

/**
 * The status a place is in right now. A `pending` row whose window has closed
 * is `held` even before anything has written that down, so no reader ever
 * depends on a background job having run.
 */
export function effectiveStatus(
  place: { status: CommunityPlaceStatus; votingEndsAt: Date },
  now: Date = new Date(),
): CommunityPlaceStatus {
  if (place.status === "pending" && !isVotingOpen(place, now)) return "held";
  return place.status;
}

/** True once this many upvotes publish a place. */
export function meetsThreshold(upvotes: number): boolean {
  return upvotes >= UPVOTES_REQUIRED;
}

/** Whole hours left to vote, rounded up, never negative. */
export function hoursLeft(votingEndsAt: Date, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((votingEndsAt.getTime() - now.getTime()) / HOUR_MS));
}
