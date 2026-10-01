/**
 * The site's canonical public origin, used for metadata, the sitemap,
 * robots.txt, the share image and links in copied itineraries. A fork that
 * deploys somewhere else changes it here.
 */
export const SITE_URL = "https://discovermanipur.vercel.app";

/** `SITE_URL` without the scheme, for display. */
export const SITE_HOST = new URL(SITE_URL).host;
