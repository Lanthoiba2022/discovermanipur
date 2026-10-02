"use server";

/**
 * The signed-in traveller's saved trip plans, in `public.saved_itineraries`.
 *
 * These are public POST endpoints. Each one resolves the user from the session
 * cookie and reads or writes only rows whose `user_id` is that user; an id
 * from the browser only ever narrows that set. There is no row-level security
 * behind the queries, so the `user_id` filter is the whole ownership check.
 */

import { randomUUID } from "node:crypto";

import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";

import { ensureProfile } from "@/lib/auth/dal";
import { isAuthConfigured } from "@/lib/auth/env";
import { getServerUser } from "@/lib/auth/server";
import { getDb, schema, type Db } from "@/lib/db";
import {
  fromItineraryRow,
  fromItinerarySummaryRow,
  itineraryIdSchema,
  itineraryImportEntrySchema,
  itineraryImportSchema,
  itineraryInputSchema,
  itineraryTitleSchema,
  MAX_ITINERARIES,
  MAX_ITINERARY_BYTES_PER_USER,
  type ItineraryDeleteResult,
  type ItineraryImportResult,
  type ItineraryListResult,
  type ItineraryWriteResult,
  type SavedItinerarySummary,
} from "@/lib/itineraries/schema";
import { logDbError } from "@/lib/log";
import { rateLimit, type RateLimitRule } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";
import type { SavedItinerary } from "@/types";

/**
 * List and single-plan reads share this bucket. 20 a minute is far more than
 * a person opening plans needs, and with the list now sending summaries it
 * caps what one client can pull at a small fraction of the old 60 full lists.
 */
const READ_RATE: RateLimitRule = { limit: 20, windowMs: 60_000 };
const WRITE_RATE: RateLimitRule = { limit: 30, windowMs: 5 * 60_000 };
const IMPORT_RATE: RateLimitRule = { limit: 10, windowMs: 60 * 60_000 };

const BUSY = "You are doing that a lot. Wait a moment and try again.";
const SIGNED_OUT = "Sign in again to manage your saved plans.";
const UNAVAILABLE = "Plans cannot be saved right now. Try again later.";
const FAILED = "We could not update your saved plans. Try again in a moment.";
const NOT_FOUND = "That plan could not be found.";
const TOO_MANY = "You have saved as many plans as we can keep. Delete one to make room.";
const TOO_LARGE = "Your saved plans have used all the space we can keep for one account. Delete a plan you no longer need to make room.";
const EDIT_TOO_LARGE = "This plan has grown too large for the space left on your account. Shorten it, or delete a plan you no longer need, and save again.";

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

/**
 * Day and stop counts, computed in Postgres so the list never ships `days`.
 * Each guards on `jsonb_typeof`, because `jsonb_array_length` and
 * `jsonb_array_elements` raise on a non-array and one malformed row must not
 * fail the whole list. `->` on a non-object element yields NULL, which the
 * inner guard turns into 0. `sum` is bigint, hence the casts to int.
 */
const dayCount = sql<number>`(case when jsonb_typeof(${plans.days}) = 'array' then jsonb_array_length(${plans.days}) else 0 end)::int`;
const stopCount = sql<number>`(case when jsonb_typeof(${plans.days}) = 'array' then coalesce((select sum(case when jsonb_typeof(d.value -> 'stops') = 'array' then jsonb_array_length(d.value -> 'stops') else 0 end) from jsonb_array_elements(${plans.days}) as d(value)), 0) else 0 end)::int`;

/** The cap before it was lowered; see `listFor`. */
const LEGACY_LIST_LIMIT = 100;

/**
 * The account list: summary columns only, never `days` or `notes`. Capped at
 * the larger of the plan cap and the old cap of 100, so an account saved
 * before the cap came down still sees every plan it has.
 */
async function listFor(db: Db, userId: string): Promise<SavedItinerarySummary[]> {
  const rows = await db
    .select({
      id: plans.id,
      user_id: plans.user_id,
      title: plans.title,
      travel_month: plans.travel_month,
      estimated_cost_inr: plans.estimated_cost_inr,
      created_at: plans.created_at,
      day_count: dayCount,
      stop_count: stopCount,
    })
    .from(plans)
    .where(eq(plans.user_id, userId))
    .orderBy(desc(plans.created_at))
    .limit(Math.max(MAX_ITINERARIES, LEGACY_LIST_LIMIT));
  return rows.map(fromItinerarySummaryRow);
}

