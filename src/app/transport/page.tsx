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
import { GettingAround } from "@/components/transport/getting-around";
import { TransportCard } from "@/components/transport/transport-card";
import {
  MODE_OPTIONS,
  SEAT_BANDS,
  TRANSPORT_PRICE_BANDS,
  applyTransportFilters,
  parseTransportFilters,
} from "@/components/transport/transport-filters";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/content/page-hero";
import { getTransportOptions } from "@/lib/data";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Getting around Manipur",
  description:
    "Cabs, SUVs, tempos, bikes, shared sumos and buses across Manipur — plus a practical guide to Imphal airport, the Dimapur and Silchar road routes, and Inner Line Permit rules.",
};

export default async function TransportPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const state = parseTransportFilters(params);
  const all = await getTransportOptions();
  const rows = applyTransportFilters(all, state);

  const modeCount = new Set(all.map((row) => row.mode)).size;
  const routeCount = new Set(all.flatMap((row) => row.routes ?? [])).size;
  const dayRates = all.map((row) => row.pricePerDay).filter((n): n is number => Number.isFinite(n));
  const lowestDay = dayRates.length ? formatINR(Math.min(...dayRates)) : "—";

  return (
    <div className="pb-24">
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

        <FilterBar resultCount={rows.length} resultNoun="option">
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

        {rows.length === 0 ? (
          <EmptyState
            title={all.length === 0 ? "Operators are being verified" : "Nothing matches those filters"}
            description={
              all.length === 0
                ? "We are checking licences, insurance and driver references before listing vehicles. The guide above still applies."
                : "Try another mode — shared sumos cover routes that private cabs will not take on."
            }
            action={
              <Button asChild variant="outline">
                <Link href="/tours">See tours with transport included</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((option, index) => (
              <li key={option.id} className="flex">
                <TransportCard option={option} preload={index < 3} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
