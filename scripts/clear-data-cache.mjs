/**
 * Drop Next's fetch cache before a build.
 *
 * Next caches fetch responses in `.next/cache/fetch-cache` and reuses them
 * across builds. supabase-js reads go through that same patched `fetch`, so a
 * build can prerender pages from catalogue rows captured by an EARLIER build.
 *
 * That is not theoretical. After seeding new hotspots, `generateStaticParams`
 * saw the fresh list while the page bodies were handed the stale one, and every
 * new slug prerendered as "Place not found". Later, updating a single row's
 * photo produced a page that still showed the old placeholder. Both looked like
 * application bugs and were not.
 *
 * Setting `cache: "no-store"` on the client is the obvious fix and the wrong
 * one: it opts every catalogue route out of static rendering, which is the
 * whole point of `lib/supabase/public.ts` being cookie-free.
 *
 * Clearing the cache before the build keeps static generation intact and costs
 * one extra round of queries per build — a handful of whole-table reads.
 */
import { rm } from "node:fs/promises";
import { join } from "node:path";

const target = join(process.cwd(), ".next", "cache", "fetch-cache");

try {
  await rm(target, { recursive: true, force: true });
  console.log("[clear-data-cache] dropped .next/cache/fetch-cache");
} catch (err) {
  // Never fail a build over this — a missing cache is the desired state anyway.
  console.warn("[clear-data-cache] skipped:", err.message);
}
