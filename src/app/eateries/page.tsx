import type { Metadata } from "next";
import Link from "next/link";

import {
  EmptyState,
  FilterBar,
  FilterChips,
  FilterRow,
  FilterSelect,
  FilterToggle,
  type RawSearchParams,
} from "@/components/filters";
import { districtOptions } from "@/components/experiences/experience-filters";
import { DishesToKnow } from "@/components/eateries/dishes-to-know";
import { EateryCard } from "@/components/eateries/eatery-card";
import {
  CUISINE_OPTIONS,
  EATERY_SORT_OPTIONS,
  PRICE_RANGE_OPTIONS,
  applyEateryFilters,
  parseEateryFilters,
} from "@/components/eateries/eatery-filters";
import { Button } from "@/components/ui/button";
import { ListingHero } from "@/components/content/listing-hero";
import { getEateries } from "@/lib/data";

export const metadata: Metadata = {
  title: "Where to eat in Manipur",
  description:
    "Eromba, singju, kangshoi and chak-hao kheer — a guide to Manipuri food and the kitchens, canteens and cafés worth planning a day around.",
};

export default async function EateriesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const state = parseEateryFilters(params);
  const all = await getEateries();
  const rows = applyEateryFilters(all, state);

  const districtCount = new Set(all.map((row) => row.district)).size;
  const dishCount = new Set(all.flatMap((row) => row.signatureDishes ?? [])).size;
  const reserveCount = all.filter((row) => row.acceptsReservations).length;

  return (
    <div className="pb-24">
      <ListingHero
        eyebrow="Boiled, fermented, herb-led"
        title="The food story of Manipur"
        lede={
          <p>
            Manipuri cooking barely uses oil. It leans on ngari, on river fish, on chillies roasted
            over a flame and on herbs picked that morning. This is a guide to what you will be
            eating first — and then the places that cook it best.
          </p>
        }
        figures={[
          { value: String(all.length), label: "Kitchens" },
          { value: String(districtCount), label: "Districts" },
          { value: String(dishCount), label: "Signature dishes" },
          { value: String(reserveCount), label: "Take reservations" },
        ]}
      />

      <div className="shell mt-12">
        <DishesToKnow />
      </div>

      <div className="shell mt-16 flex flex-col gap-10">
        <div>
          <h2 className="font-display text-3xl">Where to eat</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Family kitchens, market canteens, hill-town cafés and the odd fine-dining room.
          </p>
        </div>

        <FilterBar resultCount={rows.length} resultNoun="place">
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

        {rows.length === 0 ? (
          <EmptyState
            title={all.length === 0 ? "The directory is being cooked up" : "Nothing matches those filters"}
            description={
              all.length === 0
                ? "We are still visiting kitchens across the valley and the hills. The dishes above will still be waiting for you."
                : "Try another cuisine, or turn off the reservations filter — many of the best places only take walk-ins."
            }
            action={
              <Button asChild variant="outline">
                <Link href="/experiences">Book a cooking experience instead</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((eatery, index) => (
              <li key={eatery.id} className="flex">
                <EateryCard eatery={eatery} preload={index < 3} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
