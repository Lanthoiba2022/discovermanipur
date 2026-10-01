"use server";

/**
 * The signed-in traveller's saved trip plans, in `public.saved_itineraries`.
 *
 * These are public POST endpoints. Each one resolves the user from the session
 * cookie and reads or writes only rows whose `user_id` is that user; an id
 * from the browser only ever narrows that set. There is no row-level security
 * behind the queries, so the `user_id` filter is the whole ownership check.
 */

import { and, count, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { ensureProfile } from "@/lib/auth/dal";
import { isAuthConfigured } from "@/lib/auth/env";
import { getServerUser } from "@/lib/auth/server";
import { getDb, schema, type Db } from "@/lib/db";
import {
  fromItineraryRow,
  itineraryIdSchema,
  itineraryImportEntrySchema,
  itineraryImportSchema,
  itineraryInputSchema,
  itineraryTitleSchema,
  MAX_ITINERARIES,
  type ItineraryDeleteResult,
  type ItineraryListResult,
  type ItineraryWriteResult,
} from "@/lib/itineraries/schema";
import { rateLimit, type RateLimitRule } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";
import type { SavedItinerary } from "@/types";

const READ_RATE: RateLimitRule = { limit: 60, windowMs: 60_000 };
const WRITE_RATE: RateLimitRule = { limit: 30, windowMs: 5 * 60_000 };
const IMPORT_RATE: RateLimitRule = { limit: 10, windowMs: 60 * 60_000 };

const BUSY = "You are doing that a lot. Wait a moment and try again.";
const SIGNED_OUT = "Sign in again to manage your saved plans.";
const UNAVAILABLE = "Plans cannot be saved right now. Try again later.";
const FAILED = "We could not update your saved plans. Try again in a moment.";
const NOT_FOUND = "That plan could not be found.";

const plans = schema.saved_itineraries;

async function allowed(bucket: string, rule: RateLimitRule) {
  return rateLimit(bucket, clientIp(await headers()), rule).ok;
}

async function session() {
  const user = await getServerUser();
  if (!user) return { ok: false, error: SIGNED_OUT } as const;
  const db = getDb();
  if (!db) return { ok: false, error: UNAVAILABLE } as const;
  return { ok: true, user, db } as const;
}

async function listFor(db: Db, userId: string): Promise<SavedItinerary[]> {
  const rows = await db
    .select()
    .from(plans)
    .where(eq(plans.user_id, userId))
    .orderBy(desc(plans.created_at))
    .limit(MAX_ITINERARIES);
  return rows.map(fromItineraryRow);
}

async function countFor(db: Db, userId: string) {
  const [{ total }] = await db.select({ total: count() }).from(plans).where(eq(plans.user_id, userId));
  return total;
}

/**
 * The signed-in traveller's plans, newest first. `browser` when this
 * deployment has no database, so the caller keeps them in localStorage.
 */
export async function listMyItineraries(): Promise<ItineraryListResult> {
  const db = getDb();
  if (!isAuthConfigured || !db) return { storage: "browser" };
  if (!(await allowed("itinerary-read", READ_RATE))) return { error: BUSY };

  const user = await getServerUser();
  if (!user) return { error: SIGNED_OUT };

  try {
    return { storage: "account", rows: await listFor(db, user.id) };
  } catch (err) {
    console.error("[itineraries] list failed:", err);
    return { error: "We could not load your saved plans. Try again in a moment." };
  }
}

export async function getMyItinerary(id: string): Promise<SavedItinerary | null> {
  if (!(await allowed("itinerary-read", READ_RATE))) return null;
  const parsedId = itineraryIdSchema.safeParse(id);
  if (!parsedId.success) return null;

  const ctx = await session();
  if (!ctx.ok) return null;

  try {
    const [row] = await ctx.db
      .select()
      .from(plans)
      .where(and(eq(plans.id, parsedId.data), eq(plans.user_id, ctx.user.id)))
      .limit(1);
    return row ? fromItineraryRow(row) : null;
  } catch (err) {
    console.error("[itineraries] get failed:", err);
    return null;
  }
}

/**
 * Save a plan. With the `id` of one of the caller's own plans this replaces
 * it; any other id is ignored and a new row is created with a server id.
 */
export async function saveMyItinerary(input: unknown, id?: string): Promise<ItineraryWriteResult> {
  if (!(await allowed("itinerary-write", WRITE_RATE))) return { ok: false, error: BUSY };

  const parsed = itineraryInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That plan could not be saved." };
  const plan = parsed.data;
  const existingId = id === undefined ? undefined : itineraryIdSchema.safeParse(id).data;

  const ctx = await session();
  if (!ctx.ok) return { ok: false, error: ctx.error };
  const { db, user } = ctx;

  const values = {
    title: plan.title,
    days: plan.days,
    travel_month: plan.travelMonth ?? null,
    estimated_cost_inr: plan.estimatedCostInr ?? null,
    notes: plan.notes ?? null,
  };

  try {
    if (existingId) {
      const [updated] = await db
        .update(plans)
        .set({ ...values, updated_at: new Date().toISOString() })
        .where(and(eq(plans.id, existingId), eq(plans.user_id, user.id)))
        .returning();
      if (updated) return { ok: true, row: fromItineraryRow(updated) };
    }

    await ensureProfile(user);
    if ((await countFor(db, user.id)) >= MAX_ITINERARIES) {
      return { ok: false, error: "You have saved as many plans as we can keep. Delete one to make room." };
    }
    const [created] = await db
      .insert(plans)
      .values({ ...values, user_id: user.id })
      .returning();
    return { ok: true, row: fromItineraryRow(created) };
  } catch (err) {
    console.error("[itineraries] save failed:", err);
    return { ok: false, error: FAILED };
  }
}

export async function renameMyItinerary(id: string, title: string): Promise<ItineraryWriteResult> {
  if (!(await allowed("itinerary-write", WRITE_RATE))) return { ok: false, error: BUSY };

  const parsedId = itineraryIdSchema.safeParse(id);
  const parsedTitle = itineraryTitleSchema.safeParse(title);
  if (!parsedId.success) return { ok: false, error: NOT_FOUND };
  if (!parsedTitle.success) return { ok: false, error: "Give the plan a name of up to 200 characters." };

  const ctx = await session();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  try {
    const [row] = await ctx.db
      .update(plans)
      .set({ title: parsedTitle.data, updated_at: new Date().toISOString() })
      .where(and(eq(plans.id, parsedId.data), eq(plans.user_id, ctx.user.id)))
      .returning();
    return row ? { ok: true, row: fromItineraryRow(row) } : { ok: false, error: NOT_FOUND };
  } catch (err) {
    console.error("[itineraries] rename failed:", err);
    return { ok: false, error: FAILED };
  }
}

export async function deleteMyItinerary(id: string): Promise<ItineraryDeleteResult> {
  if (!(await allowed("itinerary-write", WRITE_RATE))) return { ok: false, error: BUSY };

  const parsedId = itineraryIdSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: NOT_FOUND };

  const ctx = await session();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  try {
    const deleted = await ctx.db
      .delete(plans)
      .where(and(eq(plans.id, parsedId.data), eq(plans.user_id, ctx.user.id)))
      .returning({ id: plans.id });
    return deleted.length > 0 ? { ok: true } : { ok: false, error: NOT_FOUND };
  } catch (err) {
    console.error("[itineraries] delete failed:", err);
    return { ok: false, error: FAILED };
  }
}

