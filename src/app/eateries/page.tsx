import type { Metadata } from "next";
import { Suspense } from "react";

import {
  EmptyState,
  FilterBar,
  FilterChips,
  FilterRow,
  FilterSelect,
  FilterToggle,
  FilterUrlModeProvider,
} from "@/components/filters";
import { IntentLink } from "@/components/shared/intent-link";
import { districtOptions } from "@/components/experiences/experience-filters";
import { DishesToKnow } from "@/components/eateries/dishes-to-know";
import { EateryCard } from "@/components/eateries/eatery-card";
import {
  CUISINE_OPTIONS,
  EATERY_SORT_OPTIONS,
  PRICE_RANGE_OPTIONS,
  applyEateryFilters,
  parseEateryFilters,
  type EateryFacets,
} from "@/components/eateries/eatery-filters";
import { EateryResults } from "@/components/eateries/eatery-results";
import { ListingResultCount } from "@/components/listing/listing-grid";
import { UrlSearchBridge } from "@/components/listing/url-search-bridge";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/content/page-hero";
import { getEateries } from "@/lib/data";

export const metadata: Metadata = {
  title: "Where to eat in Manipur",
  description:
    "Eromba, singju, kangshoi and chak-hao kheer: a guide to Manipuri food and the kitchens, canteens and cafés worth planning a day around.",
};

/**
 * /eateries is prerendered once and served from the CDN.
 *
 * The page reads no request data: every kitchen is rendered here, in
 * `getEateries()` order, and `EateryResults` filters and sorts the cards in
 * the browser from the query string (copied into the listing store by
 * `UrlSearchBridge`). The filter controls write with `pushState` (client URL
 * mode), so shared links and the back button work exactly as before. Only the
 * fields the filters read travel to the browser as facets.
 */
export default async function EateriesPage() {
  const all = await getEateries();

  // The unfiltered view, as the browser will order it: what the static HTML
  // counts, and which cards lead it (those get their photos preloaded).
  const defaultRows = applyEateryFilters(all, parseEateryFilters({}));
  const defaultCount = defaultRows.length;
  const leading = new Set(defaultRows.slice(0, 3).map((row) => row.id));

  const items = all.map((eatery) => ({
    key: eatery.id,
    facets: {
      cuisines: eatery.cuisines,
      priceRange: eatery.priceRange,
      district: eatery.district,
      acceptsReservations: eatery.acceptsReservations,
      rating: eatery.rating,
      featured: eatery.featured,
      sortWeight: eatery.sortWeight,
    } satisfies EateryFacets,
    node: <EateryCard eatery={eatery} preload={leading.has(eatery.id)} />,
  }));

  const districtCount = new Set(all.map((row) => row.district)).size;
  const dishCount = new Set(all.flatMap((row) => row.signatureDishes ?? [])).size;
  const reserveCount = all.filter((row) => row.acceptsReservations).length;

  return (
    <div className="pb-24">
      <Suspense fallback={null}>
        <UrlSearchBridge />
      </Suspense>

      <PageHero
        eyebrow="Boiled, fermented, herb-led"
        title="Eat"
        titleScale="display"
        completion="Manipuri cooking barely uses oil; it leans on ngari, river fish and herbs picked that morning."
        image={{
          src: "/file-uploads/manipuri-food-leaf.webp",
          alt: "Manipuri food served on a banana leaf: fried cakes and dried fish.",
        }}
        lede={
          <p>
            A guide to what you will be eating first, and then the kitchens, canteens and hill-town
            cafés that cook it best.
          </p>
        }
        figures={[
          { value: String(all.length), label: "Kitchens" },
          { value: String(districtCount), label: "Districts" },
          { value: String(dishCount), label: "Signature dishes" },
          { value: String(reserveCount), label: "Take reservations" },
        ]}
      />

      <section aria-label="Dishes to know before you order" className="shell-mid mt-16 md:mt-20">
        <DishesToKnow />
      </section>

      <div className="shell mt-20 flex flex-col gap-10 md:mt-24">
        <div className="border-b border-border-strong pb-6">
          <h2 className="text-headline">Where to eat</h2>
          <p className="text-lead mt-3 text-muted-foreground">
            Family kitchens, market canteens, hill-town cafés and the odd fine-dining room.
          </p>
        </div>

        <FilterUrlModeProvider mode="client">
          <FilterBar
            resultCount={defaultCount}
            resultNoun="place"
            resultSlot={<ListingResultCount total={defaultCount} noun="place" />}
          >
            <FilterChips name="cuisine" label="Cuisine" options={CUISINE_OPTIONS} />
            <FilterRow>
              <FilterSelect
                name="price"
                label="Price range"
                allLabel="Any price"
                options={PRICE_RANGE_OPTIONS}
              />
              <FilterSelect
                name="district"
                label="District"
                allLabel="All districts"
                options={districtOptions(all.map((row) => row.district))}
              />
              <FilterSelect
                name="sort"
                label="Sort"
                allLabel="Featured first"
                options={EATERY_SORT_OPTIONS}
              />
              <FilterToggle name="reservations" label="Accepts reservations" />
            </FilterRow>
          </FilterBar>
        </FilterUrlModeProvider>

        {all.length === 0 ? (
          <EmptyState
            title="The directory is being cooked up"
            description="We are still visiting kitchens across the valley and the hills. The dishes above will still be waiting for you."
            action={
              <Button asChild variant="outline">
                <IntentLink href="/experiences">Book a cooking experience instead</IntentLink>
              </Button>
            }
          />
        ) : (
          <EateryResults
            items={items}
            emptyNode={
              <EmptyState
                title="Nothing matches those filters"
                description="Try another cuisine, or turn off the reservations filter. Many of the best places only take walk-ins."
                action={
                  <Button asChild variant="outline">
                    <IntentLink href="/experiences">Book a cooking experience instead</IntentLink>
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
