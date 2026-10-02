/**
 * Site search: the server half.
 *
 * `loadSearchEntries` turns the catalogue into the flat `SearchEntry` list
 * that both search surfaces match against with `matchEntries`
 * (./search-match.ts):
 *
 *   - `/search-index.json` publishes a slimmed copy once per deployment (and
 *     after each in-app catalogue write), which the header typeahead fetches
 *     on first use and filters in the browser.
 *   - `/search` calls `searchCatalogue` per request, for shareable `?q=` URLs
 *     with thumbnails and their photo credits.
 *
 * Rows come from the cached catalogue loaders (./catalogue.ts), and the
 * built list is itself one cached entry (`readCachedEntries`) carrying the
 * same catalogue tags, so `updateTag` after an in-app write refreshes the
 * static index and the search page with everything else. Visibility is the
 * loaders' job: `loadHomestays` and `loadCrafts` already drop inactive rows, so
 * a paused listing never surfaces here. Do not swap in a raw table read.
 *
 * Each kind is matched on the fields the old `globalSearch` used (hotspots by
 * name, location and tags; crafts by name, maker and materials; tours by title
 * and themes; and so on), plus the two kinds it skipped: festivals (name,
 * location, month, so "Sangai" and "November" both find the festival) and
 * transport (name, operator, mode).
 */

import { AsyncLocalStorage } from "node:async_hooks";

import type { MediaImage } from "@/types";

import { logDbWarn } from "@/lib/log";

import { CATALOGUE_TAG, catalogueTableTag, isProductionBuild, sharedRead } from "./cache";
import {
  isSeedFallback,
  loadCrafts,
  loadEateries,
  loadExperiences,
  loadFestivals,
  loadHomestays,
  loadHotspots,
  loadTours,
  loadTransportOptions,
} from "./catalogue";
import { matchEntries, toHaystack, type SearchEntry } from "./search-match";

/* ---------------------------------------------------------------- sources -- */

/** The eight loaders' rows, read together. */
async function loadSources() {
  const [hotspots, homestays, experiences, eateries, crafts, tours, festivals, transport] =
    await Promise.all([
      loadHotspots(),
      loadHomestays(),
      loadExperiences(),
      loadEateries(),
      loadCrafts(),
      loadTours(),
      loadFestivals(),
      loadTransportOptions(),
    ]);
  return { hotspots, homestays, experiences, eateries, crafts, tours, festivals, transport };
}

type Sources = Awaited<ReturnType<typeof loadSources>>;

/**
 * Did any loader hand back its bundled seed rows instead of database rows?
 *
 * A loader serves its seed rows when no database is configured, when its
 * table is empty, and, at runtime, when its read FAILED. From out here those
 * cases look alike, so entries built from any seed fallback are never cached:
 * caching them would pin an outage's fallback into search until the next
 * deploy or catalogue write, which the per-table cache is careful never to
 * do. The cost of being conservative is small: forks and CI (no database) and
 * an empty table simply rebuild per request, as every request did before.
 *
 * The signal is explicit: `loader` (./catalogue.ts) marks every array it
 * returns from a seed path and `isSeedFallback` reads that mark, so this
 * keeps working if a loader ever copies or filters its seed rows.
 */
function usedSeedRows(sources: Sources): boolean {
  return Object.values(sources).some(isSeedFallback);
}

/** The lead photo's `src` and credit, carried together so the credit cannot be dropped. */
function lead(images: MediaImage[]): Pick<SearchEntry, "image" | "imageCredit"> {
  const first = images[0];
  return first ? { image: first.src, imageCredit: first.credit } : {};
}

/**
 * Every public listing as a search entry, in catalogue order within each kind.
 *
 * Images are included as they are (Places photos too, with their credit); the
 * static index route strips the ones that must not be published in it.
 */
