/**
 * POST /api/chat — the streaming concierge.
 *
 * Nothing here throws at import time. While the concierge is not live (no LLM
 * key, or `AI_CHAT_ENABLED` off) the handler streams a canned, friendly
 * assistant turn plus a real sample itinerary, and never calls a model.
 *
 * Public and backed by a paid model, so every request is rate-limited per IP,
 * size-capped, shape-checked and bounded in output tokens before it can cost
 * anything.
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
import { z } from "zod";

import {
  CONCIERGE_SYSTEM_PROMPT,
  NOT_CONFIGURED_MESSAGE,
  conciergeModel,
  conciergeTools,
  isConciergeLive,
  sampleItinerary,
} from "@/lib/ai";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { clientIp, isSameOrigin, jsonError, readBodyText } from "@/lib/security/request";

export const runtime = "nodejs";
export const maxDuration = 60;

/** A long conversation with several itinerary cards stays well under this. */
const MAX_BODY_BYTES = 256 * 1024;
const MAX_MESSAGES = 100;
/** What one traveller turn may say. The input box is one short message. */
const MAX_USER_TEXT = 2_000;
/** Only the recent turns reach the model, so input cost per call is bounded. */
const CONTEXT_MESSAGES = 30;
/** Replies are ~100 words; the headroom is for Gemini's thinking tokens. */
const MAX_OUTPUT_TOKENS = 2_048;

const RATE = { limit: 20, windowMs: 60_000 };
const RATE_DAILY = { limit: 300, windowMs: 24 * 60 * 60_000 };

/*
 * Only the envelope is checked here: parts are passed through for
 * `convertToModelMessages` to interpret. `role` is the part that matters — a
 * client-sent "system" message would otherwise be handed to the model as a
 * system instruction.
 */
const bodySchema = z.looseObject({
  messages: z
    .array(
      z.looseObject({
        id: z.string().max(200),
        role: z.enum(["user", "assistant"]),
        parts: z.array(z.looseObject({ type: z.string().max(100) })).max(100),
      }),
    )
    .min(1)
    .max(MAX_MESSAGES),
});

function userText(message: { parts: { type: string }[] }) {
  return message.parts.reduce(
    (total, part) =>
      total + (part.type === "text" ? String((part as { text?: unknown }).text ?? "").length : 0),
    0,
  );
}

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
  if (!isSameOrigin(req)) return jsonError(403, "Cross-site requests are not accepted.");

  const ip = clientIp(req.headers);
  for (const [bucket, rule] of [["chat", RATE], ["chat-day", RATE_DAILY]] as const) {
    const verdict = rateLimit(bucket, ip, rule);
    if (!verdict.ok) return tooManyRequests(verdict);
  }

  const raw = await readBodyText(req, MAX_BODY_BYTES);
  if (raw === null) return jsonError(413, "That conversation is too long. Start a new one.");

  let body: z.infer<typeof bodySchema>;
  try {
    const parsed = bodySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return jsonError(400, "Invalid request body.");
    body = parsed.data;
  } catch {
    return jsonError(400, "Invalid request body.");
  }

  const last = body.messages[body.messages.length - 1];
  if (last.role !== "user") return jsonError(400, "Invalid request body.");
  if (body.messages.some((m) => m.role === "user" && userText(m) > MAX_USER_TEXT)) {
    return jsonError(413, `Keep each message under ${MAX_USER_TEXT} characters.`);
  }

  if (!isConciergeLive) {
    return createUIMessageStreamResponse({ stream: cannedStream(NOT_CONFIGURED_MESSAGE, true) });
  }

  // The recent window, starting on a traveller turn so the model never opens
  // on an orphaned assistant reply.
  const recent = body.messages.slice(-CONTEXT_MESSAGES);
  const firstUser = recent.findIndex((m) => m.role === "user");
  const messages = recent.slice(Math.max(0, firstUser)) as unknown as UIMessage[];

  try {
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: conciergeModel(),
      system: CONCIERGE_SYSTEM_PROMPT,
      messages: modelMessages,
      tools: conciergeTools,
      stopWhen: stepCountIs(6),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      abortSignal: req.signal,
    });

    // Failures inside the model call surface *in* the stream, not as a throw,
    // so the catch below never sees them. Log the real cause server-side and
    // hand the UI something a reader can act on.
    return result.toUIMessageStreamResponse({
      onError: (error) => {
        // Message only: SDK errors carry the request body, i.e. the traveller's
        // conversation, which does not belong in logs.
        console.error("[/api/chat] concierge stream failed:", (error as Error)?.message);
        return "I couldn't reach the concierge model just now. Browse [places](/hotspots) and [homestays](/homestays) in the meantime.";
      },
    });
  } catch {
    return createUIMessageStreamResponse({
      stream: cannedStream(
        "Something went wrong on my side just now. Try again in a moment — or browse [places](/hotspots) and [homestays](/homestays) directly while I catch my breath.",
        false,
      ),
    });
  }
}
