/**
 * GET /search-index.json: the whole public catalogue as a flat search index,
 * for the header typeahead (`src/components/search/search-input.tsx`).
 *
 * Why a static file rather than a Server Action: the typeahead is on every
 * page, and it used to call a Server Action per debounced keystroke, each one
 * a function invocation that read six whole catalogue tables to answer one
 * prefix. This route is prerendered once at build (`force-static`, supported
 * without Cache Components: node_modules/next/dist/docs/01-app/02-guides/
 * caching-without-cache-components.md), served from the CDN like any static
 * asset, fetched by a browser at most once per page load on first focus, and
 * filtered there with `matchEntries`. Typing costs no requests at all.
 *
 * Freshness: the entries and the catalogue loaders behind them read through
 * `sharedRead`, whose cache tags are copied onto this prerender, so an in-app
 * catalogue write that calls `updateTag` regenerates the index with every
 * other page that read the same tables. Edits made outside the app show on the next deploy, as for every
 * prerendered page. No timed revalidate, by design (see src/lib/data/cache.ts).
 *
 * Kept slim on purpose. `image` is included ONLY for self-hosted
 * `/file-uploads/` files that carry no credit. A Google Places URL is ~650
 * characters of poorly compressible reference (most of the index's weight),
 * it is signed and the photo behind it may change upstream, and showing it
 * would oblige the typeahead to render its attribution in a 44px tile. A
 * self-hosted file with a credit (a CC BY photo, say) is left out for the
 * same reason: a credit truncated to 44px is no attribution. Community photos
 * sit behind an access-checked route. Entries without an image show their
 * kind's icon in the tile (`kindIcon`), and the full `/search` page still
 * shows every photo with its credit. `subtitle` and `haystack` stay because the matcher
 * and the list need them; nothing else is published.
 *
 * Visibility is inherited from the loaders (inactive homestays and crafts are
 * already excluded), so this file never lists a paused or hidden row.
 */

import { loadSearchEntries } from "@/lib/data/search";
import type { SearchEntry } from "@/lib/data/search-match";

export const dynamic = "force-static";

/**
 * Self-hosted, stable, cheap to optimize and owing no on-image credit: the
 * only images worth shipping in the index.
 */
function indexableImage(src: string | undefined, credit: string | undefined): src is string {
  return Boolean(src?.startsWith("/file-uploads/")) && !credit;
}

export async function GET() {
  // The same cached list `/search` matches against (see `loadSearchEntries`):
  // one build per deployment and per catalogue write serves both.
  const entries = await loadSearchEntries();

  const slim: SearchEntry[] = entries.map(
    ({ kind, slug, title, subtitle, href, image, imageCredit, haystack }) => ({
      kind,
      slug,
      title,
      subtitle,
      href,
      ...(indexableImage(image, imageCredit) ? { image } : {}),
      haystack,
    }),
  );

  return Response.json(slim);
}
