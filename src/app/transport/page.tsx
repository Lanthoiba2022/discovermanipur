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
import { GettingAround } from "@/components/transport/getting-around";
import { TransportCard } from "@/components/transport/transport-card";
import {
  MODE_OPTIONS,
  SEAT_BANDS,
  TRANSPORT_PRICE_BANDS,
  applyTransportFilters,
  parseTransportFilters,
  type TransportFacets,
} from "@/components/transport/transport-filters";
import { TransportResults } from "@/components/transport/transport-results";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/content/page-hero";
import { getTransportOptions } from "@/lib/data";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Getting around Manipur",
  description:
    "Cabs, SUVs, tempos, bikes, shared sumos and buses across Manipur, plus a practical guide to Imphal airport, the Dimapur and Silchar road routes, and Inner Line Permit rules.",
};

/**
 * /transport is prerendered once and served from the CDN.
 *
 * The page reads no request data: every operator is rendered here, in
 * `getTransportOptions()` order, and `TransportResults` filters and sorts the
 * cards in the browser from the query string (copied into the listing store
 * by `UrlSearchBridge`). The filter controls write with `pushState` (client
 * URL mode), so shared links and the back button work exactly as before. Only
 * the fields the filters read travel to the browser as facets.
 */
export default async function TransportPage() {
  const all = await getTransportOptions();

  // The unfiltered view, as the browser will order it: what the static HTML
  // counts, and which cards lead it (those get their photos preloaded).
  const defaultRows = applyTransportFilters(all, parseTransportFilters({}));
  const defaultCount = defaultRows.length;
  const leading = new Set(defaultRows.slice(0, 3).map((row) => row.id));

  const items = all.map((option) => ({
    key: option.id,
    facets: {
      mode: option.mode,
      seats: option.seats,
      pricePerDay: option.pricePerDay,
      rating: option.rating,
      featured: option.featured,
    } satisfies TransportFacets,
    node: <TransportCard option={option} preload={leading.has(option.id)} />,
  }));

  const modeCount = new Set(all.map((row) => row.mode)).size;
  const routeCount = new Set(all.flatMap((row) => row.routes ?? [])).size;
  const dayRates = all.map((row) => row.pricePerDay).filter((n): n is number => Number.isFinite(n));
  const lowestDay = dayRates.length ? formatINR(Math.min(...dayRates)) : "—";

  return (
    <div className="pb-24">
      <Suspense fallback={null}>
        <UrlSearchBridge />
      </Suspense>

      <PageHero
        eyebrow="Getting around"
        title="Wheels & permits"
        titleScale="display"
        completion="hill roads, shared sumos, and the paperwork you sort before you fly."
        lede={
          <p>
            Manipur rewards people who plan their transport first. Hire a vehicle with a driver who
            knows the hill stretches, or ride the shared sumos like everyone else.
          </p>
        }
        figures={[
          { value: String(all.length), label: "Operators" },
          { value: String(modeCount), label: "Modes" },
          { value: String(routeCount), label: "Routes served" },
          { value: lowestDay, label: "From, per day" },
        ]}
      />

      <section aria-label="How to reach and cross Manipur" className="shell-mid mt-16 md:mt-20">
        <GettingAround />
      </section>

      <div className="shell mt-20 flex flex-col gap-10 md:mt-24">
        <div className="border-b border-border-strong pb-6">
          <h2 className="text-headline">Hire a vehicle</h2>
          <p className="text-lead mt-3 text-muted-foreground">
            Verified operators running valley and hill routes, priced per day or per kilometre.
          </p>
        </div>

        <FilterUrlModeProvider mode="client">
          <FilterBar
            resultCount={defaultCount}
            resultNoun="option"
            resultSlot={<ListingResultCount total={defaultCount} noun="option" />}
          >
            <FilterChips name="mode" label="Mode" allLabel="All modes" options={MODE_OPTIONS} />
            <FilterRow>
              <FilterSelect
                name="seats"
                label="Seats"
                allLabel="Any size"
                options={SEAT_BANDS.map((band) => ({ value: band.value, label: band.label }))}
              />
              <FilterSelect
                name="price"
                label="Price"
                allLabel="Any price"
                options={TRANSPORT_PRICE_BANDS.map((band) => ({
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
            title="Operators are being verified"
            description="We are checking licences, insurance and driver references before listing vehicles. The guide above still applies."
            action={
              <Button asChild variant="outline">
                <IntentLink href="/tours">See tours with transport included</IntentLink>
              </Button>
            }
          />
        ) : (
          <TransportResults
            items={items}
            emptyNode={
              <EmptyState
                title="Nothing matches those filters"
                description="Try another mode. Shared sumos cover routes that private cabs will not take on."
                action={
                  <Button asChild variant="outline">
                    <IntentLink href="/tours">See tours with transport included</IntentLink>
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
