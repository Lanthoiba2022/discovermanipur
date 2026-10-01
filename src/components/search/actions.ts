"use server";

import { headers } from "next/headers";

import { globalSearch, type SearchResult } from "@/lib/data";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";

/** Longer than any listing name; anything past it cannot match. */
const MAX_TERM = 100;
/** Typeahead fires per keystroke (debounced), so this is generous. */
const RATE = { limit: 120, windowMs: 60_000 };

/**
 * Typeahead suggestions for the search input. Deliberately small — the full
 * result set lives at /search.
 *
 * A Server Action is a public endpoint, so `term` is whatever the caller sent:
 * it is type- and length-checked before it reaches the data layer.
 */
export async function fetchSuggestions(term: string): Promise<SearchResult[]> {
  if (typeof term !== "string") return [];
  const trimmed = term.trim();
  if (trimmed.length < 2 || trimmed.length > MAX_TERM) return [];

  if (!rateLimit("search", clientIp(await headers()), RATE).ok) return [];
  return globalSearch(trimmed, 6);
}
