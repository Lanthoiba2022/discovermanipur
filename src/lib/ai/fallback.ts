/**
 * What the concierge says when it is not live (no LLM key, or
 * `AI_CHAT_ENABLED` off). It cannot think, but it can still be useful and
 * honest: a friendly "not switched on" turn plus a real, catalogue-backed
 * sample itinerary assembled by the same code the live tool uses.
 */

import { assembleItinerary } from "./tools";
import type { ItineraryResult } from "./schema";

export const NOT_CONFIGURED_MESSAGE = [
  "I'm not switched on yet — the live concierge is off on this site, so I can't think for myself right now.",
  "",
  "Everything else works, though. You can browse [places](/hotspots), [homestays](/homestays), [experiences](/experiences), [places to eat](/eateries) and [tours](/tours) directly, and here is a sample itinerary built from the real Discover Manipur catalogue so you can see what I'd normally put together for you.",
].join("\n");

export const NOT_CONFIGURED_SHORT =
  "I'm not switched on yet — the live concierge is off on this site. Browse [places](/hotspots), [homestays](/homestays) and [tours](/tours) in the meantime.";

/** A grounded sample plan, or `null` when the catalogue is still empty. */
export async function sampleItinerary(days = 3): Promise<ItineraryResult | null> {
  const result = await assembleItinerary({
    days,
    budget: "comfortable",
    interests: ["lake", "heritage", "food"],
    pace: "balanced",
    groupType: "couple",
  });
  const hasContent = result.plan.days.some((d) => d.stops.length > 0);
  return hasContent ? result : null;
}
