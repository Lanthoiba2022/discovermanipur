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
import { Reveal } from "@/components/motion/reveal";
import { CraftCard } from "@/components/store/craft-card";
import {
  CRAFT_PRICE_BANDS,
  CRAFT_SORT_OPTIONS,
  applyCraftFilters,
  craftCategoryOptions,
  craftDistrictOptions,
  parseCraftFilters,
} from "@/components/store/craft-filters";
import { CraftTraditions } from "@/components/store/craft-traditions";
import { NoCommissionBand } from "@/components/store/no-commission-band";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/content/page-hero";
import { getCraftCategories, getCrafts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Buy from the maker",
  description:
    "Handloom, Andro black pottery, bamboo and Manipuri silk, listed with the artisan's own contact details. Manipur Tourism takes no payment and no commission — you buy direct from the maker.",
  openGraph: {
    title: "Buy from the maker | Manipur Tourism",
    description:
      "Manipuri crafts listed with the artisan's own contact details. No cart, no commission — the enquiry and the money go straight to the maker.",
    images: [{ url: "/file-uploads/phanek.jpeg" }],
  },
};

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const [all, categories] = await Promise.all([getCrafts(), getCraftCategories()]);
  const state = parseCraftFilters(params, categories);
  const rows = applyCraftFilters(all, state);

  const districtCount = new Set(all.map((row) => row.district)).size;
  const makerCount = new Set(all.map((row) => row.maker)).size;
  const giCount = all.filter((row) => row.giTagged).length;

  return (
    <div className="pb-24">
      <PageHero
        tone="sand"
        eyebrow="Crafts · direct from the artisan"
        title="Buy from the maker"
        titleScale="display"
        completion="no cart, no commission — the money and the relationship stay in Manipur."
        lede={
          <>
            <p>
              A phanek off a loin loom in Moirang, a wheel-less pot fired in an open pit at Andro,
              cane woven damp so it tightens as it dries.
            </p>
            <p className="mt-4 text-base">
              Every listing carries the artisan&rsquo;s own contact details. Read the story, then
              ring the person who made it.
            </p>
          </>
        }
        figures={[
          { value: String(all.length), label: "Crafts" },
          { value: String(makerCount), label: "Makers" },
          { value: String(districtCount), label: "Districts" },
          { value: String(giCount), label: "GI tagged" },
        ]}
      />

      <div className="shell mt-14 flex flex-col gap-16 md:mt-16">
        <FilterBar resultCount={rows.length} resultNoun="craft">
          <FilterChips
            name="category"
            label="Craft"
            allLabel="Every craft"
            options={craftCategoryOptions(categories)}
          />
          <FilterRow>
            <FilterSelect
              name="district"
              label="District"
              allLabel="All districts"
              options={craftDistrictOptions(all.map((row) => row.district))}
            />
            <FilterSelect
              name="price"
              label="Price"
              allLabel="Any price"
              options={CRAFT_PRICE_BANDS.map((band) => ({ value: band.value, label: band.label }))}
            />
            <FilterSelect
              name="sort"
              label="Sort"
              allLabel="Featured first"
              options={CRAFT_SORT_OPTIONS}
            />
            <FilterToggle name="madeToOrder" label="Made to order" />
            <FilterToggle name="gi" label="GI tagged" />
          </FilterRow>
        </FilterBar>

        {rows.length === 0 ? (
          <EmptyState
            title={all.length === 0 ? "Makers are still being listed" : "No crafts match those filters"}
            description={
              all.length === 0
                ? "We are working through the weaving and pottery clusters, adding makers who want to be found. In the meantime you can go and make the thing yourself."
                : "Try clearing the district or widening the price range — the catalogue is small and deliberately so."
            }
            action={
              <Button asChild variant="outline">
                <Link href="/experiences?category=craft">Browse craft experiences</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((craft, index) => (
              <Reveal as="li" key={craft.id} delayIndex={index % 3} className="flex">
                <CraftCard craft={craft} preload={index < 3} />
              </Reveal>
            ))}
          </ul>
        )}

      </div>

      <div className="shell-mid mt-16 flex flex-col gap-16 md:mt-20">
        <NoCommissionBand />
        <CraftTraditions />
      </div>
    </div>
  );
}
