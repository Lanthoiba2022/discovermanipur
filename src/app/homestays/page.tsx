import type { Metadata } from "next";

import { HomestayCard } from "@/components/homestays/homestay-card";
import { HomestayEmptyState } from "@/components/homestays/homestay-empty-state";
import { HomestayFiltersBar } from "@/components/homestays/homestay-filters";
import {
  applyLocalFilters,
  countActiveFilters,
  parseHomestayFilters,
} from "@/components/homestays/homestay-query";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/content/page-hero";
import { getHomestays } from "@/lib/data";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Homestays in Manipur",
  description:
    "Stay with Manipuri host families — lakeside huts on Loktak, weaver's houses in Imphal and cloud-level lodges in Ukhrul. Filter by district, price, guests and amenities.",
  alternates: { canonical: "/homestays" },
  openGraph: {
    title: "Homestays in Manipur · Manipur Tourism",
    description:
      "Lakeside huts, weavers' houses and hill lodges — book a stay with a Manipuri family.",
    url: "/homestays",
  },
};

export default async function HomestaysPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseHomestayFilters(params);

  const rows = await getHomestays({
    search: filters.q || undefined,
    district: filters.district || undefined,
    sort: filters.sort,
  });

  const results = applyLocalFilters(rows, filters);
  const hasFilters = countActiveFilters(filters) > 0;

  const districtCount = new Set(rows.map((row) => row.district)).size;
  const nightly = rows.map((row) => row.pricePerNight).filter((n): n is number => Number.isFinite(n));
  const lowestNightly = nightly.length ? formatINR(Math.min(...nightly)) : "—";
  const hostCount = new Set(rows.map((row) => row.hostName)).size;

  return (
    <div className="pb-24">
      <PageHero
        eyebrow="Stays"
        title="Homestays"
        titleScale="display"
        completion="a room, a place at the table, and a host who knows which road the fog lifts from."
        image={{
          src: "/file-uploads/hill-village-valley.webp",
          alt: "A hill village spread across a wooded valley floor in Manipur under a bright sky.",
        }}
        lede={
          <p>
            Every homestay here is a family home first — and every booking keeps the money from
            tourism inside the village that hosts you.
          </p>
        }
        figures={[
          { value: String(rows.length), label: "Homestays" },
          { value: String(districtCount), label: "Districts" },
          { value: String(hostCount), label: "Host families" },
          { value: lowestNightly, label: "From, per night" },
        ]}
      />

      <div className="shell">
        <div className="mt-12 md:mt-14">
          <HomestayFiltersBar filters={filters} resultCount={results.length} />
        </div>

        <div className="mt-10">
          {results.length === 0 ? (
            <HomestayEmptyState filtered={hasFilters} />
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((homestay, i) => (
                <Reveal key={homestay.id} as="li" delayIndex={Math.min(i, 6)} className="h-full">
                  <HomestayCard homestay={homestay} preload={i < 4} />
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
