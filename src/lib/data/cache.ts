/**
 * Cross-request cache for database reads.
 *
 * React's `cache` lasts one render. On its own that meant every prerendered
 * page re-read whole catalogue tables at build time (about 400 prerendered
 * pages, most reading one or more tables of up to 1 MB each), and every visit
 * to a dynamic listing page did the same at runtime. On 2026-10-01 that used
 * up the Neon free plan's monthly network transfer in a day. Wrapping a read
 * here makes it one round trip per table per deployment instead, plus one
 * after each in-app write.
 *
 * Rules for the function passed in:
 * - It must THROW when the database errors, never return a fallback. A thrown
 *   read is not cached, so the seed fallback is decided outside the cache and
 *   an outage is never pinned.
 * - Its result must be JSON-safe (no `Date`, `Map`, class instances): that is
 *   what the data cache stores. Arguments are part of the cache key.
 *
 * Freshness:
 * - Entries never expire on a timer. A time-based `revalidate` here would also
 *   become the revalidate of every static page that reads it, turning them
 *   all into ISR pages that regenerate on Vercel around the clock.
 * - Edits made outside the app (Neon console, `npm run db:seed`) show on the
 *   next deploy, as they already did for prerendered pages. The key carries
 *   the deployment id because Next keeps this cache across deployments, so a
 *   new deployment never reads rows an older one cached. Locally, `prebuild`
 *   clears `.next/cache/fetch-cache`.
 * - `next dev` skips the cache, so seed edits show immediately while working.
 *
 * Tags (what an in-app write invalidates):
 * - Every catalogue entry carries two tags: CATALOGUE_TAG, for a bulk refresh
 *   of the whole catalogue, and its table tag, `catalogueTableTag(table)`, for
 *   a targeted one. Editorial reads carry CONTENT_TAG.
 * - `unstable_cache` copies the tags of every entry a prerender reads onto that
 *   page (node_modules/next/dist/server/web/spec-extension/unstable-cache.js,
 *   the `collectedTags` block). So `updateTag(catalogueTableTag("homestays"))`
 *   drops the cached homestay rows AND regenerates exactly the pages that read
 *   them (home, /homestays, each detail page, search, the sitemap), and
 *   nothing else. No `revalidatePath` is needed for public pages.
 * - A new write path to a cached table must call `updateTag` with that table's
 *   tag (see `src/lib/admin/listing-actions.ts`, `src/app/host/dashboard/actions.ts`).
 *
 * Size guard:
 * - Next refuses to store a data-cache entry over 2 MB
 *   (node_modules/next/dist/server/lib/incremental-cache/index.js, "FetchCache
 *   has upper limit of 2MB per-entry"). The stored body is the result
 *   stringified twice (`body: JSON.stringify(result)`, then measured with a
 *   second `JSON.stringify`, which escapes every quote), so it is about 10
 *   percent larger than the result's own JSON.
 * - Crossing the limit does not throw. Next logs one warning and skips the
 *   write, so every request re-reads the whole table from Neon. That is the
 *   2026-10-01 egress failure again, silently.
 * - So every read is measured here: a warning once per key above 1 MB, an
 *   error above 1.5 MB, and in a production build (`isProductionBuild`) the
 *   read throws, which the catalogue loader turns into a failed build. The
 *   measurement also runs under `next dev`, which bypasses the cache: it is
 *   the only early warning a contributor gets.
 *
 * Build guard:
 * - A production build that silently swaps live rows for the 2025 seeds would
 *   freeze them into static pages, and `dynamicParams = false` then 404s every
 *   slug that exists only in the database for the whole deployment. So inside
 *   a production build `readWithBuildRetry` retries a failed read (a Neon cold
 *   wake) and then FAILS the build instead; the previous deployment keeps
 *   serving. `ALLOW_SEED_FALLBACK=1` restores the old behaviour for an
 *   emergency build during a Neon outage.
 */
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { unstable_cache } from "next/cache";

/** Every cached catalogue table (`catalogue.ts`): a bulk refresh. */
export const CATALOGUE_TAG = "catalogue";
/** Every cached editorial read (`content.ts`). */
export const CONTENT_TAG = "content";

/**
 * The tag for one catalogue table, e.g. `catalogue:homestays`. Writes to that
 * table call `updateTag(catalogueTableTag(table))`; see the header for why
 * that is enough to refresh every page that shows it.
 */
export function catalogueTableTag(table: string): string {
  return `catalogue:${table}`;
}

const DEPLOYMENT =
  process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || "local";

