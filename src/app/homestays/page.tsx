import type { Metadata } from "next";
import { Suspense } from "react";

import { HomestayCard } from "@/components/homestays/homestay-card";
import { HomestayEmptyState } from "@/components/homestays/homestay-empty-state";
import { HomestayFiltersBar } from "@/components/homestays/homestay-filters";
import {
  homestaySearchText,
  parseHomestayFilters,
  selectHomestays,
  type HomestayFacets,
} from "@/components/homestays/homestay-query";
import { HomestayResults } from "@/components/homestays/homestay-results";
import { UrlSearchBridge } from "@/components/listing/url-search-bridge";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/content/page-hero";
import { getHomestays } from "@/lib/data";
import { isPriced } from "@/lib/data/sort";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Homestays in Manipur",
  description:
    "Stay with Manipuri host families: lakeside huts on Loktak, weaver's houses in Imphal and cloud-level lodges in Ukhrul. Filter by district, price, guests and amenities.",
  alternates: { canonical: "/homestays" },
  openGraph: {
    title: "Homestays in Manipur · Discover Manipur",
    description:
      "Lakeside huts, weavers' houses and hill lodges. Book a stay with a Manipuri family.",
    url: "/homestays",
    // A page-level `openGraph` replaces the inherited one wholesale, so
    // without its own `images` this page unfurled with no picture at all.
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

/**
 * /homestays is prerendered once and served from the CDN.
 *
 * The page reads no request data: every active stay is rendered here, in
 * `getHomestays()` order, and `HomestayResults` searches, filters and sorts
 * the cards in the browser from the query string (copied into the listing
 * store by `UrlSearchBridge`). Shared links keep working, with the same
 * parameter names and values. Inactive stays never leave the server:
 * `getHomestays()` drops them. The hero figures describe the whole list.
 */
export default async function HomestaysPage() {
  const rows = await getHomestays();

  // The unfiltered view, as the browser will order it: what the static HTML
  // counts, and which cards lead it (those get their photos preloaded).
  const defaultRows = selectHomestays(
    rows.map((row) => ({ ...row, searchText: homestaySearchText(row) })),
    parseHomestayFilters({}),
  );
  const defaultCount = defaultRows.length;
  const leading = new Set(defaultRows.slice(0, 4).map((row) => row.id));

  // Only the fields the filters and sorts read go to the browser, never the
  // whole row; the card itself is rendered here.
  const items = rows.map((homestay, i) => ({
    key: homestay.id,
    facets: {
      searchText: homestaySearchText(homestay),
      district: homestay.district,
      pricePerNight: homestay.pricePerNight,
      maxGuests: homestay.maxGuests,
      amenities: homestay.amenities,
      rating: homestay.rating,
      featured: homestay.featured,
      sortWeight: homestay.sortWeight,
    } satisfies HomestayFacets,
    node: (
      <Reveal delayIndex={Math.min(i, 6)} className="h-full">
        <HomestayCard homestay={homestay} preload={leading.has(homestay.id)} />
      </Reveal>
    ),
  }));

  const districtCount = new Set(rows.map((row) => row.district)).size;
  // Only stays with a published rate: an unpriced stay (stored as 0) is "rate
  // on request", and must not make the whole catalogue look free.
  const nightly = rows.map((row) => row.pricePerNight).filter(isPriced);
  const lowestNightly = nightly.length ? formatINR(Math.min(...nightly)) : "On request";
  const hostCount = new Set(rows.map((row) => row.hostName)).size;

  return (
    <div className="pb-24">
      <Suspense fallback={null}>
        <UrlSearchBridge />
      </Suspense>

      <PageHero
        eyebrow="Stays"
        title="Homestays"
        titleScale="display"
        completion="a room, a place at the table, and a host who knows which road the fog lifts from."
        image={{
          src: "/file-uploads/hill-village-valley.webp",
          alt: "A hill village spread across a wooded valley floor in Manipur under a bright sky.",
        }}
        lede={
          <p>
            Every homestay here is a family home first, and every booking keeps the money from
            tourism inside the village that hosts you.
          </p>
        }
        figures={[
          { value: String(rows.length), label: "Homestays" },
          { value: String(districtCount), label: "Districts" },
          { value: String(hostCount), label: "Host families" },
          { value: lowestNightly, label: "From, per night" },
        ]}
      />

      <div className="shell">
        <div className="mt-12 md:mt-14">
          <HomestayFiltersBar total={defaultCount} />
        </div>

        <div className="mt-10">
          {rows.length === 0 ? (
            <HomestayEmptyState filtered={false} />
          ) : (
            <HomestayResults items={items} emptyNode={<HomestayEmptyState filtered />} />
          )}
        </div>
      </div>
    </div>
  );
}