/**
 * How many plans the user has, and how many bytes they take: the stored
 * (possibly compressed) size of each `days` value plus the length of its
 * notes in bytes. One aggregate over the user's index range.
 */
async function usageFor(db: Db, userId: string) {
  const [row] = await db
    .select({
      total: count(),
      bytes: sql<number>`(coalesce(sum(pg_column_size(${plans.days})), 0) + coalesce(sum(octet_length(${plans.notes})), 0))::bigint`.mapWith(Number),
    })
    .from(plans)
    .where(eq(plans.user_id, userId));
  return { total: row?.total ?? 0, bytes: row?.bytes ?? 0 };
}

/**
 * What a new plan will add to the budget, measured the way the browser sent
 * it (UTF-8 bytes of the `days` JSON and of the notes). Close to, not exactly,
 * what `pg_column_size` reports once it is stored (jsonb has some overhead of
 * its own, and large values are compressed): the budget is a guard rail
 * against runaway accounts, not exact accounting. UTF-8 bytes rather than
 * string length, so a plan written in a non-Latin script (Meitei Mayek,
 * Bengali, Devanagari: three bytes a character) is not undercounted.
 */
function planBytes(plan: { days: unknown; notes?: string | null }): number {
  return Buffer.byteLength(JSON.stringify(plan.days), "utf8") + (plan.notes ? Buffer.byteLength(plan.notes, "utf8") : 0);
}

/**
 * The size of one of the user's existing plans, two ways, or `null` when the
 * id is not theirs:
 *
 * - `stored`: the same measure `usageFor` sums (`pg_column_size` of `days`
 *   plus the notes' bytes), so `usage.bytes - stored` is exactly what every
 *   other plan takes;
 * - `raw`: the text size of `days` plus the notes' bytes, comparable with
 *   `planBytes`. jsonb prints a space after every `:` and `,`, so an unchanged
 *   plan always measures at most this much from the browser.
 */
async function sizeOf(db: Db, userId: string, id: string) {
  const [row] = await db
    .select({
      stored: sql<number>`(pg_column_size(${plans.days}) + coalesce(octet_length(${plans.notes}), 0))::bigint`.mapWith(Number),
      raw: sql<number>`(octet_length(${plans.days}::text) + coalesce(octet_length(${plans.notes}), 0))::bigint`.mapWith(Number),
    })
    .from(plans)
    .where(and(eq(plans.id, id), eq(plans.user_id, userId)))
    .limit(1);
  return row ?? null;
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
    logDbError("itineraries.list", err);
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
    logDbError("itineraries.get", err);
    return null;
  }
}

/**
 * Save a plan. With the `id` of one of the caller's own plans this replaces
 * it; any other id is ignored and a new row is created with a server id.
 *
 * Both paths answer to the byte budget. A replacement is refused only when it
 * makes the plan bigger AND the account would then be over budget, so an
 * account that was already over (saved before the budget existed) can still
 * edit, and shrinking a plan is always allowed. Without this check an update
 * could grow any one plan to the schema maximum, as often as the rate limit
 * allows, whatever the budget said.
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
    const existing = existingId ? await sizeOf(db, user.id, existingId) : null;
    if (existingId && existing) {
      const bytes = planBytes(plan);
      if (bytes > existing.raw) {
        const usage = await usageFor(db, user.id);
        if (usage.bytes - existing.stored + bytes > MAX_ITINERARY_BYTES_PER_USER) {
          return { ok: false, error: EDIT_TOO_LARGE };
        }
      }
      const [updated] = await db
        .update(plans)
        .set({ ...values, updated_at: new Date().toISOString() })
        .where(and(eq(plans.id, existingId), eq(plans.user_id, user.id)))
        .returning();
      if (updated) return { ok: true, row: fromItineraryRow(updated) };
    }

    await ensureProfile(user);
    const usage = await usageFor(db, user.id);
    if (usage.total >= MAX_ITINERARIES) return { ok: false, error: TOO_MANY };
    if (usage.bytes + planBytes(plan) > MAX_ITINERARY_BYTES_PER_USER) return { ok: false, error: TOO_LARGE };
    const [created] = await db
      .insert(plans)
      .values({ ...values, user_id: user.id })
      .returning();
    return { ok: true, row: fromItineraryRow(created) };
  } catch (err) {
    logDbError("itineraries.save", err);
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
    logDbError("itineraries.rename", err);
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
    logDbError("itineraries.delete", err);
    return { ok: false, error: FAILED };
  }
}

/**
 * Copy plans saved in this browser into the account, then return the
 * account's list (summaries, like `listMyItineraries`) and the browser ids of
 * the plans that are now in it (`ItineraryImportResult`), so the client
 * clears exactly those and keeps the rest.
 *
 * A plan keeps its browser id when that id is a UUID, so a repeated import of
 * the same plan is recognised: one the account already holds is reported as
 * imported without being written or counted again. A UUID that belongs to
 * another user's row, and every non-UUID browser id, gets a fresh server id
 * instead (chosen here, so it can be mapped back). Entries that fail
 * validation are left out, and so is everything past the point where either
 * the plan cap or the byte budget would be exceeded: the import keeps the
 * plans in the order the browser sent them until the next one does not fit.
 * Neither kind is reported as imported, so neither is erased from the
 * browser.
 */
