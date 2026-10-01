import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Search result pages, sign-in and the signed-in areas are not useful
        // in an index, and the API routes are not pages at all. This only
        // asks politely: the private areas are protected by their own checks.
        disallow: [
          "/api/",
          "/search",
          "/auth",
          "/access-denied",
          "/account",
          "/admin",
          "/host/dashboard",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
