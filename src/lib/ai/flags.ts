/**
 * The concierge's on/off switches, and nothing else.
 *
 * This module is deliberately dependency-free: it reads `process.env` and
 * imports no SDK, schema or tool. The root layout needs `isConciergeLive` on
 * every server render, and importing it from the `@/lib/ai` barrel (or from
 * `config.ts`) would evaluate both provider SDKs, the tool definitions and
 * zod at every cold start of every function that renders the layout, just to
 * read one boolean. `config.ts` re-exports both flags, so there is still one
 * source of truth and every existing import keeps working.
 *
 * Nothing in here throws at import time: a missing key simply reads as "not
 * configured".
 */

/** The Anthropic key, trimmed; empty when unset. */
export function readAnthropicKey(): string {
  return process.env.ANTHROPIC_API_KEY?.trim() ?? "";
}

/**
 * The Gemini key, trimmed; empty when unset.
 *
 * Never `GOOGLE_API_KEY`: that is the Maps key, and the Kangla map hands it to
 * the browser. A key anyone can copy out of the page must not also be able to
 * bill Gemini, so the LLM key has to be a separate, server-only one.
 */
export function readGeminiKey(): string {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    ""
  );
}

/**
 * True when an LLM key is present in this (server) process.
 *
 * On the client this is always `false` (the key is never exposed to the
 * browser), so UI code should take the `configured` flag the server hands it
 * rather than reading this directly.
 */
export const isAIConfigured: boolean = readGeminiKey().length > 0 || readAnthropicKey().length > 0;

/**
 * Whether the concierge is allowed to answer live.
 *
 * Deliberately opt-*in*: every live answer is a paid model call, and a
 * half-configured key produced a chat that looked alive and then failed
 * mid-answer. With the flag off the UI says so plainly, `/plan` shows a
 * curated sample conversation built from the real catalogue instead, and the
 * `/api/chat` and `/api/itinerary` routes never call a model, so the switch
 * also caps spend, not just what the UI shows.
 *
 * Set `AI_CHAT_ENABLED=true` (alongside a working key) to switch it on.
 */
export const isConciergeLive: boolean =
  process.env.AI_CHAT_ENABLED?.trim().toLowerCase() === "true" && isAIConfigured;
