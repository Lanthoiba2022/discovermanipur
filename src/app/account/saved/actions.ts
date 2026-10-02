"use server";

/**
 * The signed-in traveller's saved places, in `public.saved_items`.
 *
 * These are public POST endpoints. Each one resolves the user from the session
 * cookie and touches only that user's rows; there is no row-level security
 * behind the queries, so the `user_id` filter is the only thing keeping one
 * traveller out of another's list. The client sends a `(kind, slug)` reference
 * and nothing else: titles and images are re-read from the catalogue, and a
 * reference to a listing that is not public is refused.
 */

import { and, count, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { ensureProfile } from "@/lib/auth/dal";
import { isAuthConfigured } from "@/lib/auth/env";
import { getServerUser } from "@/lib/auth/server";
import { getDb, schema, type Db } from "@/lib/db";
import { logDbError } from "@/lib/log";
import { rateLimit, type RateLimitRule } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";

import { resolveCards, savedKeyOf } from "./resolve";
import {
  MAX_SAVED_ITEMS,
  savedImportSchema,
  savedRefSchema,
  type SavedItem,
  type SavedListResult,
  type SavedRef,
  type SavedWriteResult,
} from "./schema";

const READ_RATE: RateLimitRule = { limit: 60, windowMs: 60_000 };
const WRITE_RATE: RateLimitRule = { limit: 60, windowMs: 60_000 };
const IMPORT_RATE: RateLimitRule = { limit: 10, windowMs: 60 * 60_000 };

const BUSY = "You are doing that a lot. Wait a moment and try again.";
const SIGNED_OUT = "Sign in again to change your saved places.";
const UNAVAILABLE = "Saved places cannot be stored right now. Try again later.";
const FAILED = "We could not update your saved places. Try again in a moment.";

const savedItems = schema.saved_items;

async function allowed(bucket: string, rule: RateLimitRule) {
  return rateLimit(bucket, clientIp(await headers()), rule).ok;
}

/** Postgres text timestamps ("2026-10-01 09:30:00.123+00") as ISO 8601. */
function toIso(value: string) {
  const date = new Date(value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"));
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

async function listFor(db: Db, userId: string): Promise<SavedItem[]> {
  const rows = await db
    .select({ kind: savedItems.kind, slug: savedItems.slug, createdAt: savedItems.created_at })
    .from(savedItems)
    .where(eq(savedItems.user_id, userId))
    .orderBy(desc(savedItems.created_at))
    .limit(MAX_SAVED_ITEMS);

  const refs: (SavedRef & { createdAt: string })[] = [];
  for (const row of rows) {
    const parsed = savedRefSchema.safeParse(row);
    if (parsed.success) refs.push({ ...parsed.data, createdAt: row.createdAt });
  }

  const cards = await resolveCards(refs);
  const items: SavedItem[] = [];
  for (const ref of refs) {
    const card = cards.get(savedKeyOf(ref));
    if (card) items.push({ ...card, savedAt: toIso(ref.createdAt) });
  }
  return items;
}

/**
 * The signed-in traveller's saved places, newest first. `browser` when this
 * deployment has no database or no one is signed in, so the caller keeps the
 * list in localStorage instead.
 */
export async function listSavedItems(): Promise<SavedListResult> {
  const db = getDb();
  if (!isAuthConfigured || !db) return { storage: "browser" };
  if (!(await allowed("saved-read", READ_RATE))) return { error: BUSY };

  const user = await getServerUser();
  if (!user) return { storage: "browser" };

  try {
    return { storage: "account", items: await listFor(db, user.id) };
  } catch (err) {
    logDbError("saved.list", err);
    return { error: "We could not load your saved places. Try again in a moment." };
  }
}

export async function addSavedItem(input: SavedRef): Promise<SavedWriteResult> {
  if (!(await allowed("saved-write", WRITE_RATE))) return { ok: false, error: BUSY };

  const parsed = savedRefSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That place could not be saved." };
  const ref = parsed.data;

  const user = await getServerUser();
  if (!user) return { ok: false, error: SIGNED_OUT };
  const db = getDb();
  if (!db) return { ok: false, error: UNAVAILABLE };

  try {
    const cards = await resolveCards([ref]);
    if (!cards.has(savedKeyOf(ref))) return { ok: false, error: "That place could not be found." };

    await ensureProfile(user);
    const [{ total }] = await db
      .select({ total: count() })
      .from(savedItems)
      .where(eq(savedItems.user_id, user.id));
    if (total >= MAX_SAVED_ITEMS) {
      return { ok: false, error: "Your saved list is full. Remove a place to make room." };
    }

    await db
      .insert(savedItems)
      .values({ user_id: user.id, kind: ref.kind, slug: ref.slug })
      .onConflictDoNothing();
    return { ok: true };
  } catch (err) {
    logDbError("saved.add", err);
    return { ok: false, error: FAILED };
  }
}

export async function removeSavedItem(input: SavedRef): Promise<SavedWriteResult> {
  if (!(await allowed("saved-write", WRITE_RATE))) return { ok: false, error: BUSY };

  const parsed = savedRefSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: FAILED };
  const ref = parsed.data;

  const user = await getServerUser();
  if (!user) return { ok: false, error: SIGNED_OUT };
  const db = getDb();
  if (!db) return { ok: false, error: UNAVAILABLE };

  try {
    await db
      .delete(savedItems)
      .where(
        and(
          eq(savedItems.user_id, user.id),
          eq(savedItems.kind, ref.kind),
          eq(savedItems.slug, ref.slug),
        ),
      );
    return { ok: true };
  } catch (err) {
    logDbError("saved.remove", err);
    return { ok: false, error: FAILED };
  }
}

export async function clearSavedItems(): Promise<SavedWriteResult> {
  if (!(await allowed("saved-write", WRITE_RATE))) return { ok: false, error: BUSY };

  const user = await getServerUser();
  if (!user) return { ok: false, error: SIGNED_OUT };
  const db = getDb();
  if (!db) return { ok: false, error: UNAVAILABLE };

  try {
    await db.delete(savedItems).where(eq(savedItems.user_id, user.id));
    return { ok: true };
  } catch (err) {
    logDbError("saved.clear", err);
    return { ok: false, error: FAILED };
  }
}

/**
 * Copy a list saved in this browser before sign-in into the account, then
 * return the merged list. Safe to repeat: the `(user_id, kind, slug)` primary
 * key turns a second copy into no-ops. References to listings that are not
 * public are dropped, and the account cap still applies.
 */
export async function importSavedItems(input: unknown): Promise<SavedListResult> {
  if (!(await allowed("saved-import", IMPORT_RATE))) return { error: BUSY };

  const parsed = savedImportSchema.safeParse(input);
  if (!parsed.success) return { error: FAILED };

  const user = await getServerUser();
  if (!user) return { error: SIGNED_OUT };
  const db = getDb();
  if (!db) return { error: UNAVAILABLE };

  try {
    const cards = await resolveCards(parsed.data);
    const now = Date.now();
    const seen = new Set<string>();
    const values = [];
    for (const entry of parsed.data) {
      const key = savedKeyOf(entry);
      if (seen.has(key) || !cards.has(key)) continue;
      seen.add(key);
      const savedAt = entry.savedAt ? Date.parse(entry.savedAt) : NaN;
      values.push({
        user_id: user.id,
        kind: entry.kind,
        slug: entry.slug,
        ...(savedAt <= now ? { created_at: new Date(savedAt).toISOString() } : {}),
      });
    }

    if (values.length > 0) {
      await ensureProfile(user);
      const [{ total }] = await db
        .select({ total: count() })
        .from(savedItems)
        .where(eq(savedItems.user_id, user.id));
      const room = Math.max(0, MAX_SAVED_ITEMS - total);
      if (room > 0) {
        await db.insert(savedItems).values(values.slice(0, room)).onConflictDoNothing();
      }
    }

    return { storage: "account", items: await listFor(db, user.id) };
  } catch (err) {
    logDbError("saved.import", err);
    return { error: FAILED };
  }
}
