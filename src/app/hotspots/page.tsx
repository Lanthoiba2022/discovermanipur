import type { Metadata } from "next";
import { Compass, MapPinned } from "lucide-react";
import { Suspense } from "react";

import { PageHero } from "@/components/content/page-hero";
import { UrlSearchBridge } from "@/components/listing/url-search-bridge";
import { HotspotCard } from "@/components/places/hotspot-card";
import { HotspotClearFilters } from "@/components/places/hotspot-clear-filters";
import { HotspotFilters } from "@/components/places/hotspot-filters";
import { HotspotResults, HotspotResultsHeading } from "@/components/places/hotspot-results";
import { uniqueDistricts } from "@/components/places/taxonomy";
import { ViewSwitch } from "@/components/places/view-switch";
import { Reveal } from "@/components/motion/reveal";
import { getHotspotCategories, getHotspots } from "@/lib/data";

export const metadata: Metadata = {
  title: "Places to visit in Manipur",
  description:
    "Every lake, hill, fort, cave and market worth the drive. Filter Manipur's destinations by category, district, season and step-free access, then browse them as cards or on a map.",
  openGraph: {
    title: "Places to visit in Manipur · Discover Manipur",
    description:
      "Filter Manipur's lakes, hills, forts and markets by district and season, then browse them as cards or on a live map.",
    // The site's 1200x630 share card. The card placeholder used before is a
    // 400x300 file, which platforms rendered blurry or rejected.
    images: [
      {
        url: "/og/discover-manipur.jpg",
        width: 1200,
        height: 630,
        alt: "Discover Manipur: floating islands, cloud-caught hills and a thousand-year weave",
      },
    ],
  },
};

/**
 * /hotspots is prerendered once and served from the CDN.
 *
 * The page reads no request data: every place is rendered here, in
 * `getHotspots()` order, and `HotspotResults` filters the cards (or the map)
 * in the browser from the query string, which `UrlSearchBridge` copies into
 * the listing store. Shared links such as `?district=Ukhrul&accessible=1` or
 * `?view=map` keep working; they re-filter straight after hydration. The
 * hero figures and the static HTML describe the unfiltered list.
 */
export default async function HotspotsPage() {
  const [all, categories] = await Promise.all([getHotspots(), getHotspotCategories()]);

  const districts = uniqueDistricts(all);
  const accessibleCount = all.filter((h) => h.accessibility?.wheelchairAccessible).length;

  return (
    <>
      <Suspense fallback={null}>
        <UrlSearchBridge />
      </Suspense>

      <PageHero
        tone="crimson"
        eyebrow="Discover"
        title="Places"
        completion="lakes that float, hills that catch the cloud, forts that remember kings."
        lede={
          <p>
            {all.length > 0 ? `${all.length} places` : "A growing map"} across Manipur&rsquo;s
            sixteen districts, filtered the way you actually travel: by season, by district, and
            by whether you can get a wheelchair to the water.
          </p>
        }
        image={{
          src: "/file-uploads/loktak-phumdi-hut.webp",
          alt: "A fisherman's hut standing on a phumdi island among the open water of Loktak Lake.",
        }}
        figures={[
          { value: String(all.length), label: "Places mapped" },
          { value: String(districts.length), label: "Districts" },
          { value: String(categories.length), label: "Categories" },
          { value: String(accessibleCount), label: "Step-free" },
        ]}
      />

      <section aria-labelledby="places-results" className="shell py-16 md:py-24">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <h2 id="places-results" className="text-title">
            <HotspotResultsHeading />
          </h2>
          <ViewSwitch />
        </div>

        <div className="grid gap-10 lg:grid-cols-[18rem_1fr] lg:gap-12">
          <aside aria-label="Filter places">
            <HotspotFilters categories={categories} districts={districts} total={all.length} />
          </aside>

          <div className="min-w-0">
            {all.length === 0 ? (
              <EmptyState datasetEmpty />
            ) : (
              <HotspotResults
                items={all.map((hotspot, index) => ({
                  key: hotspot.id || hotspot.slug,
                  facets: {
                    slug: hotspot.slug,
                    category: hotspot.category,
                    district: hotspot.district,
                    bestSeasons: hotspot.bestSeasons,
                    accessibility: {
                      wheelchairAccessible: hotspot.accessibility?.wheelchairAccessible ?? false,
                    },
                  },
                  node: (
                    <Reveal delayIndex={index % 6} className="h-full">
                      <HotspotCard hotspot={hotspot} preload={index < 3} className="h-full" />
                    </Reveal>
                  ),
                }))}
                emptyNode={<EmptyState datasetEmpty={false} />}
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Either the catalogue is empty (rendered on the server) or nothing matches
 * the filters (rendered by `HotspotResults`, which only reaches it with a
 * filter set, so it always offers the way back).
 */
function EmptyState({ datasetEmpty }: { datasetEmpty: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sunken px-6 py-20 text-center">
      <span className="mb-5 grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
        {datasetEmpty ? (
          <MapPinned className="size-6" aria-hidden />
        ) : (
          <Compass className="size-6" aria-hidden />
        )}
      </span>
      <p className="text-title">
        {datasetEmpty ? "The map is still being drawn" : "No place matches that combination"}
      </p>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        {datasetEmpty
          ? "Places across Manipur's sixteen districts are being catalogued right now. Check back shortly."
          : "Try widening the season, dropping the district, or clearing the accessibility filter."}
      </p>
      {/* A client component so the way back keeps `?view=map`, as the
          rail's own "Clear all" does; see HotspotClearFilters. */}
      {!datasetEmpty && <HotspotClearFilters />}
    </div>
  );
}
