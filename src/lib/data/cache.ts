/**
 * Cross-request cache for database reads.
 *
 * React's `cache` lasts one render. On its own that meant every prerendered
 * page re-read whole catalogue tables at build time (~170 pages, about 1 MB
 * each), and every visit to a dynamic listing page did the same at runtime.
 * On 2026-10-01 that used up the Neon free plan's monthly network transfer in
 * a day. Wrapping a read here makes it one round trip per table per
 * deployment instead, plus one after each in-app write.
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
 * - Writes made through the app call `updateTag(CATALOGUE_TAG)` (see
 *   `src/lib/admin/listing-actions.ts`, `src/app/host/dashboard/actions.ts`),
 *   so the change shows on the next request. A new write path to a cached
 *   table must do the same.
 * - Edits made outside the app (Neon console, `npm run db:seed`) show on the
 *   next deploy, as they already did for prerendered pages. The key carries
 *   the deployment id because Next keeps this cache across deployments, so a
 *   new deployment never reads rows an older one cached. Locally, `prebuild`
 *   clears `.next/cache/fetch-cache`.
 * - `next dev` skips the cache, so seed edits show immediately while working.
 */
import { unstable_cache } from "next/cache";

/** Every cached catalogue table (`catalogue.ts`). */
export const CATALOGUE_TAG = "catalogue";
/** Every cached editorial read (`content.ts`). */
export const CONTENT_TAG = "content";

const DEPLOYMENT =
  process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || "local";

const isDev = process.env.NODE_ENV === "development";

export function sharedRead<A extends unknown[], T>(
  key: string,
  tag: string,
  run: (...args: A) => Promise<T>,
): (...args: A) => Promise<T> {
  if (isDev) return run;
  return unstable_cache(run, [DEPLOYMENT, key], {
    revalidate: false,
    tags: [tag],
  });
}
