import type { Metadata } from "next";
import { Suspense } from "react";

import {
  EmptyState,
  FilterBar,
  FilterChips,
  FilterRow,
  FilterSelect,
  FilterUrlModeProvider,
  SORT_OPTIONS,
} from "@/components/filters";
import { IntentLink } from "@/components/shared/intent-link";
import { ListingResultCount } from "@/components/listing/listing-grid";
import { UrlSearchBridge } from "@/components/listing/url-search-bridge";
import { TourCard } from "@/components/tours/tour-card";
import {
  DIFFICULTY_OPTIONS,
  TOUR_DURATION_BANDS,
  TOUR_PRICE_BANDS,
  applyTourFilters,
  parseTourFilters,
  themeOptions,
  type TourFacets,
} from "@/components/tours/tour-filters";
import { TourResults } from "@/components/tours/tour-results";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/content/page-hero";
import { getTours } from "@/lib/data";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Curated tours of Manipur",
  description:
    "Multi-day routes across Manipur (Loktak and the valley, the Ukhrul hills, Sangai season, weaving villages and the war trail), with day-by-day itineraries and fixed departures.",
};

/**
 * /tours is prerendered once and served from the CDN.
 *
 * The page reads no request data: every route is rendered here, in
 * `getTours()` order, and `TourResults` filters and sorts the cards in the
 * browser from the query string (copied into the listing store by
 * `UrlSearchBridge`). The filter controls write with `pushState` (client URL
 * mode), so shared links and the back button work exactly as before. Only the
 * fields the filters read travel to the browser as facets.
 */
export default async function ToursPage() {
  const all = await getTours();

  // The unfiltered view, as the browser will order it: what the static HTML
  // counts, and which cards lead it (those get their photos preloaded).
  const defaultRows = applyTourFilters(all, parseTourFilters({}));
  const defaultCount = defaultRows.length;
  const leading = new Set(defaultRows.slice(0, 3).map((row) => row.id));

  const items = all.map((tour) => ({
    key: tour.id,
    facets: {
      durationDays: tour.durationDays,
      difficulty: tour.difficulty,
      themes: tour.themes,
      pricePerPerson: tour.pricePerPerson,
      rating: tour.rating,
      featured: tour.featured,
    } satisfies TourFacets,
    node: <TourCard tour={tour} preload={leading.has(tour.id)} />,
  }));

  const districtCount = new Set(all.flatMap((row) => row.districtsCovered ?? [])).size;
  const durations = all.map((row) => row.durationDays).filter((n): n is number => Number.isFinite(n));
  const prices = all.map((row) => row.pricePerPerson).filter((n): n is number => Number.isFinite(n));
  const dayRange = durations.length
    ? `${Math.min(...durations)}–${Math.max(...durations)}`
    : "—";
  const lowestPrice = prices.length ? formatINR(Math.min(...prices)) : "—";

  return (
    <div className="pb-24">
      <Suspense fallback={null}>
        <UrlSearchBridge />
      </Suspense>

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
        <FilterUrlModeProvider mode="client">
          <FilterBar
            resultCount={defaultCount}
            resultNoun="tour"
            resultSlot={<ListingResultCount total={defaultCount} noun="tour" />}
          >
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
        </FilterUrlModeProvider>

        {all.length === 0 ? (
          <EmptyState
            title="Routes are being mapped"
            description="Our guides are finalising departure dates for the coming season. In the meantime, single-day experiences are already bookable."
            action={
              <Button asChild variant="outline">
                <IntentLink href="/experiences">Browse day experiences</IntentLink>
              </Button>
            }
          />
        ) : (
          <TourResults
            items={items}
            emptyNode={
              <EmptyState
                title="No tours match those filters"
                description="Try a different trip length, or widen the price range. The longer hill routes cost more but cover far more ground."
                action={
                  <Button asChild variant="outline">
                    <IntentLink href="/experiences">Browse day experiences</IntentLink>
                  </Button>
                }
              />
            }
          />
        )}
      </div>
    </div>
  );
}
