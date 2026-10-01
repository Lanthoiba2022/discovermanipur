/**
 * Drop Next's fetch cache before a build.
 *
 * Next caches fetch responses in `.next/cache/fetch-cache` and reuses them
 * across builds, so a build can prerender a page from data an EARLIER build
 * fetched. The catalogue itself is read through node-postgres (`src/lib/db`),
 * which bypasses `fetch` and this cache, but any `fetch` a page makes at build
 * time is still cached.
 *
 * The symptom is a page that disagrees with its own data: `generateStaticParams`
 * sees fresh rows while the page body renders a stale response, so a new slug
 * prerenders as "not found" or an updated photo never appears.
 *
 * Setting `cache: "no-store"` instead would opt those routes out of static
 * rendering. Clearing the cache before the build keeps static generation and
 * costs one fresh round of requests per build.
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
