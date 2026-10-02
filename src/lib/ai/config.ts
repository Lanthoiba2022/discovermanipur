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

import { readAnthropicKey, readGeminiKey } from "./flags";

/**
 * The Anthropic model used when an `ANTHROPIC_API_KEY` is configured.
 * Sonnet 5 is fast enough to feel conversational.
 */
export const ANTHROPIC_MODEL = "claude-sonnet-5";

/** The Gemini model used when a Gemini key is configured. Overridable via env. */
export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

// The key readers and both on/off flags live in the dependency-free
// `flags.ts`, so the root layout can read `isConciergeLive` without
// evaluating the provider SDKs imported above. They are re-exported here so
// existing `@/lib/ai` and `@/lib/ai/config` imports keep working unchanged.
export { isAIConfigured, isConciergeLive } from "./flags";

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
