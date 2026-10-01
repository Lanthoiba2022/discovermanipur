"use server";

/**
 * Listing a place, voting on one and discarding an upload. Every export is a
 * public POST endpoint, so each resolves the caller from the session, re-reads
 * their verified status from the database (`getCommunityViewer`), and trusts
 * nothing from the client but the form values and ids. The writes and the
 * rules they apply are in `./mutations` and `./rules`.
 */

import { revalidatePath } from "next/cache";

import { getDb } from "@/lib/db";
import { rateLimit } from "@/lib/security/rate-limit";

import { createPlace, discardOwnUpload, RuleViolation, setVote, type VoteOutcome } from "./mutations";
import { photoIdSchema, placeIdSchema, placeSubmissionSchema } from "./schema";
import { getPhotoStore } from "./storage";
import type { ActionFailure, ActionResult, CommunityViewer } from "./types";
import { getCommunityViewer } from "./viewer";

const fail = (error: string, fieldErrors?: Record<string, string>): ActionFailure => ({ ok: false, error, fieldErrors });

const UNAVAILABLE = fail("Community places are not available on this site right now.");
const BUSY = fail("You are doing that a lot. Wait a moment and try again.");

/** The caller, if they may take part; otherwise the failure to return. */
async function participant(action: string): Promise<CommunityViewer | ActionFailure> {
  const viewer = await getCommunityViewer();
  if (!viewer) return fail(`Sign in to ${action}.`);
  if (viewer.banned) return fail("This account cannot take part in community listings.");
  if (!viewer.emailVerified) return fail(`Verify your email address to ${action}.`);
  return viewer;
}

function isFailure(value: CommunityViewer | ActionFailure): value is ActionFailure {
  return "ok" in value && value.ok === false;
}

/** List a new place. It is seen only by verified users until it is published. */
export async function submitPlace(input: unknown): Promise<ActionResult<{ slug: string }>> {
  const viewer = await participant("add a place");
  if (isFailure(viewer)) return viewer;
  if (!rateLimit("community-submit", viewer.userId, { limit: 10, windowMs: 10 * 60_000 }).ok) return BUSY;

  const parsed = placeSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    return fail("Some of the details need another look.", fieldErrors);
  }

  const db = getDb();
  if (!db) return UNAVAILABLE;

  try {
    const { slug } = await createPlace(db, viewer.userId, parsed.data);
    revalidatePath("/community/verify");
    revalidatePath("/account/places");
    return { ok: true, data: { slug } };
  } catch (err) {
    if (err instanceof RuleViolation) return fail(err.message, err.field ? { [err.field]: err.message } : undefined);
    console.error("[community] submit failed:", (err as Error).message);
    return fail("We could not save this place. Try again in a moment.");
  }
}

/**
 * Set the caller's upvote on a place: `want` true casts it, false withdraws it.
 * Idempotent, so a stale page can never flip a vote the wrong way.
 */
export async function setUpvote(placeId: unknown, want: unknown): Promise<ActionResult<Omit<VoteOutcome, "slug">>> {
  const viewer = await participant("vote");
  if (isFailure(viewer)) return viewer;
  if (!rateLimit("community-vote", viewer.userId, { limit: 60, windowMs: 60_000 }).ok) return BUSY;

  const parsedId = placeIdSchema.safeParse(placeId);
  if (!parsedId.success || typeof want !== "boolean") return fail("That place could not be found.");

  const db = getDb();
  if (!db) return UNAVAILABLE;

  try {
    const { slug, ...outcome } = await setVote(db, parsedId.data, viewer.userId, want);
    revalidatePath("/community/verify");
    revalidatePath(`/community/${slug}`);
    if (outcome.status === "published") {
      revalidatePath("/community");
      revalidatePath("/sitemap.xml");
    }
    return { ok: true, data: outcome };
  } catch (err) {
    if (err instanceof RuleViolation) return fail(err.message);
    console.error("[community] vote failed:", (err as Error).message);
    return fail("Your vote could not be saved. Try again in a moment.");
  }
}

/** Delete one of the caller's own uploads that is not attached to a place yet. */
export async function discardUpload(photoId: unknown): Promise<ActionResult> {
  const viewer = await getCommunityViewer();
  if (!viewer) return fail("Sign in again to manage your photos.");

  const parsedId = photoIdSchema.safeParse(photoId);
  if (!parsedId.success) return fail("That photo could not be found.");

  const db = getDb();
  const store = getPhotoStore();
  if (!db || !store) return UNAVAILABLE;

  try {
    const keys = await discardOwnUpload(db, parsedId.data, viewer.userId);
    if (!keys) return fail("That photo could not be found.");
    await store.delete(keys).catch((err) => {
      console.warn("[community] orphaned photo bytes left in storage:", (err as Error).message);
    });
    return { ok: true };
  } catch (err) {
    console.error("[community] discard failed:", (err as Error).message);
    return fail("That photo could not be removed. Try again in a moment.");
  }
}
