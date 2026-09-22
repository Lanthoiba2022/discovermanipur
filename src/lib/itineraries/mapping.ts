/**
 * Translation between the concierge's generated plan (`ItineraryPlan`) and the
 * stored row (`SavedItinerary`, the domain contract in `src/types`).
 *
 * `SavedItinerary` is the narrower shape, so the extras the model produces —
 * the overview, packing list and permit reminders — are folded into `notes`
 * under stable headings and read back out again. Both directions are pure.
 */

import type { SavedItinerary, SavedItineraryDay, SavedItineraryStop } from "@/types";
import type { ItineraryPlan } from "@/lib/ai/schema";

import type { SaveItineraryInput } from "./store";

const PACK_HEADING = "Pack:";
const SAFETY_HEADING = "Permits & safety:";

function bulletBlock(heading: string, items: string[]): string {
  return [heading, ...items.map((item) => `- ${item}`)].join("\n");
}

function composeNotes(plan: ItineraryPlan): string {
  const blocks = [plan.overview.trim()];
  if (plan.packingNotes?.length) blocks.push(bulletBlock(PACK_HEADING, plan.packingNotes));
  if (plan.permitsAndSafety?.length) blocks.push(bulletBlock(SAFETY_HEADING, plan.permitsAndSafety));
  return blocks.filter(Boolean).join("\n\n");
}

function parseNotes(notes: string | undefined) {
  const blocks = (notes ?? "").split("\n\n");
  const overview: string[] = [];
  const packingNotes: string[] = [];
  const permitsAndSafety: string[] = [];

  for (const block of blocks) {
    const [first, ...rest] = block.split("\n");
    const bullets = rest.map((line) => line.replace(/^-\s*/, "").trim()).filter(Boolean);
    if (first === PACK_HEADING) packingNotes.push(...bullets);
    else if (first === SAFETY_HEADING) permitsAndSafety.push(...bullets);
    else overview.push(block);
  }

  return {
    overview: overview.join("\n\n").trim(),
    packingNotes: packingNotes.length ? packingNotes : undefined,
    permitsAndSafety: permitsAndSafety.length ? permitsAndSafety : undefined,
  };
}

function toStop(stop: ItineraryPlan["days"][number]["stops"][number]): SavedItineraryStop {
  return {
    title: stop.title,
    slug: stop.slug,
    href: stop.href,
    note: stop.timeOfDay ? `${stop.timeOfDay} — ${stop.note}` : stop.note,
  };
}

function toDay(day: ItineraryPlan["days"][number]): SavedItineraryDay {
  const summary = day.travelNotes
    ? `${day.summary} Getting around: ${day.travelNotes}`
    : day.summary;

  return {
    day: day.day,
    title: day.title,
    summary,
    stops: day.stops.map(toStop),
    meals: day.meals.map((meal) => `${meal.slot}: ${meal.suggestion}`),
    stay: day.stay ? [day.stay.title, day.stay.note].filter(Boolean).join(" — ") : undefined,
  };
}

/** What the "Save this plan" button hands to `saveItinerary`. */
export function planToSavedInput(plan: ItineraryPlan, userId: string): SaveItineraryInput {
  return {
    userId,
    title: plan.title,
    days: plan.days.map(toDay),
    travelMonth: plan.travelMonth,
    estimatedCostInr: plan.totalEstimatedCostInr,
    notes: composeNotes(plan),
  };
}

const MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;
type MealSlot = (typeof MEAL_SLOTS)[number];

function toMeal(meal: string): { slot: MealSlot; suggestion: string } {
  const index = meal.indexOf(": ");
  const head = index > 0 ? meal.slice(0, index) : "";
  const slot = MEAL_SLOTS.find((candidate) => candidate === head);
  return slot
    ? { slot, suggestion: meal.slice(index + 2) }
    : { slot: "lunch", suggestion: meal };
}

/**
 * Back to the plan shape so the account page can reuse the concierge's
 * `ItineraryTimeline` rendering rather than growing a second one.
 */
export function savedToPlan(row: SavedItinerary): ItineraryPlan {
  const { overview, packingNotes, permitsAndSafety } = parseNotes(row.notes);

  return {
    title: row.title,
    overview,
    travelMonth: row.travelMonth,
    days: row.days.map((day) => ({
      day: day.day,
      title: day.title,
      summary: day.summary,
      stops: day.stops.map((stop) => ({
        title: stop.title,
        slug: stop.slug,
        href: stop.href,
        note: stop.note ?? "",
      })),
      meals: day.meals.map(toMeal),
      stay: day.stay ? { title: day.stay } : undefined,
    })),
    totalEstimatedCostInr: row.estimatedCostInr,
    packingNotes,
    permitsAndSafety,
  };
}