const isDev = process.env.NODE_ENV === "development";

/**
 * Is this code running inside `next build` for a Vercel Production deployment,
 * without the emergency override?
 *
 * Evaluated on every call, never at module load: `next build` sets
 * `NEXT_PHASE` (node_modules/next/dist/build/index.js) just before it starts
 * the static-generation workers, after some modules may already have loaded.
 *
 * Preview and local builds are deliberately excluded: they keep falling back
 * to seed data, so a fork or a CI run with no database still builds.
 */
export function isProductionBuild(): boolean {
  return (
    process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD &&
    process.env.VERCEL_ENV === "production" &&
    process.env.ALLOW_SEED_FALLBACK !== "1"
  );
}

/* ------------------------------------------------------------ size guard -- */

/** Next's own limit is 2 MiB of doubly stringified JSON; these leave margin. */
const WARN_BYTES = 1_000_000;
const FAIL_BYTES = 1_500_000;

/** Thrown by the size guard. Not retried: reading again returns the same rows. */
class CacheEntryTooLargeError extends Error {
  constructor(key: string, size: number) {
    super(
      `${key}: cached result is ${size} characters of JSON, over the ${FAIL_BYTES} guard ` +
        "(Next stops caching entries near 2 MB, and every request would then read the table). " +
        "Trim what the loader returns.",
    );
    this.name = "CacheEntryTooLargeError";
  }
}

/** Keys already warned about on this instance, so a hot path logs once. */
const warnedKeys = new Set<string>();

function checkSize(key: string, result: unknown) {
  const size = JSON.stringify(result)?.length ?? 0;
  if (size > FAIL_BYTES) {
    console.error(
      JSON.stringify({ level: "error", scope: "cache.size", key, size, limit: FAIL_BYTES }),
    );
    if (isProductionBuild()) throw new CacheEntryTooLargeError(key, size);
  } else if (size > WARN_BYTES && !warnedKeys.has(key)) {
    warnedKeys.add(key);
    console.warn(
      JSON.stringify({ level: "warn", scope: "cache.size", key, size, limit: WARN_BYTES }),
    );
  }
}

/* ------------------------------------------------------------ sharedRead -- */

/**
 * Cache `run` across requests and build workers under `key` and `tags`.
 *
 * `tags` takes one tag or several; content reads pass CONTENT_TAG alone,
 * catalogue reads pass CATALOGUE_TAG plus their table tag.
 */
export function sharedRead<A extends unknown[], T>(
  key: string,
  tags: string | string[],
  run: (...args: A) => Promise<T>,
): (...args: A) => Promise<T> {
  const tagList = Array.isArray(tags) ? tags : [tags];

  const measured = async (...args: A): Promise<T> => {
    const result = await run(...args);
    checkSize(key, result);
    return result;
  };
  // Next names the entry after the function in its own "items over 2MB" warning,
  // so give it the key rather than the wrapper's name.
  Object.defineProperty(measured, "name", { value: key });

  if (isDev) return measured;
  return unstable_cache(measured, [DEPLOYMENT, key], {
    revalidate: false,
    tags: tagList,
  });
}

/* ------------------------------------------------------------ build guard -- */

/** Waits before the 2nd and 3rd attempts: long enough for a suspended Neon compute to wake. */
const BUILD_RETRY_WAITS_MS = [1_000, 3_000];

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Run a cached read, with the production-build policy from the header.
 *
 * Outside a production build `read` runs once and its error propagates exactly
 * as before, so callers keep choosing their own runtime fallback. Inside one it
 * gets three attempts (waiting 1 s, then 3 s) and then throws an error that
 * names `label` and the way out; the caller rethrows it to fail the build.
 * A size-guard failure is thrown straight away: retrying cannot shrink it.
 */
export async function readWithBuildRetry<T>(label: string, read: () => Promise<T>): Promise<T> {
  if (!isProductionBuild()) return read();

  let lastError: unknown;
  for (let attempt = 0; attempt <= BUILD_RETRY_WAITS_MS.length; attempt++) {
    if (attempt > 0) await sleep(BUILD_RETRY_WAITS_MS[attempt - 1]);
    try {
      return await read();
    } catch (err) {
      if (err instanceof CacheEntryTooLargeError) throw err;
      lastError = err;
    }
  }
  throw new Error(
    `${label}: database read failed during the production build. ` +
      "The previous deployment keeps serving. Set ALLOW_SEED_FALLBACK=1 to ship seed data instead.",
    { cause: lastError },
  );
}
