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
import { ExperienceCard } from "@/components/experiences/experience-card";
import {
  CATEGORY_OPTIONS,
  DURATION_BANDS,
  EXPERIENCE_PRICE_BANDS,
  applyExperienceFilters,
  districtOptions,
  parseExperienceFilters,
} from "@/components/experiences/experience-filters";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/content/page-hero";
import { getExperiences } from "@/lib/data";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Experiences in Manipur",
  description:
    "Weave on a loinloom, cook eromba with a Meitei family, paddle a phumdi channel at dawn or learn pung cholom. Book small-group experiences hosted by Manipuris.",
};

export default async function ExperiencesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const state = parseExperienceFilters(params);
  const all = await getExperiences();
  const rows = applyExperienceFilters(all, state);

  const districtCount = new Set(all.map((row) => row.district)).size;
  const durations = all.map((row) => row.durationHours).filter((n): n is number => Number.isFinite(n));
  const prices = all.map((row) => row.pricePerPerson).filter((n): n is number => Number.isFinite(n));
  const shortestHours = durations.length ? `${Math.min(...durations)}` : "—";
  const lowestPrice = prices.length ? formatINR(Math.min(...prices)) : "—";

  return (
    <div className="pb-24">
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
        <FilterBar resultCount={rows.length} resultNoun="experience">
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

        {rows.length === 0 ? (
          <EmptyState
            title={all.length === 0 ? "Experiences are being gathered" : "No experiences match those filters"}
            description={
              all.length === 0
                ? "We are onboarding hosts across the valley and the hills right now. Check back shortly, or browse curated tours in the meantime."
                : "Try widening the price range or clearing the district filter to see everything on offer."
            }
            action={
              <Button asChild variant="outline">
                <Link href="/tours">Browse multi-day tours</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((experience, index) => (
              <li key={experience.id} className="flex">
                <ExperienceCard experience={experience} preload={index < 3} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