/**
 * Copy plans saved in this browser into the account, then return the
 * account's list. A plan keeps its browser id when that id is a UUID, so a
 * repeated import of the same plan is a no-op; an id already taken by any
 * other row is likewise skipped. Entries that fail validation are dropped.
 */
export async function importMyItineraries(input: unknown): Promise<ItineraryListResult> {
  if (!(await allowed("itinerary-import", IMPORT_RATE))) return { error: BUSY };

  const parsed = itineraryImportSchema.safeParse(input);
  if (!parsed.success) return { error: FAILED };

  const ctx = await session();
  if (!ctx.ok) return { error: ctx.error };
  const { db, user } = ctx;

  const now = Date.now();
  const values = [];
  for (const raw of parsed.data) {
    const entry = itineraryImportEntrySchema.safeParse(raw);
    if (!entry.success) continue;
    const plan = entry.data;
    const id = itineraryIdSchema.safeParse(plan.id).data;
    const createdAt = plan.createdAt ? Date.parse(plan.createdAt) : NaN;
    values.push({
      ...(id ? { id } : {}),
      ...(createdAt <= now ? { created_at: new Date(createdAt).toISOString() } : {}),
      user_id: user.id,
      title: plan.title,
      days: plan.days,
      travel_month: plan.travelMonth ?? null,
      estimated_cost_inr: plan.estimatedCostInr ?? null,
      notes: plan.notes ?? null,
    });
  }

  try {
    if (values.length > 0) {
      await ensureProfile(user);
      const room = Math.max(0, MAX_ITINERARIES - (await countFor(db, user.id)));
      if (room > 0) await db.insert(plans).values(values.slice(0, room)).onConflictDoNothing();
    }
    return { storage: "account", rows: await listFor(db, user.id) };
  } catch (err) {
    console.error("[itineraries] import failed:", err);
    return { error: FAILED };
  }
}
