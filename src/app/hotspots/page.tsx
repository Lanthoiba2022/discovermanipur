import type { Metadata } from "next";
import Link from "next/link";
import { Compass, MapPinned } from "lucide-react";

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
      lat: h.coordinates.lat,
      lng: h.coordinates.lng,
    }));

  return (
    <main id="main">
      {/* ---------------------------------------------------------- hero band */}
      <section
        data-hero-tone="dark"
        className="relative overflow-hidden bg-primary text-primary-foreground pt-28 md:pt-32"
      >
        <div
          aria-hidden
          className="blob-phumdi animate-float-slow absolute -right-24 -top-16 size-[28rem] bg-secondary/25 blur-3xl"
        />
        <div className="shell relative pb-16 md:pb-24">
          <p className="eyebrow mb-5 flex items-center gap-3 text-brass-400">
            <span className="weave-rule inline-block h-[3px] w-10 rounded-full" />
            Discover
          </p>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <h1 className="text-display">Places</h1>
              <p className="text-lead mt-7 max-w-[52ch] text-ivory-200">
                Floating islands that hold up villages, hills that catch the cloud, forts that
                remember kings. {all.length > 0 ? `${all.length} places` : "A growing map"} across
                Manipur&apos;s sixteen districts — filtered the way you actually travel.
              </p>
            </div>

            {/* brass-400 rather than the brass-500 accent: against the crimson
                ground the darker step only just clears large-text contrast. */}
            <dl className="grid grid-cols-2 gap-x-8 gap-y-7 self-end lg:col-span-4 lg:col-start-9">
              <div className="border-t border-ningthou-700 pt-4">
                <dd className="font-display text-4xl leading-none text-brass-400">
                  {filtered.length}
                </dd>
                <dt className="eyebrow mt-2.5 text-ivory-200/70">
                  {hasFilters ? "Match your filters" : "Places mapped"}
                </dt>
              </div>
              <div className="border-t border-ningthou-700 pt-4">
                <dd className="font-display text-4xl leading-none text-brass-400">
                  {districts.length}
                </dd>
                <dt className="eyebrow mt-2.5 text-ivory-200/70">Districts</dt>
              </div>
              <div className="border-t border-ningthou-700 pt-4">
                <dd className="font-display text-4xl leading-none text-brass-400">
                  {categories.length}
                </dd>
                <dt className="eyebrow mt-2.5 text-ivory-200/70">Categories</dt>
              </div>
              <div className="border-t border-ningthou-700 pt-4">
                <dd className="font-display text-4xl leading-none text-brass-400">
                  {accessibleCount}
                </dd>
                <dt className="eyebrow mt-2.5 text-ivory-200/70">Step-free</dt>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ filters + list */}
      <section className="shell py-12 md:py-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-2xl">
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
    </main>
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
      <p className="font-display text-2xl">
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
