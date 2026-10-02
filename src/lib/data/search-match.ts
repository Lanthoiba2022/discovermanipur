/**
 * Site search matching: the pure half, shared by the browser and the server.
 *
 * The typeahead in the site header used to run a Server Action per debounced
 * keystroke, and each call loaded six whole catalogue tables to substring-match
 * them: a function invocation and a cache read per few characters typed, on
 * every page. Now the server publishes the catalogue once as a static index
 * (`/search-index.json`, built by `./search.ts`) and the browser filters it
 * with `matchEntries` below. The `/search` page runs the same function over
 * the same entries on the server, so a suggestion and a full search can never
 * disagree about what matches.
 *
 * Client-safe by construction: this module imports nothing (no catalogue, no
 * database, no Next APIs), so pulling it into the header bundle costs a few
 * hundred bytes.
 */

/** Every kind of listing site search covers, in display order. */
export const SEARCH_KIND_VALUES = [
  "hotspot",
  "homestay",
  "experience",
  "eatery",
  "tour",
  "craft",
  "festival",
  "transport",
] as const;

export type SearchKind = (typeof SEARCH_KIND_VALUES)[number];

/**
 * One searchable listing.
 *
 * `haystack` is the lowercased text a term is matched against: the fields
 * named per kind in `buildSearchEntries` (./search.ts), joined by spaces.
 * It is lowercased once when the index is built, not per keystroke.
 *
 * `image` is optional and, in the static index, only ever a self-hosted
 * `/file-uploads/` path (see `src/app/search-index.json/route.ts`); the
 * server-rendered `/search` page also passes Places photos, with
 * `imageCredit`.
 */
export interface SearchEntry {
  kind: SearchKind;
  slug: string;
  title: string;
  subtitle: string;
  href: string;
  image?: string;
  /** Photographer credit for `image`. Rendering it is a licence condition for Places photos. */
  imageCredit?: string;
  haystack: string;
}

/** Builds a `haystack` from the fields a kind is searched on. */
export function toHaystack(...parts: (string | readonly string[] | undefined | null)[]): string {
  return parts
    .flatMap((part) => (part == null ? [] : typeof part === "string" ? [part] : [...part]))
    .join(" ")
    .toLowerCase();
}

/**
 * The entries whose haystack contains `term`, at most `limit` of them.
 *
 * Matching is a case-insensitive substring test on the trimmed term, exactly
 * what the old `globalSearch` did, so a search that worked before still works.
 *
 * Ordering is round-robin across kinds: the first match of each kind (in
 * `SEARCH_KIND_VALUES` order), then the second of each, and so on, and only
 * then is the list cut to `limit`. The old search concatenated kinds in a fixed
 * order and sliced, so with six suggestions a term like "imphal" filled every
 * slot with places and hid the stays, eateries and festivals that also matched.
 * Within a kind, entries keep the order they have in `entries`, which is the
 * catalogue's own order (featured and sort weight first).
 *
 * Pure and synchronous; a few hundred entries filter in well under a
 * millisecond, so the caller needs no debounce.
 */
export function matchEntries<T extends SearchEntry>(
  entries: readonly T[],
  term: string,
  limit: number,
): T[] {
  const needle = term.trim().toLowerCase();
  if (!needle || limit <= 0) return [];

  const byKind = new Map<SearchKind, T[]>();
  for (const entry of entries) {
    if (!entry.haystack.includes(needle)) continue;
    const bucket = byKind.get(entry.kind);
    if (bucket) bucket.push(entry);
    else byKind.set(entry.kind, [entry]);
  }

  // Kinds in display order; an unknown kind (an index from a newer
  // deployment, say) goes after the known ones rather than being lost.
  const known = new Set<string>(SEARCH_KIND_VALUES);
  const buckets = [
    ...SEARCH_KIND_VALUES.map((kind) => byKind.get(kind)),
    ...[...byKind].filter(([kind]) => !known.has(kind)).map(([, rows]) => rows),
  ].filter((rows): rows is T[] => Boolean(rows?.length));

  const out: T[] = [];
  for (let round = 0; out.length < limit; round += 1) {
    let added = false;
    for (const rows of buckets) {
      const row = rows[round];
      if (!row) continue;
      out.push(row);
      added = true;
      if (out.length === limit) break;
    }
    if (!added) break;
  }
  return out;
}
