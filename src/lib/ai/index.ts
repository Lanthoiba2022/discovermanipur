/**
 * Public surface of the Manipur Tourism AI slice.
 *
 * Server code imports from here. Client components should import types (and
 * only types) from `@/lib/ai/schema`, which pulls in no catalogue data.
 */

export { CONCIERGE_MODEL, conciergeModel, isAIConfigured } from "./config";
export { CONCIERGE_SYSTEM_PROMPT, itinerarySystemPrompt } from "./prompt";
export { assembleItinerary, conciergeTools, type ConciergeTools } from "./tools";
export { NOT_CONFIGURED_MESSAGE, NOT_CONFIGURED_SHORT, sampleItinerary } from "./fallback";
export * from "./schema";