function toEntries({
  hotspots,
  homestays,
  experiences,
  eateries,
  crafts,
  tours,
  festivals,
  transport,
}: Sources): SearchEntry[] {
  return [
    ...hotspots.map((h): SearchEntry => ({
      kind: "hotspot",
      slug: h.slug,
      title: h.name,
      subtitle: h.location,
      href: `/hotspots/${h.slug}`,
      ...lead(h.images),
      haystack: toHaystack(h.name, h.location, h.tags),
    })),
    ...homestays.map((h): SearchEntry => ({
      kind: "homestay",
      slug: h.slug,
      title: h.title,
      subtitle: h.location,
      href: `/homestays/${h.slug}`,
      ...lead(h.images),
      haystack: toHaystack(h.title, h.location),
    })),
    ...experiences.map((e): SearchEntry => ({
      kind: "experience",
      slug: e.slug,
      title: e.title,
      subtitle: e.location,
      href: `/experiences/${e.slug}`,
      ...lead(e.images),
      haystack: toHaystack(e.title, e.location),
    })),
    ...eateries.map((e): SearchEntry => ({
      kind: "eatery",
      slug: e.slug,
      title: e.name,
      subtitle: e.location,
      href: `/eateries/${e.slug}`,
      ...lead(e.images),
      haystack: toHaystack(e.name, e.location),
    })),
    ...crafts.map((c): SearchEntry => ({
      kind: "craft",
      slug: c.slug,
      title: c.name,
      subtitle: c.maker,
      href: `/store/${c.slug}`,
      ...lead(c.images),
      haystack: toHaystack(c.name, c.maker, c.materials),
    })),
    ...tours.map((t): SearchEntry => ({
      kind: "tour",
      slug: t.slug,
      title: t.title,
      subtitle: `${t.durationDays} days`,
      href: `/tours/${t.slug}`,
      ...lead(t.images),
      haystack: toHaystack(t.title, t.themes),
    })),
    ...festivals.map((f): SearchEntry => ({
      kind: "festival",
      slug: f.slug,
      title: f.name,
      subtitle: [f.month, f.location].filter(Boolean).join(", "),
      href: `/festivals/${f.slug}`,
      ...lead(f.images),
      haystack: toHaystack(f.name, f.location, f.month),
    })),
    ...transport.map((t): SearchEntry => ({
      kind: "transport",
      slug: t.slug,
      title: t.name,
      subtitle: t.operator,
      href: `/transport/${t.slug}`,
      ...lead(t.images),
      haystack: toHaystack(t.name, t.operator, t.mode),
    })),
  ];
}

/* ------------------------------------------------------------ cached list -- */

/** The eight tables the entries are built from, as `catalogueTableTag` names them. */
const SEARCH_TABLES = [
  "hotspots",
  "homestays",
  "experiences",
  "eateries",
  "crafts",
  "tours",
  "festivals",
  "transport_options",
] as const;

const SEARCH_ENTRIES_KEY = "search:entries";

/** Thrown by the cached read when it has no fresh entries to store: a cache miss. */
class SearchEntriesMiss extends Error {
  constructor() {
    super(`${SEARCH_ENTRIES_KEY}: not cached`);
    this.name = "SearchEntriesMiss";
  }
}

/**
 * Entries built by THIS call, handed to the cached read on a miss. An
 * AsyncLocalStorage rather than a module variable, so two concurrent misses
 * can never store each other's list.
 */
const freshEntries = new AsyncLocalStorage<SearchEntry[]>();

