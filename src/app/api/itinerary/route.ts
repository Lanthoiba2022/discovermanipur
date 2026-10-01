/**
 * POST /api/itinerary: a structured, day-by-day plan.
 *
 * Returns `{ configured, plan, note? }`. While the concierge is not live (see
 * `isConciergeLive`) it still returns a real plan, assembled deterministically
 * from the catalogue, without calling a model.
 *
 * Public and backed by a paid model: rate-limited per IP, body-capped, and
 * every free-text field is length-capped by `itineraryRequestSchema`.
 */

import { generateObject } from "ai";

import {
  assembleItinerary,
  conciergeModel,
  isConciergeLive,
  itineraryRequestSchema,
  itinerarySchema,
  itinerarySystemPrompt,
} from "@/lib/ai";
import { catalogueDigest } from "@/lib/ai/catalogue";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { clientIp, isSameOrigin, jsonError, readBodyText } from "@/lib/security/request";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY_BYTES = 8 * 1024;
/** A 21-day plan as JSON fits comfortably; this stops a runaway generation. */
const MAX_OUTPUT_TOKENS = 8_192;

const RATE = { limit: 5, windowMs: 60_000 };
const RATE_DAILY = { limit: 50, windowMs: 24 * 60 * 60_000 };

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "Cross-site requests are not accepted.");

  const ip = clientIp(req.headers);
  for (const [bucket, rule] of [["itinerary", RATE], ["itinerary-day", RATE_DAILY]] as const) {
    const verdict = rateLimit(bucket, ip, rule);
    if (!verdict.ok) return tooManyRequests(verdict);
  }

  const text = await readBodyText(req, MAX_BODY_BYTES);
  if (text === null) return jsonError(413, "That request is too large.");

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return jsonError(400, "Invalid request body.");
  }

  const parsed = itineraryRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(422, "Tell me at least how many days you have, and keep notes short.");
  }

  const input = parsed.data;

  if (!isConciergeLive) {
    const fallback = await assembleItinerary(input);
    return Response.json({
      configured: false,
      note:
        "The AI planner is off on this site right now, so this plan was assembled straight from the Discover Manipur catalogue rather than written for you.",
      plan: fallback.plan,
    });
  }

  try {
    const digest = await catalogueDigest();

    const result = await generateObject({
      model: conciergeModel(),
      schema: itinerarySchema,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      abortSignal: req.signal,
      system: itinerarySystemPrompt(),
      prompt: [
        "## Traveller",
        `Days: ${input.days}`,
        `Budget: ${input.budget}`,
        input.totalBudgetInr ? `Total budget per person: ₹${input.totalBudgetInr}` : "",
        `Pace: ${input.pace}`,
        `Group: ${input.groupType}`,
        input.travelMonth ? `Travel month: ${input.travelMonth}` : "Travel month: not given",
        input.interests.length ? `Interests: ${input.interests.join(", ")}` : "Interests: open to anything",
        input.accessibilityNeeds ? `Accessibility needs: ${input.accessibilityNeeds}` : "Accessibility needs: none stated",
        input.notes ? `Extra notes: ${input.notes}` : "",
        "",
        "## Discover Manipur catalogue: the only listings you may use",
        digest,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    return Response.json({ configured: true, plan: result.object });
  } catch (error) {
    console.error("[/api/itinerary] planner failed:", (error as Error)?.message);
    const fallback = await assembleItinerary(input);
    return Response.json({
      configured: true,
      note: "I couldn't reach the planner just now, so this is a catalogue-assembled plan. Try again in a moment.",
      plan: fallback.plan,
    });
  }
}
