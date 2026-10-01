import type { Metadata } from "next";

import { CelebrationBand } from "@/components/landing/bands/celebration";
import { CraftsBand } from "@/components/landing/bands/crafts";
import { DestinationsBand } from "@/components/landing/bands/destinations";
import { DiariesBand } from "@/components/landing/bands/diaries";
import { ExperiencesBand } from "@/components/landing/bands/experiences";
import { GetStartedBand } from "@/components/landing/bands/get-started";
import { ItinerariesBand } from "@/components/landing/bands/itineraries";
import { LesserKnownBand } from "@/components/landing/bands/lesser-known";
import { LandingHero } from "@/components/landing/hero";
import { SideTab } from "@/components/landing/side-tab";
import { KanglaTeaser } from "@/components/immersive/kangla-teaser";
import {
  getCrafts,
  getExperiences,
  getFestivals,
  getHotspots,
  getTestimonials,
  getTours,
} from "@/lib/data";
import { getHomeStats } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "Discover Manipur: The Land of Jewels",
  description:
    "Floating islands on Loktak, the sangai's last forest, a market run by 5,000 women and a hill that blooms once a year. Plan a Manipur trip with local homestays, hosted experiences, real food and an AI concierge.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Discover Manipur: The Land of Jewels",
    description:
      "Floating islands, cloud-caught hills and a thousand-year weave. Plan your Manipur journey with Discover Manipur.",
    url: "/",
    type: "website",
    images: [
      {
        url: "/file-uploads/loktakComplete.png",
        width: 2160,
        height: 1350,
        alt: "Aerial view of the floating phumdi islands of Loktak Lake, Manipur.",
      },
    ],
  },
};

/**
 * The landing page: a full-bleed film, then a run of bands that each open with
 * one enormous word and finish the sentence in an italic line, on a ground that
 * alternates photo → sand → ivory → crimson.
 *
 * `LandingHero` must stay first: it carries `data-hero-tone="dark"`, which the
 * fixed header reads in CSS to flip its wordmark to ivory on the first paint.
 */
export default async function HomePage() {
  const [featuredSpots, allSpots, experiences, tours, festivals, crafts, testimonials, stats] =
    await Promise.all([
      getHotspots({ featured: true, limit: 8 }),
      getHotspots({ limit: 60 }),
      getExperiences({ featured: true, limit: 8 }),
      getTours({ featured: true, limit: 6 }),
      getFestivals({ featured: true, limit: 8 }),
      getCrafts({ featured: true, limit: 8 }),
      getTestimonials(),
      getHomeStats(),
    ]);

  // The quiet half of the catalogue: everything the featured rail skips.
  const lesserKnown = allSpots.filter((spot) => !spot.featured).slice(0, 8);

  return (
    <>
      <LandingHero />
      <SideTab />

      <DestinationsBand hotspots={featuredSpots} />
      <ExperiencesBand experiences={experiences} />
      <ItinerariesBand tours={tours} />
      <CelebrationBand festivals={festivals} />
      <KanglaTeaser />
      <CraftsBand crafts={crafts} />
      <LesserKnownBand hotspots={lesserKnown} />
      <DiariesBand testimonials={testimonials} />
      <GetStartedBand stats={stats} />
    </>
  );
}