/**
 * The built entries as one data-cache entry, tagged with CATALOGUE_TAG and
 * every source table's tag, so `updateTag` after any of their writes drops it
 * along with the table's own rows (and, through the copied tags, regenerates
 * `/search-index.json`).
 *
 * Why it exists: `/search` renders per request, and before this each request
 * pulled the eight whole cached table entries (about 2 MB of JSON, mostly
 * Places URLs and fields search never reads) out of the data cache, parsed
 * them and rebuilt the list. Now a request reads one entry of the few
 * hundred KB search actually uses.
 *
 * Why the function never loads anything itself: `unstable_cache` BYPASSES
 * the cache for any `unstable_cache` call nested inside another
 * (node_modules/next/dist/server/web/spec-extension/unstable-cache.js,
 * `isNestedUnstableCache`). Building inside this read would turn every miss
 * (one per deployment plus one per catalogue write) into eight full-table
 * Neon reads instead of seven cache hits and at most one read, which is the
 * egress `sharedRead` exists to save. So it only stores what
 * `loadSearchEntries` built outside it and passed in through
 * `freshEntries`, and with nothing passed in it throws, which `sharedRead`
 * never caches. That is also how it keeps `sharedRead`'s contract: entries
 * built from a database failure's seed rows are never passed in, so they are
 * never stored (see `usedSeedRows`).
 *
 * This relies on catalogue writes calling `updateTag`, which expires the
 * entry outright (the rule in ./cache.ts). A stale-while-revalidate
 * `revalidateTag(tag, profile)` would hand back the stale list and try to
 * refresh it in the background, where nothing is passed in, so search would
 * stay stale until the next deploy.
 */
const readCachedEntries = sharedRead(
  SEARCH_ENTRIES_KEY,
  [CATALOGUE_TAG, ...SEARCH_TABLES.map(catalogueTableTag)],
  async (): Promise<SearchEntry[]> => {
    const fresh = freshEntries.getStore();
    if (!fresh) throw new SearchEntriesMiss();
    return fresh;
  },
);

/**
 * Every public listing as a search entry, from the data cache when it has
 * them. Shared by `/search` and `/search-index.json`.
 *
 * On a miss it builds them from the loaders exactly as before, so the seed
 * fallback, visibility and the production-build policy are the loaders' own
 * and unchanged (a production build whose database read fails still fails),
 * then stores them unless any loader fell back to seed rows. A cache problem
 * never costs a search: whatever goes wrong storing, the freshly built list
 * is returned (only inside a production build does a store failure, which
 * is then the size guard, fail the build, as for every cached read).
 *
 * Under `next dev` the cache is skipped (see ./cache.ts), so this always
 * builds, and the size guard still measures the entry.
 */
export async function loadSearchEntries(): Promise<SearchEntry[]> {
  try {
    return await readCachedEntries();
  } catch (err) {
    // A miss is the expected case; anything else (the data cache itself
    // failing) is worth a line, and the list is built either way.
    if (!(err instanceof SearchEntriesMiss)) {
      logDbWarn("search", err, { read: SEARCH_ENTRIES_KEY, fallback: "build" });
    }
  }

  const sources = await loadSources();
  const entries = toEntries(sources);
  if (usedSeedRows(sources)) return entries;

  try {
    return await freshEntries.run(entries, readCachedEntries);
  } catch (err) {
    if (isProductionBuild()) throw err;
    logDbWarn("search", err, { read: SEARCH_ENTRIES_KEY, store: "skipped" });
    return entries;
  }
}

/**
 * The entries built straight from the loaders, bypassing the entry cache.
 * For scripts and tests; pages and routes use `loadSearchEntries`.
 */
export async function buildSearchEntries(): Promise<SearchEntry[]> {
  return toEntries(await loadSources());
}

/** Longer than any listing name; anything past it cannot match. */
const MAX_TERM = 100;

/**
 * Full-catalogue search for the `/search` page: matching entries with their
 * lead photo and its credit, interleaved across kinds (see `matchEntries`).
 *
 * `term` comes straight from the URL, so it is capped before matching.
 */
export async function searchCatalogue(term: string, limit = 200): Promise<SearchEntry[]> {
  const trimmed = term.trim();
  if (!trimmed || trimmed.length > MAX_TERM) return [];
  return matchEntries(await loadSearchEntries(), trimmed, limit);
}
