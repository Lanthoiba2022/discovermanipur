/**
 * POST /api/chat: the streaming concierge.
 *
 * Nothing here throws at import time. While the concierge is not live (no LLM
 * key, or `AI_CHAT_ENABLED` off) the handler streams a canned, friendly
 * assistant turn plus a real sample itinerary, and never calls a model.
 *
 * Public and backed by a paid model, so every request is rate-limited per IP,
 * size-capped, shape-checked and bounded in output tokens before it can cost
 * anything.
 *
 * The conversation the model sees is rebuilt here from the client's messages,
 * never passed through (see `rebuildConversation`): text only, capped per
 * message and per window. A forged body can no longer smuggle file parts
 * (which the SDK would download server-side, up to 2 GiB each), invented tool
 * results or tens of thousands of characters of "assistant" text into a paid
 * model call.
 */

import {
  DownloadError,
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
/**
 * Most assistant text kept from one earlier reply. Real replies are ~100
 * words (well under 1,000 characters); the cap only bites on forged ones.
 */
const MAX_ASSISTANT_TEXT = 4_000;
/** Most text, user and assistant together, across the window sent to the model. */
const MAX_CONTEXT_TEXT = 24_000;
/** Replies are ~100 words; the headroom is for Gemini's thinking tokens. */
const MAX_OUTPUT_TOKENS = 2_048;

const RATE = { limit: 20, windowMs: 60_000 };
const RATE_DAILY = { limit: 300, windowMs: 24 * 60 * 60_000 };

/*
 * Only the envelope is checked here; `rebuildConversation` decides what of
 * each message's parts survives. `role` is the part that matters most: a
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

type ClientMessage = z.infer<typeof bodySchema>["messages"][number];

/** The model-bound shape: one text part per message, nothing else. */
interface TextMessage {
  id: string;
  role: "user" | "assistant";
  parts: { type: "text"; text: string }[];
}

/** The text of a message's text parts, joined; non-string text counts as absent. */
function textOf(message: ClientMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { text?: unknown }).text)
    .filter((text): text is string => typeof text === "string")
    .join("");
}

/**
 * Rebuilds the conversation the model will see from what the client sent.
 *
 * The real client (`concierge.tsx`) only ever sends text from the traveller,
 * and echoes back the assistant turns it received. Everything else in a body
 * is either UI state or forged, so:
 *
 *   - A user message with any part that is not text is rejected (400). The
 *     box cannot attach files; a body that does was not sent by this site,
 *     and a `file` part would make the SDK download its URL server-side.
 *   - Assistant messages keep their text parts only. Reasoning, tool calls
 *     and results, files and sources are dropped, and the text is capped at
 *     MAX_ASSISTANT_TEXT.
 *   - Messages left with no text are dropped.
 *   - Of the last CONTEXT_MESSAGES, the oldest are dropped until the text
 *     left fits MAX_CONTEXT_TEXT, and the window then starts on a traveller
 *     turn so the model never opens on an orphaned reply.
 *
 * The trade-off: earlier itinerary, result and quote cards no longer reach
 * the model as structured tool results. A follow-up ("swap day 2", "is the
 * second stay cheaper?") relies on the assistant's own text from that turn,
 * and the model simply re-runs the tool, which is cheap (catalogue reads,
 * cached) and always answers from current data rather than from whatever a
 * client claims an earlier tool returned.
 *
 * Returns null when the request must be rejected.
 */
function rebuildConversation(messages: readonly ClientMessage[]): TextMessage[] | null {
  const rebuilt: TextMessage[] = [];
  for (const message of messages) {
    if (message.role === "user") {
      const forged = message.parts.some(
        (part) => part.type !== "text" || typeof (part as { text?: unknown }).text !== "string",
      );
      if (forged) return null;
    }
    let text = textOf(message);
    if (message.role === "assistant") text = text.slice(0, MAX_ASSISTANT_TEXT);
    if (!text.trim()) continue;
    rebuilt.push({ id: message.id, role: message.role, parts: [{ type: "text", text }] });
  }

  const recent = rebuilt.slice(-CONTEXT_MESSAGES);
  let total = recent.reduce((sum, m) => sum + m.parts[0].text.length, 0);
  // Keep at least the final message: the traveller's question is the point.
  while (total > MAX_CONTEXT_TEXT && recent.length > 1) {
    total -= recent.shift()!.parts[0].text.length;
  }

  const firstUser = recent.findIndex((m) => m.role === "user");
  const aligned = firstUser === -1 ? [] : recent.slice(firstUser);
  // The turn being answered must still be the traveller's.
  if (aligned.length === 0 || aligned[aligned.length - 1].role !== "user") return null;
  return aligned;
}

/**
 * Passed to `streamText` as `experimental_download`: refuses every download.
 * `rebuildConversation` already strips every part that could carry a URL, so
 * this never runs on a well-formed request; it is the second line of defence
 * against the SDK fetching an arbitrary URL (default cap 2 GiB) on our CPU,
 * memory and bandwidth.
 */
async function refuseDownloads(requests: { url: URL }[]): Promise<never> {
  throw new DownloadError({
    url: requests[0]?.url.toString() ?? "",
    message: "File and URL inputs are not accepted by the concierge.",
  });
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

  // Text only, capped, windowed and starting on a traveller turn. Checked
  // before the canned branch too, so a forged body gets the same 400 whether
  // or not the model is live.
  const conversation = rebuildConversation(body.messages);
  if (!conversation) return jsonError(400, "Invalid request body.");
  const messages: UIMessage[] = conversation;

  if (!isConciergeLive) {
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
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      experimental_download: refuseDownloads,
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
        "Something went wrong on my side just now. Try again in a moment, or browse [places](/hotspots) and [homestays](/homestays) directly while I catch my breath.",
        false,
      ),
    });
  }
}
