/**
 * POST /api/itinerary — a structured, day-by-day plan.
 *
 * Returns `{ configured, plan, note? }`. Without `ANTHROPIC_API_KEY` it still
 * returns a real plan, assembled deterministically from the catalogue.
 */

import { generateObject } from "ai";

import {
  assembleItinerary,
  conciergeModel,
  isAIConfigured,
  itineraryRequestSchema,
  itinerarySchema,
  itinerarySystemPrompt,
} from "@/lib/ai";
import { catalogueDigest } from "@/lib/ai/catalogue";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = itineraryRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "Tell me at least how many days you have.", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const input = parsed.data;

  if (!isAIConfigured) {
    const fallback = await assembleItinerary(input);
    return Response.json({
      configured: false,
      note:
        "AI is not configured on this deployment yet, so this plan was assembled straight from the Manipur Tourism catalogue rather than written for you.",
      plan: fallback.plan,
    });
  }

  try {
    const digest = await catalogueDigest();

    const result = await generateObject({
      model: conciergeModel(),
      schema: itinerarySchema,
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
        "## Manipur Tourism catalogue — the only listings you may use",
        digest,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    return Response.json({ configured: true, plan: result.object });
  } catch {
    const fallback = await assembleItinerary(input);
    return Response.json({
      configured: true,
      note: "I couldn't reach the planner just now, so this is a catalogue-assembled plan. Try again in a moment.",
      plan: fallback.plan,
    });
  }
}
