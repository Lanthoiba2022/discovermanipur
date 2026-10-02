/**
 * Validation and row mapping for `public.saved_itineraries`, shared by the
 * Server Actions and the client store. Pure: no database, no session.
 *
 * `days` is a JSON blob the browser sends, so every array and string in it is
 * capped, and the whole blob is capped again by serialised size.
 */

import { z } from "zod";

import type { SavedItinerary, SavedItineraryDay } from "@/types";

import type { schema } from "@/lib/db";

/**
 * Per-account cap on stored plans. Enforced on new rows only: an account
 * already above it keeps every plan it has, and can still edit, rename and
 * delete them.
 */
export const MAX_ITINERARIES = 30;
/** Most plans one browser-to-account import may carry. */
export const MAX_ITINERARY_IMPORT = 30;
/**
 * Ceiling on one plan's `days` JSON, in UTF-16 code units. Kept generous on
 * purpose: concierge plans have no length limit of their own, and a plan the
 * traveller was shown must stay saveable.
 */
export const MAX_DAYS_JSON = 96_000;
/**
 * Per-account storage budget, in bytes: the stored size of every plan's
 * `days` plus its notes. About 1.5 MB, which is dozens of long plans, and
 * keeps a few busy (or hostile) accounts from filling the database. Checked
 * before each new row; like the count cap it never removes existing plans.
 */
export const MAX_ITINERARY_BYTES_PER_USER = 1_500_000;

const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  text(max)
    .optional()
    .transform((value) => value || undefined);

/** Only site-relative links survive; anything else is dropped, not rejected. */
const siteHref = z
  .string()
  .trim()
  .max(300)
  .refine((value) => value.startsWith("/") && !value.startsWith("//") && !/\s/.test(value))
  .optional()
  .catch(undefined);

const stopSchema = z.object({
  title: text(200).min(1),
  slug: optionalText(120),
  href: siteHref,
  note: optionalText(1_500),
});

const daySchema = z.object({
  day: z.number().int().min(1).max(60),
  title: text(200),
  summary: text(3_000),
  stops: z.array(stopSchema).max(30),
  meals: z.array(text(500)).max(12).default([]),
  stay: optionalText(500),
});

const costSchema = z
  .number()
  .optional()
  .transform((value) =>
    value === undefined || !Number.isFinite(value) || value < 0 || value > 100_000_000
      ? undefined
      : Math.round(value),
  );

export const itineraryTitleSchema = text(200).min(1);

const itineraryFields = z.object({
  title: itineraryTitleSchema,
  days: z.array(daySchema).min(1).max(31),
  travelMonth: optionalText(40),
  estimatedCostInr: costSchema,
  notes: optionalText(10_000),
});

const fitsSize = (value: { days: unknown }) => JSON.stringify(value.days).length <= MAX_DAYS_JSON;

export const itineraryInputSchema = itineraryFields.refine(fitsSize);

export type ItineraryInput = z.output<typeof itineraryInputSchema>;

export const itineraryIdSchema = z.uuid();

/** One plan from this browser's localStorage, keeping its id and date. */
export const itineraryImportEntrySchema = itineraryFields
  .extend({
    id: z.string().max(80),
    createdAt: z.iso.datetime({ offset: true }).optional().catch(undefined),
  })
  .refine(fitsSize);

export const itineraryImportSchema = z.array(z.unknown()).max(MAX_ITINERARY_IMPORT);

type ItineraryRow = typeof schema.saved_itineraries.$inferSelect;

/** Postgres text timestamps ("2026-10-01 09:30:00.123+00") as ISO 8601. */
function toIso(value: string) {
  const date = new Date(value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"));
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function fromItineraryRow(row: ItineraryRow): SavedItinerary {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    days: Array.isArray(row.days) ? (row.days as SavedItineraryDay[]) : [],
    travelMonth: row.travel_month ?? undefined,
    estimatedCostInr: row.estimated_cost_inr ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: toIso(row.created_at),
  };
}

/**
 * One plan as the account list carries it: everything the list shows, without
 * the two large fields (`days`, `notes`). The list used to send every plan in
 * full, up to about 100 KB each, every time a list mounted; the full plan is
 * now read one row at a time (`getMyItinerary`) when it is opened or copied.
 */
export interface SavedItinerarySummary extends Omit<SavedItinerary, "days" | "notes"> {
  /** Days in the plan. */
  dayCount: number;
  /** Stops across all of its days. */
  stopCount: number;
}

/**
 * What a saved-plans list holds: summaries for account plans, full rows for
 * plans kept in this browser (they are already local, so nothing is saved by
 * trimming them).
 */
export type SavedItineraryListItem = SavedItinerary | SavedItinerarySummary;

/** True when the list item carries the whole plan. */
export function isFullItinerary(item: SavedItineraryListItem): item is SavedItinerary {
  return "days" in item && Array.isArray(item.days);
}

/** Day count of a full plan or a summary. */
export function dayCountOf(item: SavedItineraryListItem): number {
  return isFullItinerary(item) ? item.days.length : item.dayCount;
}

/** Stop count of a full plan or a summary. */
export function stopCountOf(item: SavedItineraryListItem): number {
  return isFullItinerary(item)
    ? item.days.reduce((total, day) => total + (Array.isArray(day.stops) ? day.stops.length : 0), 0)
    : item.stopCount;
}

/** The summary of a full plan, e.g. the row a save or rename returns. */
export function summarizeItinerary(row: SavedItinerary): SavedItinerarySummary {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    travelMonth: row.travelMonth,
    estimatedCostInr: row.estimatedCostInr,
    createdAt: row.createdAt,
    dayCount: dayCountOf(row),
    stopCount: stopCountOf(row),
  };
}

/** The columns `listFor` selects (see `@/app/account/itineraries/actions`). */
export interface ItinerarySummaryRow {
  id: string;
  user_id: string;
  title: string;
  travel_month: string | null;
  estimated_cost_inr: number | null;
  created_at: string;
  day_count: number;
  stop_count: number;
}

export function fromItinerarySummaryRow(row: ItinerarySummaryRow): SavedItinerarySummary {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    travelMonth: row.travel_month ?? undefined,
    estimatedCostInr: row.estimated_cost_inr ?? undefined,
    createdAt: toIso(row.created_at),
    dayCount: Number(row.day_count) || 0,
    stopCount: Number(row.stop_count) || 0,
  };
}

/**
 * Where the signed-in traveller's plans live. `browser` means this deployment
 * has no database, so they stay in localStorage as before. Account rows are
 * summaries; open one with `getMyItinerary`.
 */
export type ItineraryListResult =
  | { storage: "browser" }
  | { storage: "account"; rows: SavedItinerarySummary[] }
  | { error: string };

/**
 * What a browser-to-account import answers. `imported` lists the BROWSER ids
 * (as sent) of the plans that are now in the account, whether this call
 * inserted them or an earlier, interrupted one already had. The client clears
 * exactly those from localStorage and keeps the rest: entries that failed
 * validation, and everything the plan cap or byte budget refused. `stopped`
 * is true when the cap or budget refused something, so the client need not
 * send its remaining batches.
 */
export type ItineraryImportResult =
  | { storage: "account"; rows: SavedItinerarySummary[]; imported: string[]; stopped: boolean }
  | { error: string };

export type ItineraryWriteResult =
  | { ok: true; row: SavedItinerary }
  | { ok: false; error: string };

export type ItineraryDeleteResult = { ok: true } | { ok: false; error: string };
