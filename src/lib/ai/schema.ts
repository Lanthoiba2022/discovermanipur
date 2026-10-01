/**
 * Shared contracts for the Discover Manipur AI concierge.
 *
 * This module deliberately imports **nothing** from the data layer or from any
 * server-only package, so that client components can import its types (and the
 * itinerary zod schema) without dragging the catalogue into the browser bundle.
 */

import { z } from "zod";

/* ----------------------------- Tool result cards ----------------------------- */

export const catalogueKinds = [
  "place",
  "stay",
  "experience",
  "eatery",
  "tour",
  "festival",
  "transport",
] as const;

export type CatalogueKind = (typeof catalogueKinds)[number];

/**
 * The compact shape every catalogue tool returns. Never a whole record — just
 * enough for the model to reason about and for the UI to render a linked card.
 */
export interface CatalogueItem {
  kind: CatalogueKind;
  slug: string;
  title: string;
  summary: string;
  href: string;
  price?: string;
  meta?: string;
  image?: string;
}

export interface CatalogueResults {
  kind: "results";
  heading: string;
  count: number;
  items: CatalogueItem[];
  /** Set when nothing matched, so the model can say so honestly. */
  note?: string;
}

/* -------------------------------- Itinerary --------------------------------- */

export const itineraryStopSchema = z.object({
  title: z.string().describe("Name of the stop, exactly as the catalogue spells it."),
  slug: z
    .string()
    .optional()
    .describe("Catalogue slug, only when this stop came from a Discover Manipur listing."),
  href: z
    .string()
    .optional()
    .describe("Site route such as /hotspots/loktak-lake. Omit rather than invent."),
  kind: z.enum(catalogueKinds).optional(),
  timeOfDay: z.enum(["morning", "midday", "afternoon", "evening", "night"]).optional(),
  note: z.string().describe("One or two sentences on what to do here and why it fits."),
});

export const itineraryMealSchema = z.object({
  slot: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  suggestion: z.string(),
  href: z.string().optional(),
});

export const itineraryStaySchema = z.object({
  title: z.string(),
  href: z.string().optional(),
  note: z.string().optional(),
});

export const itineraryDaySchema = z.object({
  day: z.number().int().min(1),
  title: z.string(),
  summary: z.string(),
  stops: z.array(itineraryStopSchema),
  meals: z.array(itineraryMealSchema),
  stay: itineraryStaySchema.optional(),
  travelNotes: z.string().optional().describe("How you move between the stops, and how long it takes."),
  estimatedCostInr: z.number().optional().describe("Rough per-person cost for the day, in rupees."),
});

export const itinerarySchema = z.object({
  title: z.string(),
  overview: z.string(),
  travelMonth: z.string().optional(),
  pace: z.string().optional(),
  groupType: z.string().optional(),
  days: z.array(itineraryDaySchema).min(1),
  totalEstimatedCostInr: z.number().optional(),
  packingNotes: z.array(z.string()).optional(),
  permitsAndSafety: z
    .array(z.string())
    .optional()
    .describe("Permits, registration and safety reminders — always tell people to verify officially."),
});

export type ItineraryStop = z.infer<typeof itineraryStopSchema>;
export type ItineraryDay = z.infer<typeof itineraryDaySchema>;
export type ItineraryPlan = z.infer<typeof itinerarySchema>;

export interface ItineraryResult {
  kind: "itinerary";
  plan: ItineraryPlan;
  note?: string;
}

/* ------------------------------- Booking quote ------------------------------- */

export const bookingQuoteKinds = ["tour", "homestay", "experience", "transport", "table"] as const;

export type BookingQuoteKind = (typeof bookingQuoteKinds)[number];

/** One row of a price breakdown, e.g. "3 nights × ₹1,200" or "Service fee". */
export interface BookingQuoteLine {
  label: string;
  amountInr: number;
}

/**
 * What the `quoteBooking` tool returns. The client renders this as a card with
 * a "Save request" button that writes the request through the usual booking
 * store (no payment is taken online — the site books enquiries, not tickets).
 */
export interface BookingQuoteResult {
  kind: "booking-quote";
  /** False when the listing was not found or the dates are incomplete. */
  ok: boolean;
  /** Maps directly to `BookingKind` in the domain types. */
  quoteKind: BookingQuoteKind;
  refId: string;
  refTitle: string;
  href: string;
  startDate: string;
  endDate?: string;
  guests: number;
  lineItems: BookingQuoteLine[];
  totalInr: number;
  /** What the model should say aloud; the card also renders it. */
  note?: string;
}

export type ConciergeToolOutput = CatalogueResults | ItineraryResult | BookingQuoteResult;

/* --------------------------- Itinerary request input -------------------------- */

export const budgetLevels = ["budget", "comfortable", "premium"] as const;
export const paces = ["relaxed", "balanced", "packed"] as const;
export const groupTypes = ["solo", "couple", "family", "friends", "group"] as const;

export type BudgetLevel = (typeof budgetLevels)[number];
export type Pace = (typeof paces)[number];
export type GroupType = (typeof groupTypes)[number];

/**
 * The public `/api/itinerary` body. Every free-text field is capped because it
 * is pasted into a paid model prompt: the caps bound the cost of one request
 * and the room a caller has for prompt injection.
 */
export const itineraryRequestSchema = z.strictObject({
  days: z.number().int().min(1).max(21).default(4),
  budget: z.enum(budgetLevels).default("comfortable"),
  interests: z.array(z.string().trim().max(40)).max(12).default([]),
  travelMonth: z.string().trim().max(20).optional(),
  pace: z.enum(paces).default("balanced"),
  groupType: z.enum(groupTypes).default("couple"),
  accessibilityNeeds: z.string().trim().max(300).optional(),
  totalBudgetInr: z
    .number()
    .int()
    .positive()
    .max(10_000_000)
    .optional()
    .describe("Total per-person budget in rupees."),
  notes: z.string().trim().max(1000).optional(),
});

export type ItineraryRequest = z.infer<typeof itineraryRequestSchema>;

/* --------------------------------- Guards ----------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isCatalogueResults(value: unknown): value is CatalogueResults {
  return isRecord(value) && value.kind === "results" && Array.isArray(value.items);
}

export function isItineraryResult(value: unknown): value is ItineraryResult {
  return (
    isRecord(value) &&
    value.kind === "itinerary" &&
    isRecord(value.plan) &&
    Array.isArray((value.plan as Record<string, unknown>).days)
  );
}

export function isBookingQuote(value: unknown): value is BookingQuoteResult {
  return (
    isRecord(value) &&
    value.kind === "booking-quote" &&
    typeof value.ok === "boolean" &&
    typeof value.refId === "string" &&
    typeof value.refTitle === "string" &&
    typeof value.href === "string" &&
    typeof value.startDate === "string" &&
    Array.isArray(value.lineItems) &&
    typeof value.totalInr === "number"
  );
}
