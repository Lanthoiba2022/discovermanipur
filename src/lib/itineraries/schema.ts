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

/** Per-account cap on stored plans. */
export const MAX_ITINERARIES = 100;
/** Most plans one browser-to-account import may carry. */
export const MAX_ITINERARY_IMPORT = 50;
/** Ceiling on one plan's `days` JSON, in UTF-16 code units. */
export const MAX_DAYS_JSON = 96_000;

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
 * Where the signed-in traveller's plans live. `browser` means this deployment
 * has no database, so they stay in localStorage as before.
 */
export type ItineraryListResult =
  | { storage: "browser" }
  | { storage: "account"; rows: SavedItinerary[] }
  | { error: string };

export type ItineraryWriteResult =
  | { ok: true; row: SavedItinerary }
  | { ok: false; error: string };

export type ItineraryDeleteResult = { ok: true } | { ok: false; error: string };
