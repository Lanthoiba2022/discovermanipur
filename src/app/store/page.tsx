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
import { ListingResultCount } from "@/components/listing/listing-grid";
import { UrlSearchBridge } from "@/components/listing/url-search-bridge";
import { Reveal } from "@/components/motion/reveal";
import { CraftCard } from "@/components/store/craft-card";
import {
  CRAFT_PRICE_BANDS,
  CRAFT_SORT_OPTIONS,
  applyCraftFilters,
  craftCategoryOptions,
  craftDistrictOptions,
  parseCraftFilters,
  type CraftFacets,
} from "@/components/store/craft-filters";
import { CraftResults } from "@/components/store/craft-results";
import { CraftTraditions } from "@/components/store/craft-traditions";
import { NoCommissionBand } from "@/components/store/no-commission-band";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/content/page-hero";
import { getCraftCategories, getCrafts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Buy from the maker",
  description:
    "Handloom, Andro black pottery, bamboo and Manipuri silk, listed with the artisan's own contact details. Discover Manipur takes no payment and no commission. You buy direct from the maker.",
  openGraph: {
    title: "Buy from the maker | Discover Manipur",
    description:
      "Manipuri crafts listed with the artisan's own contact details. No cart, no commission: the enquiry and the money go straight to the maker.",
    images: [{ url: "/file-uploads/phanek.jpeg" }],
  },
};

/**
 * /store is prerendered once and served from the CDN.
 *
 * The page reads no request data: every active craft is rendered here, in
 * `getCrafts()` order, and `CraftResults` filters and sorts the cards in the
 * browser from the query string (copied into the listing store by
 * `UrlSearchBridge`). The filter controls write with `pushState` (client URL
 * mode), so shared links and the back button work exactly as before. Inactive
 * crafts never leave the server, and only the fields the filters read travel
 * to the browser as facets.
 */
export default async function StorePage() {
  const [all, categories] = await Promise.all([getCrafts(), getCraftCategories()]);

  // The unfiltered view, as the browser will order it: what the static HTML
  // counts, and which cards lead it (those get their photos preloaded).
  const defaultRows = applyCraftFilters(all, parseCraftFilters({}, categories));
  const defaultCount = defaultRows.length;
  const leading = new Set(defaultRows.slice(0, 3).map((row) => row.id));

  const items = all.map((craft, index) => ({
    key: craft.id,
    facets: {
      category: craft.category,
      district: craft.district,
      madeToOrder: craft.madeToOrder,
      giTagged: craft.giTagged,
      price: craft.price,
      featured: craft.featured,
      name: craft.name,
    } satisfies CraftFacets,
    node: (
      <Reveal delayIndex={index % 3} className="flex w-full">
        <CraftCard craft={craft} preload={leading.has(craft.id)} />
      </Reveal>
    ),
  }));

  const districtCount = new Set(all.map((row) => row.district)).size;
  const makerCount = new Set(all.map((row) => row.maker)).size;
  const giCount = all.filter((row) => row.giTagged).length;

  return (
    <div className="pb-24">
      <Suspense fallback={null}>
        <UrlSearchBridge />
      </Suspense>

      <PageHero
        tone="sand"
        eyebrow="Crafts · direct from the artisan"
        title="Buy from the maker"
        titleScale="display"
        completion="no cart, no commission; the money and the relationship stay in Manipur."
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
        <FilterUrlModeProvider mode="client">
          <FilterBar
            resultCount={defaultCount}
            resultNoun="craft"
            resultSlot={<ListingResultCount total={defaultCount} noun="craft" />}
          >
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
        </FilterUrlModeProvider>

        {all.length === 0 ? (
          <EmptyState
            title="Makers are still being listed"
            description="We are working through the weaving and pottery clusters, adding makers who want to be found. In the meantime you can go and make the thing yourself."
            action={
              <Button asChild variant="outline">
                <IntentLink href="/experiences?category=craft">Browse craft experiences</IntentLink>
              </Button>
            }
          />
        ) : (
          <CraftResults
            items={items}
            categories={categories}
            emptyNode={
              <EmptyState
                title="No crafts match those filters"
                description="Try clearing the district or widening the price range. The catalogue is small and deliberately so."
                action={
                  <Button asChild variant="outline">
                    <IntentLink href="/experiences?category=craft">Browse craft experiences</IntentLink>
                  </Button>
                }
              />
            }
          />
        )}
      </div>

      <div className="shell-mid mt-16 flex flex-col gap-16 md:mt-20">
        <NoCommissionBand />
        <CraftTraditions />
      </div>
    </div>
  );
}
