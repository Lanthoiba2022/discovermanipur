/**
 * Model + configuration for the Manipur Tourism concierge.
 *
 * Nothing in here throws at import time. The environment may be missing both
 * provider keys in development, in CI and during `next build`; the route
 * handlers check `isAIConfigured` and fall back to a canned response instead
 * of blowing up.
 *
 * Two providers are supported so the concierge runs whichever key is present:
 *
 * - Google Gemini (`GOOGLE_API_KEY`, or the `GEMINI_API_KEY` / `API_KEY`
 *   aliases) — preferred.
 * - Anthropic (`ANTHROPIC_API_KEY`) — the original provider, kept as a
 *   fallback so deployments that already set it keep working.
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
  // A key dedicated to Gemini wins. `GOOGLE_API_KEY` is last because this
  // deployment also uses that name for the Maps/Places key (Kangla 3D tiles,
  // place photos), which may be restricted to those APIs.
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    ""
  );
}

/**
 * True when an LLM key is present in this (server) process.
 *
 * On the client this is always `false` — the key is never exposed to the
 * browser — so UI code should take the `configured` flag the server hands it
 * rather than reading this directly.
 */
export const isAIConfigured: boolean = readGeminiKey().length > 0 || readAnthropicKey().length > 0;

/**
 * The model name in use, for logging/display. Gemini wins because it is the
 * key the deployment actually ships.
 */
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
 * Deliberately opt-*in*: this deployment is a demo, and a half-configured key
 * produced a chat that looked alive and then failed mid-answer. With the flag
 * off the UI stops pretending — the floating widget says so plainly and `/plan`
 * shows a curated sample conversation built from the real catalogue instead.
 *
 * Set `AI_CHAT_ENABLED=true` (alongside a working key) to switch it back on.
 */
export const isConciergeLive: boolean =
  process.env.AI_CHAT_ENABLED?.trim().toLowerCase() === "true" && isAIConfigured;
