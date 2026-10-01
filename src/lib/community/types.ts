/**
 * What the community pages receive. Plain, serialisable shapes (dates as ISO
 * strings) built on the server by `./queries`; safe to import anywhere.
 */

import type { UserRole } from "@/types";

import type { CommunityPlaceStatus } from "./rules";
import type { CommunityCategory, PhotoLicence, SubmitterRelationship } from "./taxonomy";

/** A photo as the site shows it. `src` and `thumbSrc` go through the access-checked photo route. */
export interface CommunityPhoto {
  id: string;
  src: string;
  thumbSrc: string;
  width: number;
  height: number;
  alt: string;
  licence: PhotoLicence;
  author: string;
  sourceUrl: string | null;
  /** Ready to print under the photo, e.g. "Photo: Thoibi Devi, CC BY 4.0". */
  credit: string;
}

export interface CommunityPlaceCard {
  id: string;
  slug: string;
  name: string;
  category: CommunityCategory;
  district: string;
  location: string;
  excerpt: string;
  cover: CommunityPhoto | null;
  photoCount: number;
  publishedAt: string | null;
}

/** What the signed-in viewer may do on a place page, decided on the server. */
export interface VoteState {
  upvotes: number;
  upvotesRequired: number;
  votingEndsAt: string;
  hoursLeft: number;
  open: boolean;
  hasVoted: boolean;
  canVote: boolean;
  /** Why `canVote` is false, in words a person can act on. */
  reason: string | null;
}

export interface CommunityPlaceDetail extends CommunityPlaceCard {
  status: CommunityPlaceStatus;
  description: string;
  practicalDetails: string | null;
  sources: string[];
  relationship: SubmitterRelationship;
  lat: number | null;
  lng: number | null;
  photos: CommunityPhoto[];
  createdAt: string;
  /** First name only on public pages. */
  listedBy: string | null;
  /** For a held place: whether its voting window closed or an admin took it down. */
  heldBy: "window" | "admin" | null;
  isOwn: boolean;
  vote: VoteState;
}

export interface VerificationQueueItem extends CommunityPlaceCard {
  createdAt: string;
  isOwn: boolean;
  vote: VoteState;
}

export interface MySubmission {
  id: string;
  slug: string;
  name: string;
  category: CommunityCategory;
  district: string;
  status: CommunityPlaceStatus;
  upvotes: number;
  upvotesRequired: number;
  votingEndsAt: string;
  hoursLeft: number;
  createdAt: string;
  publishedAt: string | null;
  adminNote: string | null;
  /** For a held place: whether its voting window closed or an admin took it down. */
  heldBy: "window" | "admin" | null;
  cover: CommunityPhoto | null;
  photoCount: number;
}

export interface CommunityViewer {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  banned: boolean;
  /** Verified email and not banned: may list places and vote. */
  canParticipate: boolean;
}

/* ---------------------------------- admin ---------------------------------- */

export interface AdminPerson {
  id: string;
  name: string;
  email: string;
}

export interface AdminPhoto extends CommunityPhoto {
  /** False when the uploader wrote no description and `alt` is the place-name fallback. */
  altProvided: boolean;
  placeId: string | null;
  placeName: string | null;
  placeSlug: string | null;
  placeStatus: CommunityPlaceStatus | null;
  uploader: AdminPerson | null;
  bytes: number;
  createdAt: string;
  removedAt: string | null;
}

export interface AdminPlaceRow {
  id: string;
  slug: string;
  name: string;
  category: CommunityCategory;
  district: string;
  location: string;
  status: CommunityPlaceStatus;
  upvotes: number;
  votingEndsAt: string;
  createdAt: string;
  publishedAt: string | null;
  relationship: SubmitterRelationship;
  submitter: AdminPerson | null;
  photoCount: number;
  cover: CommunityPhoto | null;
  adminNote: string | null;
  decidedBy: AdminPerson | null;
  decidedAt: string | null;
}

export interface AdminPlaceDetail extends AdminPlaceRow {
  description: string;
  practicalDetails: string | null;
  sources: string[];
  lat: number | null;
  lng: number | null;
  photos: AdminPhoto[];
}

export interface ContributorRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  joinedAt: string;
  emailVerified: boolean;
  banned: boolean;
  submitted: number;
  published: number;
  pending: number;
  held: number;
  rejected: number;
  photos: number;
  votesCast: number;
  lastSubmittedAt: string | null;
}

export interface CommunityStats {
  pending: number;
  held: number;
  published: number;
  rejected: number;
  contributors: number;
  photos: number;
}

export interface ActionFailure {
  ok: false;
  error: string;
  /** Field name → message, for forms. */
  fieldErrors?: Record<string, string>;
}

export type ActionResult<T = void> = ([T] extends [void] ? { ok: true } : { ok: true; data: T }) | ActionFailure;
