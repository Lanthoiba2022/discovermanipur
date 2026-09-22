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
 * - Google Gemini (`GEMINI_API_KEY`, or the legacy `API_KEY` alias) —
 *   preferred.
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
  return process.env.GEMINI_API_KEY?.trim() || process.env.API_KEY?.trim() || "";
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