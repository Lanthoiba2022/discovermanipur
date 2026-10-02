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
import { ExperienceCard } from "@/components/experiences/experience-card";
import {
  CATEGORY_OPTIONS,
  DURATION_BANDS,
  EXPERIENCE_PRICE_BANDS,
  applyExperienceFilters,
  districtOptions,
  parseExperienceFilters,
  type ExperienceFacets,
} from "@/components/experiences/experience-filters";
import { ExperienceResults } from "@/components/experiences/experience-results";
import { ListingResultCount } from "@/components/listing/listing-grid";
import { UrlSearchBridge } from "@/components/listing/url-search-bridge";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/content/page-hero";
import { getExperiences } from "@/lib/data";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Experiences in Manipur",
  description:
    "Weave on a loinloom, cook eromba with a Meitei family, paddle a phumdi channel at dawn or learn pung cholom. Book small-group experiences hosted by Manipuris.",
};

/**
 * /experiences is prerendered once and served from the CDN.
 *
 * The page reads no request data: every experience is rendered here, in
 * `getExperiences()` order, and `ExperienceResults` filters and sorts the
 * cards in the browser from the query string (copied into the listing store
 * by `UrlSearchBridge`). The filter controls write with `pushState` (client
 * URL mode), so shared links and the back button work exactly as before. Only
 * the fields the filters read travel to the browser as facets.
 */
export default async function ExperiencesPage() {
  const all = await getExperiences();

  // The unfiltered view, as the browser will order it: what the static HTML
  // counts, and which cards lead it (those get their photos preloaded).
  const defaultRows = applyExperienceFilters(all, parseExperienceFilters({}));
  const defaultCount = defaultRows.length;
  const leading = new Set(defaultRows.slice(0, 3).map((row) => row.id));

  const items = all.map((experience) => ({
    key: experience.id,
    facets: {
      category: experience.category,
      district: experience.district,
      durationHours: experience.durationHours,
      pricePerPerson: experience.pricePerPerson,
      rating: experience.rating,
      featured: experience.featured,
    } satisfies ExperienceFacets,
    node: <ExperienceCard experience={experience} preload={leading.has(experience.id)} />,
  }));

  const districtCount = new Set(all.map((row) => row.district)).size;
  const durations = all.map((row) => row.durationHours).filter((n): n is number => Number.isFinite(n));
  const prices = all.map((row) => row.pricePerPerson).filter((n): n is number => Number.isFinite(n));
  const shortestHours = durations.length ? `${Math.min(...durations)}` : "—";
  const lowestPrice = prices.length ? formatINR(Math.min(...prices)) : "—";

  return (
    <div className="pb-24">
      <Suspense fallback={null}>
        <UrlSearchBridge />
      </Suspense>

      <PageHero
        eyebrow="Do something, not just see something"
        title="Experiences"
        titleScale="display"
        completion="hosted by the person whose craft it actually is."
        lede={
          <p>
            A day at the loom in Wangkhei, black pottery in Andro, a fisherman&rsquo;s dawn on
            Loktak, a kitchen where the eromba is pounded in front of you. Nothing here is a
            demonstration put on for visitors.
          </p>
        }
        figures={[
          { value: String(all.length), label: "Experiences" },
          { value: String(districtCount), label: "Districts" },
          { value: shortestHours, label: "From, hours" },
          { value: lowestPrice, label: "From, per person" },
        ]}
      />

      <div className="shell mt-10 flex flex-col gap-10">
        <FilterUrlModeProvider mode="client">
          <FilterBar
            resultCount={defaultCount}
            resultNoun="experience"
            resultSlot={<ListingResultCount total={defaultCount} noun="experience" />}
          >
            <FilterChips name="category" label="Category" options={CATEGORY_OPTIONS} />
            <FilterRow>
              <FilterSelect
                name="district"
                label="District"
                allLabel="All districts"
                options={districtOptions(all.map((row) => row.district))}
              />
              <FilterSelect
                name="duration"
                label="Duration"
                allLabel="Any length"
                options={DURATION_BANDS.map((band) => ({ value: band.value, label: band.label }))}
              />
              <FilterSelect
                name="price"
                label="Price"
                allLabel="Any price"
                options={EXPERIENCE_PRICE_BANDS.map((band) => ({
                  value: band.value,
                  label: band.label,
                }))}
              />
              <FilterSelect name="sort" label="Sort" allLabel="Featured first" options={SORT_OPTIONS} />
            </FilterRow>
          </FilterBar>
        </FilterUrlModeProvider>

        {all.length === 0 ? (
          <EmptyState
            title="Experiences are being gathered"
            description="We are onboarding hosts across the valley and the hills right now. Check back shortly, or browse curated tours in the meantime."
            action={
              <Button asChild variant="outline">
                <IntentLink href="/tours">Browse multi-day tours</IntentLink>
              </Button>
            }
          />
        ) : (
          <ExperienceResults
            items={items}
            emptyNode={
              <EmptyState
                title="No experiences match those filters"
                description="Try widening the price range or clearing the district filter to see everything on offer."
                action={
                  <Button asChild variant="outline">
                    <IntentLink href="/tours">Browse multi-day tours</IntentLink>
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
