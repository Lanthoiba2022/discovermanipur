import { getHeroSubjects, getHomeStatement, getHomeStats } from "@/lib/data/content";
import type { Metadata } from "next";

import { KanglaTeaser } from "@/components/immersive/kangla-teaser";
import { Hero } from "@/components/hero/hero";
import { ClosingCta } from "@/components/home/closing-cta";
import { ConciergeTeaser } from "@/components/home/concierge-teaser";
import { ExperiencesTeaser } from "@/components/home/experiences-teaser";
import { FeaturedPlaces } from "@/components/home/featured-places";
import { FestivalStrip } from "@/components/home/festival-strip";
import { FourWays } from "@/components/home/four-ways";
import { LayersNarrative } from "@/components/home/layers-narrative";
import { MarqueeStrip } from "@/components/home/marquee-strip";
import { Statement } from "@/components/home/statement";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { getExperiences, getFestivals, getHotspots, getTestimonials } from "@/lib/data";

export const metadata: Metadata = {
  title: "Manipur Tourism — The Land of Jewels",
  description:
    "Floating islands on Loktak, the sangai's last forest, a market run by 5,000 women and a hill that blooms once a year. Plan a Manipur trip with local homestays, hosted experiences, real food and an AI concierge.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Manipur Tourism — The Land of Jewels",
    description:
      "Floating islands, cloud-caught hills and a thousand-year weave. Plan your Manipur journey with Manipur Tourism.",
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

export default async function HomePage() {
  const [heroSubjects, homeStatement, homeStats] = await Promise.all([
    getHeroSubjects(),
    getHomeStatement(),
    getHomeStats(),
  ]);

  const [hotspots, experiences, festivals, testimonials] = await Promise.all([
    getHotspots({ featured: true, limit: 8 }),
    getExperiences({ featured: true, limit: 6 }),
    getFestivals({ featured: true, limit: 6 }),
    getTestimonials(),
  ]);

  return (
    <>
      <Hero subjects={heroSubjects} />
      <MarqueeStrip />
      <Statement statement={homeStatement} stats={homeStats} />
      <FourWays />
      <FeaturedPlaces hotspots={hotspots} />
      <LayersNarrative />
      <KanglaTeaser />
      <ExperiencesTeaser experiences={experiences} />
      <FestivalStrip festivals={festivals} />
      <TestimonialsSection testimonials={testimonials} />
      <ConciergeTeaser />
      <ClosingCta />
    </>
  );
}
