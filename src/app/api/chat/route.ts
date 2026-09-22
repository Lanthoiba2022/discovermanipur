/**
 * POST /api/chat — the streaming concierge.
 *
 * Nothing here throws at import time. Without `ANTHROPIC_API_KEY` the handler
 * streams a canned, friendly assistant turn (plus a real sample itinerary) so
 * the interface behaves identically and the demo is never dead.
 */

import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
  type UIMessageChunk,
} from "ai";

import {
  CONCIERGE_SYSTEM_PROMPT,
  NOT_CONFIGURED_MESSAGE,
  conciergeModel,
  conciergeTools,
  isAIConfigured,
  sampleItinerary,
} from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Emits a complete assistant turn as a UI message stream, with no model call. */
function cannedStream(text: string, withSample: boolean): ReadableStream<UIMessageChunk> {
  return createUIMessageStream<UIMessage>({
    execute: async ({ writer }) => {
      const id = "fallback-text";
      writer.write({ type: "text-start", id });
      // Chunked so the UI's typing rhythm looks the same as a real stream.
      for (const chunk of text.match(/[\s\S]{1,48}/g) ?? [text]) {
        writer.write({ type: "text-delta", id, delta: chunk });
      }
      writer.write({ type: "text-end", id });

      if (!withSample) return;

      const sample = await sampleItinerary(3);
      if (!sample) return;

      const toolCallId = "fallback-itinerary";
      writer.write({
        type: "tool-input-available",
        toolCallId,
        toolName: "buildItinerary",
        input: { days: 3, budget: "comfortable", pace: "balanced", groupType: "couple" },
      });
      writer.write({ type: "tool-output-available", toolCallId, output: sample });
    },
    onError: () => "Something went wrong building the sample itinerary.",
  });
}

export async function POST(req: Request) {
  let messages: UIMessage[] = [];

  try {
    const body: unknown = await req.json();
    if (body && typeof body === "object" && Array.isArray((body as { messages?: unknown }).messages)) {
      messages = (body as { messages: UIMessage[] }).messages;
    }
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isAIConfigured) {
    return createUIMessageStreamResponse({ stream: cannedStream(NOT_CONFIGURED_MESSAGE, true) });
  }

  try {
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: conciergeModel(),
      system: CONCIERGE_SYSTEM_PROMPT,
      messages: modelMessages,
      tools: conciergeTools,
      stopWhen: stepCountIs(6),
    });

    return result.toUIMessageStreamResponse();
  } catch {
    return createUIMessageStreamResponse({
      stream: cannedStream(
        "Something went wrong on my side just now. Try again in a moment — or browse [places](/hotspots) and [homestays](/homestays) directly while I catch my breath.",
        false,
      ),
    });
  }
}
