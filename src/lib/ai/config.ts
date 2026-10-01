/**
 * Model + configuration for the Discover Manipur concierge.
 *
 * Nothing in here throws at import time. The environment may be missing both
 * provider keys in development, in CI and during `next build`; the route
 * handlers check `isAIConfigured` and fall back to a canned response instead
 * of blowing up.
 *
 * Two providers are supported so the concierge runs whichever key is present:
 *
 * - Google Gemini (`GEMINI_API_KEY`, or `GOOGLE_GENERATIVE_AI_API_KEY`),
 *   preferred.
 * - Anthropic (`ANTHROPIC_API_KEY`), used when no Gemini key is set.
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

/**
 * The Anthropic model used when an `ANTHROPIC_API_KEY` is configured.
 * Sonnet 5 is fast enough to feel conversational.
 */
export const ANTHROPIC_MODEL = "claude-sonnet-5";

/** The Gemini model used when a Gemini key is configured. Overridable via env. */
export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

function readAnthropicKey(): string {
  return process.env.ANTHROPIC_API_KEY?.trim() ?? "";
}

function readGeminiKey(): string {
  // Never `GOOGLE_API_KEY`: that is the Maps key, and the Kangla map hands it
  // to the browser. A key anyone can copy out of the page must not also be
  // able to bill Gemini, so the LLM key has to be a separate, server-only one.
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

/** The model name in use, for logging/display. */
export const CONCIERGE_MODEL: string = readGeminiKey().length > 0 ? GEMINI_MODEL : ANTHROPIC_MODEL;

/**
 * Resolve the language model. Called lazily, per request, so that importing
 * this module on a machine without a key is always safe.
 */
export function conciergeModel(): LanguageModel {
  const geminiKey = readGeminiKey();
  if (geminiKey) {
    return createGoogleGenerativeAI({ apiKey: geminiKey })(GEMINI_MODEL);
  }
  return createAnthropic({ apiKey: readAnthropicKey() })(ANTHROPIC_MODEL);
}

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
