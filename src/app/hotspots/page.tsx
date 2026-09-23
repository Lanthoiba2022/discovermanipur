import type { Metadata } from "next";
import Link from "next/link";
import { Compass, MapPinned } from "lucide-react";

import { PageHero } from "@/components/content/page-hero";
import { MapPanel } from "@/components/map/map-panel";
import { HotspotCard } from "@/components/places/hotspot-card";
import { HotspotFilters } from "@/components/places/hotspot-filters";
import {
  categoryLabel,
  PLACEHOLDER_IMAGE,
  uniqueDistricts,
} from "@/components/places/taxonomy";
import { ViewSwitch, type HotspotView } from "@/components/places/view-switch";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { getHotspotCategories, getHotspots } from "@/lib/data";
import type { Hotspot, Season } from "@/types";

export const metadata: Metadata = {
  title: "Places to visit in Manipur",
  description:
    "Every lake, hill, fort, cave and market worth the drive — filter Manipur's destinations by category, district, season and step-free access, then browse them as cards or on a map.",
  openGraph: {
    title: "Places to visit in Manipur · Manipur Tourism",
    description:
      "Filter Manipur's lakes, hills, forts and markets by district and season, then browse them as cards or on a live map.",
    images: [{ url: PLACEHOLDER_IMAGE, width: 1200, height: 630, alt: "A view across Manipur" }],
  },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function HotspotsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const category = first(sp.category);
  const district = first(sp.district);
  const season = first(sp.season);
  const accessible = first(sp.accessible) === "1";
  const view: HotspotView = first(sp.view) === "map" ? "map" : "grid";

  const [all, categories] = await Promise.all([getHotspots(), getHotspotCategories()]);

  const filtered = all.filter((h: Hotspot) => {
    if (category && h.category !== category) return false;
    if (district && h.district !== district) return false;
    if (season && !h.bestSeasons?.includes(season as Season)) return false;
    if (accessible && !h.accessibility?.wheelchairAccessible) return false;
    return true;
  });

  const districts = uniqueDistricts(all);
  const hasFilters = Boolean(category || district || season || accessible);
  const accessibleCount = all.filter((h) => h.accessibility?.wheelchairAccessible).length;

  const points = filtered
    .filter((h) => h.coordinates)
    .map((h) => ({
      slug: h.slug,
      name: h.name,
      subtitle: `${h.location} · ${h.district}`,
      category: categoryLabel(h.category),
      image: h.images[0]?.src,
      imageCredit: h.images[0]?.credit,
      lat: h.coordinates.lat,
      lng: h.coordinates.lng,
    }));

  return (
    <>
      <PageHero
        tone="crimson"
        eyebrow="Discover"
        title="Places"
        completion="lakes that float, hills that catch the cloud, forts that remember kings."
        lede={
          <p>
            {all.length > 0 ? `${all.length} places` : "A growing map"} across Manipur&rsquo;s
            sixteen districts, filtered the way you actually travel — by season, by district, and
            by whether you can get a wheelchair to the water.
          </p>
        }
        image={{
          src: "/file-uploads/loktak-phumdi-hut.webp",
          alt: "A fisherman's hut standing on a phumdi island among the open water of Loktak Lake.",
        }}
        figures={[
          {
            value: String(filtered.length),
            label: hasFilters ? "Match your filters" : "Places mapped",
          },
          { value: String(districts.length), label: "Districts" },
          { value: String(categories.length), label: "Categories" },
          { value: String(accessibleCount), label: "Step-free" },
        ]}
      />

      <section aria-labelledby="places-results" className="shell py-16 md:py-24">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <h2 id="places-results" className="text-title">
            {hasFilters ? "Filtered places" : "All places"}
          </h2>
          <ViewSwitch value={view} />
        </div>

        <div className="grid gap-10 lg:grid-cols-[18rem_1fr] lg:gap-12">
          <aside aria-label="Filter places">
            <HotspotFilters
              categories={categories}
              districts={districts}
              value={{ category, district, season, accessible }}
              resultCount={filtered.length}
            />
          </aside>

          <div className="min-w-0">
            {filtered.length === 0 ? (
              <EmptyState hasFilters={hasFilters} datasetEmpty={all.length === 0} />
            ) : view === "map" ? (
              <MapPanel
                points={points}
                className="h-[70vh] min-h-[28rem]"
                ariaLabel={`Map of ${points.length} places in Manipur`}
              />
            ) : (
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((hotspot, index) => (
                  <Reveal as="li" key={hotspot.id || hotspot.slug} delayIndex={index % 6}>
                    <HotspotCard hotspot={hotspot} preload={index < 3} className="h-full" />
                  </Reveal>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function EmptyState({
  hasFilters,
  datasetEmpty,
}: {
  hasFilters: boolean;
  datasetEmpty: boolean;
}) {
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
      {hasFilters && (
        <Button asChild variant="outline" size="pill" className="mt-7">
          <Link href="/hotspots">Clear all filters</Link>
        </Button>
      )}
    </div>
  );
}