export async function importMyItineraries(input: unknown): Promise<ItineraryImportResult> {
  if (!(await allowed("itinerary-import", IMPORT_RATE))) return { error: BUSY };

  const parsed = itineraryImportSchema.safeParse(input);
  if (!parsed.success) return { error: FAILED };

  const ctx = await session();
  if (!ctx.ok) return { error: ctx.error };
  const { db, user } = ctx;

  const now = Date.now();
  const entries = [];
  for (const raw of parsed.data) {
    const entry = itineraryImportEntrySchema.safeParse(raw);
    if (!entry.success) continue;
    const plan = entry.data;
    const createdAt = plan.createdAt ? Date.parse(plan.createdAt) : NaN;
    entries.push({
      browserId: plan.id,
      uuid: itineraryIdSchema.safeParse(plan.id).data,
      value: {
        ...(createdAt <= now ? { created_at: new Date(createdAt).toISOString() } : {}),
        user_id: user.id,
        title: plan.title,
        days: plan.days,
        travel_month: plan.travelMonth ?? null,
        estimated_cost_inr: plan.estimatedCostInr ?? null,
        notes: plan.notes ?? null,
      },
    });
  }

  try {
    const imported: string[] = [];
    let stopped = false;

    if (entries.length > 0) {
      // Who already holds the browser's UUIDs: the caller (an earlier,
      // interrupted import) or someone else (a collision, or a forged id).
      const uuids = entries.flatMap((entry) => (entry.uuid ? [entry.uuid] : []));
      const owners = new Map<string, string>();
      if (uuids.length > 0) {
        const taken = await db
          .select({ id: plans.id, user_id: plans.user_id })
          .from(plans)
          .where(inArray(plans.id, uuids));
        for (const row of taken) owners.set(row.id, row.user_id);
      }

      const pending = [];
      for (const entry of entries) {
        const owner = entry.uuid ? owners.get(entry.uuid) : undefined;
        if (owner === user.id) {
          imported.push(entry.browserId);
          continue;
        }
        const id = entry.uuid && owner === undefined ? entry.uuid : randomUUID();
        pending.push({ browserId: entry.browserId, value: { ...entry.value, id } });
      }

      if (pending.length > 0) {
        await ensureProfile(user);
        const usage = await usageFor(db, user.id);
        let room = Math.max(0, MAX_ITINERARIES - usage.total);
        let budget = MAX_ITINERARY_BYTES_PER_USER - usage.bytes;
        const fitting = [];
        for (const entry of pending) {
          const size = planBytes(entry.value);
          if (room <= 0 || size > budget) {
            stopped = true;
            break;
          }
          fitting.push(entry);
          room -= 1;
          budget -= size;
        }

        if (fitting.length > 0) {
          // A conflict here means another request took the id since the
          // lookup above; that plan is simply not reported, so it stays in
          // the browser and is offered again next time.
          const inserted = await db
            .insert(plans)
            .values(fitting.map((entry) => entry.value))
            .onConflictDoNothing()
            .returning({ id: plans.id });
          const insertedIds = new Set(inserted.map((row) => row.id));
          for (const entry of fitting) if (insertedIds.has(entry.value.id)) imported.push(entry.browserId);
        }
      }
    }

    return { storage: "account", rows: await listFor(db, user.id), imported, stopped };
  } catch (err) {
    logDbError("itineraries.import", err);
    return { error: FAILED };
  }
}
