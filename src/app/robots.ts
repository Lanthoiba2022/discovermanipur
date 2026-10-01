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
        // `/admin` is not listed on purpose: naming it here would advertise it.
        // It answers 404 to non-admins and sends `X-Robots-Tag: noindex`.
        disallow: [
          "/api/",
          "/search",
          "/auth",
          "/access-denied",
          "/account",
          "/host/dashboard",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
