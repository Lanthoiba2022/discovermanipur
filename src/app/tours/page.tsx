import type { Metadata } from "next";
import Link from "next/link";

import {
  EmptyState,
  FilterBar,
  FilterChips,
  FilterRow,
  FilterSelect,
  SORT_OPTIONS,
  type RawSearchParams,
} from "@/components/filters";
import { TourCard } from "@/components/tours/tour-card";
import {
  DIFFICULTY_OPTIONS,
  TOUR_DURATION_BANDS,
  TOUR_PRICE_BANDS,
  applyTourFilters,
  parseTourFilters,
  themeOptions,
} from "@/components/tours/tour-filters";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/content/page-hero";
import { getTours } from "@/lib/data";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Curated tours of Manipur",
  description:
    "Multi-day routes across Manipur — Loktak and the valley, the Ukhrul hills, Sangai season, weaving villages and the war trail — with day-by-day itineraries and fixed departures.",
};

export default async function ToursPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const state = parseTourFilters(params);
  const all = await getTours();
  const rows = applyTourFilters(all, state);

  const districtCount = new Set(all.flatMap((row) => row.districtsCovered ?? [])).size;
  const durations = all.map((row) => row.durationDays).filter((n): n is number => Number.isFinite(n));
  const prices = all.map((row) => row.pricePerPerson).filter((n): n is number => Number.isFinite(n));
  const dayRange = durations.length
    ? `${Math.min(...durations)}–${Math.max(...durations)}`
    : "—";
  const lowestPrice = prices.length ? formatINR(Math.min(...prices)) : "—";

  return (
    <div className="pb-24">
      <PageHero
        eyebrow="Routes, not packages"
        title="Tours"
        titleScale="display"
        completion="multi-day routes planned around distance, weather and what is on that month."
        image={{
          src: "/file-uploads/terraced-valley-dusk.webp",
          alt: "A terraced valley in the Manipur hills at dusk, paddy steps cut into the slope.",
        }}
        lede={
          <p>
            The lily bloom on Shirui, the Sangai in Keibul Lamjao, Yaoshang in the valley. Small
            groups, local guides, and honest day-by-day plans that admit where the road is slow.
          </p>
        }
        figures={[
          { value: String(all.length), label: "Routes" },
          { value: dayRange, label: "Days" },
          { value: String(districtCount), label: "Districts covered" },
          { value: lowestPrice, label: "From, per person" },
        ]}
      />

      <div className="shell mt-10 flex flex-col gap-10">
        <FilterBar resultCount={rows.length} resultNoun="tour">
          <FilterChips
            name="duration"
            label="Trip length"
            allLabel="Any length"
            options={TOUR_DURATION_BANDS.map((band) => ({ value: band.value, label: band.label }))}
          />
          <FilterRow>
            <FilterSelect
              name="difficulty"
              label="Difficulty"
              allLabel="Any difficulty"
              options={DIFFICULTY_OPTIONS}
            />
            <FilterSelect
              name="theme"
              label="Theme"
              allLabel="All themes"
              options={themeOptions(all)}
            />
            <FilterSelect
              name="price"
              label="Price"
              allLabel="Any price"
              options={TOUR_PRICE_BANDS.map((band) => ({ value: band.value, label: band.label }))}
            />
            <FilterSelect name="sort" label="Sort" allLabel="Featured first" options={SORT_OPTIONS} />
          </FilterRow>
        </FilterBar>

        {rows.length === 0 ? (
          <EmptyState
            title={all.length === 0 ? "Routes are being mapped" : "No tours match those filters"}
            description={
              all.length === 0
                ? "Our guides are finalising departure dates for the coming season. In the meantime, single-day experiences are already bookable."
                : "Try a different trip length, or widen the price range — the longer hill routes cost more but cover far more ground."
            }
            action={
              <Button asChild variant="outline">
                <Link href="/experiences">Browse day experiences</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((tour, index) => (
              <li key={tour.id} className="flex">
                <TourCard tour={tour} preload={index < 3} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
