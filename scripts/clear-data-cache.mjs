/**
 * Drop Next's data cache before a build.
 *
 * Next keeps its data cache in `.next/cache/fetch-cache` and reuses it across
 * builds. Two things live there:
 *
 *   - every `fetch` a page makes with caching on (the Places lookups in
 *     /api/place-photo, any build-time fetch);
 *   - since PR #49, the catalogue and editorial reads too. `sharedRead`
 *     (src/lib/data/cache.ts) stores each database read through
 *     `unstable_cache`, which writes to this same cache.
 *
 * The catalogue entries are keyed by deployment id, so a Vercel build never
 * reads rows an earlier deployment cached. Locally that id is always "local",
 * though, so without this step a second `npm run build` would prerender from
 * the first build's rows. Clearing first stays correct everywhere and costs
 * one fresh read per table per build.
 *
 * The symptom it prevents is a page that disagrees with the database: a new
 * slug prerenders as "not found" or an updated photo never appears.
 *
 * Setting `cache: "no-store"` instead would opt those routes out of static
 * rendering. Clearing the cache before the build keeps static generation.
 *
 * Run from `prebuild`.
 */
import { rm } from "node:fs/promises";
import { join } from "node:path";

const target = join(process.cwd(), ".next", "cache", "fetch-cache");

try {
  await rm(target, { recursive: true, force: true });
  console.log("[clear-data-cache] dropped .next/cache/fetch-cache");
} catch (err) {
  // Never fail a build over this: a missing cache is the desired state anyway.
  console.warn("[clear-data-cache] skipped:", err.message);
}
