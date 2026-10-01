import type { MetadataRoute } from "next";

import {
  getCrafts,
  getEateries,
  getExperiences,
  getFestivals,
  getHomestays,
  getHotspots,
  getTours,
} from "@/lib/data";
import { listPublishedSlugs } from "@/lib/community/queries";
import { SITE_URL } from "@/lib/site";

type Entry = MetadataRoute.Sitemap[number];

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: Entry["changeFrequency"] }[] =
  [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/explore/kangla", priority: 0.8, changeFrequency: "monthly" },
    { path: "/hotspots", priority: 0.9, changeFrequency: "weekly" },
    { path: "/homestays", priority: 0.9, changeFrequency: "weekly" },
    { path: "/experiences", priority: 0.9, changeFrequency: "weekly" },
    { path: "/eateries", priority: 0.8, changeFrequency: "weekly" },
    { path: "/tours", priority: 0.8, changeFrequency: "weekly" },
    { path: "/festivals", priority: 0.8, changeFrequency: "monthly" },
    { path: "/store", priority: 0.8, changeFrequency: "weekly" },
    { path: "/community", priority: 0.7, changeFrequency: "daily" },
    { path: "/transport", priority: 0.6, changeFrequency: "monthly" },
    { path: "/plan", priority: 0.7, changeFrequency: "monthly" },
    { path: "/host", priority: 0.5, changeFrequency: "monthly" },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    { path: "/responsible-travel", priority: 0.7, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
    { path: "/accessibility", priority: 0.4, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  ];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // The data layer is still being populated; every one of these may legitimately
  // return an empty array, which simply yields a sitemap of the static routes.
  // `listPublishedSlugs` returns [] when there is no database or the query fails.
  const [hotspots, homestays, experiences, eateries, tours, festivals, crafts, community] =
    await Promise.all([
      getHotspots(),
      getHomestays(),
      getExperiences(),
      getEateries(),
      getTours(),
      getFestivals(),
      getCrafts(),
      listPublishedSlugs(),
    ]);

  const lastModified = new Date();

  const detail = (base: string, rows: { slug: string }[], priority: number): Entry[] =>
    rows.map((row) => ({
      url: `${SITE_URL}${base}/${row.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority,
    }));

  return [
    ...STATIC_ROUTES.map(
      (route): Entry => ({
        url: `${SITE_URL}${route.path === "/" ? "" : route.path}`,
        lastModified,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      }),
    ),
    ...detail("/hotspots", hotspots, 0.8),
    ...detail("/homestays", homestays, 0.8),
    ...detail("/experiences", experiences, 0.7),
    ...detail("/eateries", eateries, 0.6),
    ...detail("/tours", tours, 0.7),
    ...detail("/festivals", festivals, 0.6),
    ...detail("/store", crafts, 0.7),
    ...community.map(
      (row): Entry => ({
        url: `${SITE_URL}/community/${row.slug}`,
        lastModified: new Date(row.updatedAt),
        changeFrequency: "monthly",
        priority: 0.6,
      }),
    ),
  ];
}
