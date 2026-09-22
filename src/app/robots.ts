import type { MetadataRoute } from "next";

import { SITE_URL } from "./sitemap";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Search result pages and authenticated areas are not useful in an
        // index, and the API routes are not pages at all.
        disallow: ["/api/", "/search", "/account", "/dashboard", "/admin"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
