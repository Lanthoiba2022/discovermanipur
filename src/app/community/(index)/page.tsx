import { CloudOff, type LucideIcon, PlugZap, Plus, ThumbsUp } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PageHero } from "@/components/content/page-hero";
import { CommunitySearch } from "@/components/community/community-filters";
import { PlaceCard } from "@/components/community/place-card";
import { VerificationRules } from "@/components/community/verification-rules";
import {
  EmptyState,
  FilterBar,
  FilterChips,
  FilterRow,
  FilterSelect,
  readOneOf,
  readParam,
  type RawSearchParams,
} from "@/components/filters";
import { IntentLink } from "@/components/shared/intent-link";
import { Button } from "@/components/ui/button";
import { isAuthConfigured } from "@/lib/auth/env";
import { listPublishedCards } from "@/lib/community/public-reads";
import { UPVOTES_REQUIRED, VOTING_WINDOW_HOURS } from "@/lib/community/rules";
import { CATEGORIES, CATEGORY_SHORT_LABELS, DISTRICTS } from "@/lib/community/taxonomy";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata: Metadata = {
  title: "Community places",
  description: `Attractions, cafes, homestays and craft makers across Manipur, listed by the community and published once ${UPVOTES_REQUIRED} verified users have upvoted them.`,
  openGraph: {
    title: "Community places · Discover Manipur",
    description:
      "Places in Manipur listed by the people who know them, and published by verified votes from the community.",
    // A page-level `openGraph` replaces the inherited one wholesale, images
    // included, so the shared card has to be named here again.
    images: [
      {
        url: "/og/discover-manipur.jpg",
        width: 1200,
        height: 630,
        alt: "Discover Manipur: floating islands, cloud-caught hills and a thousand-year weave",
      },
    ],
  },
};

/** How many places one page shows. There is no pagination yet; filters narrow it. */
const PAGE_LIMIT = 60;

const CATEGORY_OPTIONS = CATEGORIES.map((value) => ({ value, label: CATEGORY_SHORT_LABELS[value] }));
const DISTRICT_OPTIONS = DISTRICTS.map((value) => ({ value, label: value }));

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const category = readOneOf(params, "category", CATEGORIES);
  const district = readOneOf(params, "district", DISTRICTS);
  const q = readParam(params, "q")?.trim().slice(0, 100) || undefined;
  const hasFilters = Boolean(category || district || q);

  const available = isAuthConfigured && isDatabaseConfigured;
  // A cached read of every published card, filtered in memory, so a signed-out
  // visit costs no database query once it is warm (`public-reads.ts`).
  // `ok: false` is a failed read, which is not the same as nothing published.
  const result = available
    ? await listPublishedCards({ category, district, q, limit: PAGE_LIMIT })
    : ({ ok: true, places: [] } as const);
  const places = result.ok ? result.places : [];

  return (
    <div className="pb-24">
      <PageHero
        tone="sand"
        eyebrow="Community"
        title="Places added by the community"
        completion="listed by people who know them, published when other members vouch for them."
        lede={
          <p>
            Hidden corners, family kitchens, homestays and weavers that a guidebook can miss. Anyone
            with a verified account can list a place, and it goes public once {UPVOTES_REQUIRED}{" "}
            verified users upvote it within {VOTING_WINDOW_HOURS} hours.
          </p>
        }
        figures={[
          { value: String(UPVOTES_REQUIRED), label: "Upvotes to publish" },
          { value: String(VOTING_WINDOW_HOURS), label: "Hours to collect them" },
          { value: String(CATEGORIES.length), label: "Kinds of place" },
          { value: String(DISTRICTS.length), label: "Districts" },
        ]}
      >
        {available && (
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="primary" size="pill">
              <IntentLink href="/community/new">
                <Plus aria-hidden="true" />
                Add a place
              </IntentLink>
            </Button>
            <Button asChild variant="outline" size="pill">
              <IntentLink href="/community/verify">
                <ThumbsUp aria-hidden="true" />
                Help verify new places
              </IntentLink>
            </Button>
          </div>
        )}
      </PageHero>

      <div className="shell mt-16 flex flex-col gap-10 md:mt-20">
        {!available ? (
          <Unavailable icon={PlugZap} title="Community places are not available here">
            This copy of the site is running without a database or sign-in, so community listings
            are switched off. The rest of the site works as normal.
          </Unavailable>
        ) : !result.ok ? (
          <Unavailable icon={CloudOff} title="Community places are temporarily unavailable">
            We could not load community places just now. Please try again in a few minutes. The
            rest of the site works as normal.
          </Unavailable>
        ) : (
          <>
            <div className="border-b border-border-strong pb-6">
              <h2 className="text-headline">Published places</h2>
              <p className="text-lead mt-3 text-muted-foreground">
                Every place here has passed the community vote. Newest first.
              </p>
            </div>

            <FilterBar resultCount={places.length} resultNoun="place">
              <CommunitySearch />
              <FilterChips name="category" label="Kind of place" options={CATEGORY_OPTIONS} />
              <FilterRow>
                <FilterSelect
                  name="district"
                  label="District"
                  allLabel="All districts"
                  options={DISTRICT_OPTIONS}
                />
              </FilterRow>
            </FilterBar>

            {places.length === 0 ? (
              hasFilters ? (
                <EmptyState
                  title="No published place matches those filters"
                  description="Try another district or kind of place, or clear the search. If you know somewhere that belongs here, you can list it."
                  action={
                    <div className="flex flex-wrap justify-center gap-3">
                      <Button asChild variant="outline" size="pill">
                        <IntentLink href="/community">Clear all filters</IntentLink>
                      </Button>
                      <Button asChild variant="primary" size="pill">
                        <IntentLink href="/community/new">Add a place</IntentLink>
                      </Button>
                    </div>
                  }
                />
              ) : (
                <EmptyState
                  title="No community places have been published yet"
                  description={`Be the first to add one. Once ${UPVOTES_REQUIRED} verified users upvote it within ${VOTING_WINDOW_HOURS} hours, it appears here for everyone.`}
                  action={
                    <div className="flex flex-wrap justify-center gap-3">
                      <Button asChild variant="primary" size="pill">
                        <IntentLink href="/community/new">Add the first place</IntentLink>
                      </Button>
                      <Button asChild variant="outline" size="pill">
                        <IntentLink href="/community/verify">See places waiting for votes</IntentLink>
                      </Button>
                    </div>
                  }
                />
              )
            ) : (
              <>
                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {places.map((place, index) => (
                    <li key={place.id} className="flex">
                      <PlaceCard place={place} preload={index < 3} />
                    </li>
                  ))}
                </ul>
                {places.length >= PAGE_LIMIT && (
                  <p className="text-sm text-muted-foreground">
                    Showing the {PAGE_LIMIT} most recently published places. Use the filters to find
                    others.
                  </p>
                )}
              </>
            )}
          </>
        )}

        <VerificationRules className="mt-6" />
      </div>
    </div>
  );
}

/**
 * Why there is no list to show, said calmly: a copy of the site running
 * without a database or sign-in, or a read that failed just now (an outage,
 * which must not be presented as "nothing published yet").
 */
function Unavailable({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sand px-6 py-20 text-center">
      <span className="mask-arch grid size-14 place-items-center bg-surface text-[var(--stone-700)] shadow-[var(--shadow-sm)]">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-display text-2xl">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{children}</p>
      <div className="mt-6">
        <Button asChild variant="outline" size="pill">
          <IntentLink href="/hotspots">Browse places to visit</IntentLink>
        </Button>
      </div>
    </div>
  );
}
