"use server";

import { globalSearch, type SearchResult } from "@/lib/data";

/**
 * Typeahead suggestions for the search input. Deliberately small — the full
 * result set lives at /search.
 */
export async function fetchSuggestions(term: string): Promise<SearchResult[]> {
  const trimmed = term.trim();
  if (trimmed.length < 2) return [];
  return globalSearch(trimmed, 6);
}
