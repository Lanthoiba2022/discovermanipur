import type { NextConfig } from "next";

/**
 * Neon Auth is on only when both server-side variables are present and the
 * cookie secret is long enough for `createNeonAuth` (32+ characters) — below
 * that it throws at import. The browser cannot read either variable, so the
 * decision is made here once and inlined as a public boolean; no secret
 * reaches the bundle. See `src/lib/auth/env.ts`.
 */
const authConfigured =
  Boolean(process.env.NEON_AUTH_BASE_URL?.trim()) &&
  (process.env.NEON_AUTH_COOKIE_SECRET?.trim().length ?? 0) >= 32;

// Not fatal — a fork without Neon still builds and serves the catalogue — but
// a production build without auth has sign-in, /account, /admin and the host
// dashboard switched off (see `isDemoAuth` in src/lib/auth/env.ts).
if (process.env.NODE_ENV === "production" && !authConfigured) {
  console.warn(
    "\n[auth] NEON_AUTH_BASE_URL / NEON_AUTH_COOKIE_SECRET (32+ chars) missing: this production build has sign-in disabled.\n",
  );
}

/**
 * Mirrors `isUsable` in `src/lib/db/index.ts`: a postgres:// URL that is not a
 * placeholder copied out of `.env.example`. Keep the two in step. The value is
 * only ever reduced to a boolean here; the URL itself never reaches the bundle.
 */
const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
const dbUsable =
  /^postgres(ql)?:\/\//i.test(databaseUrl) && !/(your|changeme|replace|todo|xxx)/i.test(databaseUrl);

/**
 * Where bookings and the wishlist live, fixed for the life of a deployment:
 * on the signed-in account when both Neon Auth and the database are
 * configured, otherwise in the visitor's browser. It used to come back from
 * the `getBookingMode` Server Action, which cost every anonymous view of a
 * homestay or experience page one function invocation for a value that is
 * known at build time. The client reads this flag synchronously instead.
 */
const bookingMode = authConfigured && dbUsable ? "account" : "browser";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy. Every external origin below is one the site really
 * loads; add to it when a new one appears rather than loosening a directive.
 *
 * - Scripts: Google Maps JS (Kangla 3D map) from maps.googleapis.com, which
 *   pulls its own modules from *.gstatic.com; Vercel Analytics / Speed
 *   Insights load from the site itself in production and from
 *   va.vercel-scripts.com in development; Microsoft Clarity (production only,
 *   see layout.tsx) loads its tag from www.clarity.ms and the recorder from
 *   scripts.clarity.ms. `'unsafe-inline'` is there because
 *   Next.js inlines its bootstrap scripts and a nonce would force every page
 *   to render dynamically; `'wasm-unsafe-eval'` is for the meshopt decoder
 *   that unpacks the Kangla 3D model. `'unsafe-eval'` is development-only
 *   (React uses it for error overlays).
 * - Images are allowed from any https origin: avatars are user-supplied
 *   links, and Places photos redirect to Google's CDN.
 * - Connections: Google map tiles and APIs, OpenStreetMap and Esri tiles,
 *   the MapLibre glyph server for the 2D maps, and Clarity's collectors
 *   (*.clarity.ms, c.bing.com).
 * - `frame-ancestors 'none'` (and X-Frame-Options for old browsers) stops the
 *   site being framed for clickjacking.
 */
const csp = [
  ["default-src", "'self'"],
  ["base-uri", "'self'"],
  ["object-src", "'none'"],
  ["form-action", "'self'"],
  ["frame-ancestors", "'none'"],
  [
    "script-src",
    "'self'",
    "'unsafe-inline'",
    "'wasm-unsafe-eval'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    "https://maps.googleapis.com",
    "https://*.gstatic.com",
    "https://va.vercel-scripts.com",
    "https://www.clarity.ms",
    "https://*.clarity.ms",
  ],
  ["style-src", "'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  ["img-src", "'self'", "data:", "blob:", "https:"],
  ["font-src", "'self'", "data:", "https://fonts.gstatic.com"],
  [
    "connect-src",
    "'self'",
    "data:",
    "blob:",
    ...(isDev ? ["ws:"] : []),
    "https://*.googleapis.com",
    "https://*.gstatic.com",
    "https://*.google.com",
    "https://*.tile.openstreetmap.org",
    "https://server.arcgisonline.com",
    "https://demotiles.maplibre.org",
    "https://va.vercel-scripts.com",
    "https://vitals.vercel-insights.com",
    "https://*.clarity.ms",
    "https://c.bing.com",
  ],
  ["worker-src", "'self'", "blob:"],
  ["media-src", "'self'", "data:", "blob:"],
  ["frame-src", "'self'", "https://*.google.com"],
  ["manifest-src", "'self'"],
  ...(isDev ? [] : [["upgrade-insecure-requests"]]),
]
  .map((directive) => directive.join(" "))
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_AUTH_CONFIGURED: authConfigured ? "true" : "false",
    NEXT_PUBLIC_BOOKING_MODE: bookingMode,
  },
  experimental: {
    serverActions: {
      // Every Server Action here takes a small form; the 1MB default is only
      // room for abuse.
      bodySizeLimit: "128kb",
    },
    /**
     * Client router cache for pages that are rendered per request (today
     * `/community` and `/search`). The default is 0 s, so listing, detail,
     * then the listing link again was a fresh function render each time.
     * With 30 s a repeat link navigation inside that window reuses the copy
     * already in the tab. Back/forward is unaffected (it always restores),
     * and statically generated pages keep their own 5 minute `static`
     * default. A just-submitted vote or listing still shows straight away:
     * a Server Action that calls `updateTag`, `revalidateTag`,
     * `revalidatePath` or sets a cookie (sign-in, sign-out) clears this cache
     * (docs: 01-app/04-glossary.md, "Client Cache"). See
     * 05-config/01-next-config-js/staleTimes.md.
     */
    staleTimes: {
      dynamic: 30,
    },
  },
  async redirects() {
    return [
      // There is one way to list a place now: the community form, where the
      // lister says whether they own it. Old links to the host application
      // land there instead of on a 404.
      { source: "/host/apply", destination: "/community/new", permanent: true },
    ];
  },
  async headers() {
    const privateArea = [
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Cache-Control", value: "private, no-store" },
    ];
    const publicMedia = [
      { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
    ];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/account/:path*", headers: privateArea },
      // Not `/admin`: a header there would tell its 404 apart from any other
      // path's. Its pages are dynamic (never cached) and answer 404 to anyone
      // who is not an admin.
      { source: "/host/dashboard/:path*", headers: privateArea },
      { source: "/auth", headers: privateArea },
      { source: "/auth/:path*", headers: privateArea },
      { source: "/api/auth/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      // Large static media. Vercel serves /public with `max-age=0,
      // must-revalidate` by default, so every repeat view paid a conditional
      // request (an edge request) per file, and the image optimizer, which
      // keeps the larger of `minimumCacheTTL` and this upstream max-age, saw 0.
      // A day fresh plus a week of stale-while-revalidate keeps those requests
      // in the browser and the CDN. Deliberately NOT `immutable`: these names
      // are fixed, the database refers to them by name, and a file can be
      // re-encoded in place (`npm run assets:optimize`), so a change still has
      // to reach visitors within about a day.
      { source: "/file-uploads/:path*", headers: publicMedia },
      { source: "/models/:path*", headers: publicMedia },
      { source: "/audio/:path*", headers: publicMedia },
      { source: "/videos/:path*", headers: publicMedia },
    ];
  },
  images: {
    /**
     * Every optimized variant counts against the Hobby image allowances
     * (source transformations and cache writes), so the cache is long and the
     * set of widths is short.
     *
     * - `minimumCacheTTL`: 31 days. The optimizer keeps a variant for the
     *   larger of this and the source file's own max-age (docs:
     *   02-components/image.md, `minimumCacheTTL`). The 4 hour default
     *   governed until now, so a popular image was re-transformed up to six
     *   times a day. There is no way to purge this cache by URL: a REPLACED
     *   IMAGE MUST GET A NEW FILENAME, or visitors keep seeing the old one for
     *   up to a month (CONTRIBUTING.md, "Photos and attribution").
     * - `deviceSizes`: the defaults minus 750, 2048 and 3840, plus 2560 as the
     *   ceiling for full-bleed heroes on large screens. Every hero here sits
     *   under a dark overlay, so the 2048 to 3840 variants cost a
     *   transformation and a cache entry each for no visible gain. 640 and
     *   1200 MUST stay: the map popups and the Open Graph image URLs request
     *   exactly those widths, and the optimizer answers 400 to a width that is
     *   not in this list or `imageSizes`.
     * - `imageSizes`: the defaults minus 32. The smallest `sizes` in the app is
     *   56px (avatars, table thumbnails), so 32 was never picked.
     * - `formats`: WebP only, stated rather than inherited. AVIF would double
     *   the variants per width and cost more CPU per transform.
     * - `qualities`: the Next 16 default, stated so a later edit sees that
     *   each extra value multiplies the variants too.
     */
    minimumCacheTTL: 2678400,
    deviceSizes: [640, 828, 1080, 1200, 1920, 2560],
    imageSizes: [48, 64, 96, 128, 256, 384],
    formats: ["image/webp"],
    qualities: [75],
    /**
     * This list is an allowlist: naming one path blocks every other local
     * image, so the app's own image roots are here and pin `search: ""`
     * (they are static files and never take a query).
     *
     * Google Places photos (`/api/place-photo?ref=...`) and community photos
     * (`/api/community/photos/...`) are deliberately NOT listed. Both must
     * render `unoptimized` (see `skipsOptimizer` in `src/lib/data/photos.ts`
     * and `CatalogueImage`): the optimizer will not follow the Places
     * redirect and answers 400, Google's terms forbid storing its photo bytes
     * in Vercel's image cache, and a listed community photo would keep a
     * cached copy after an admin takes it down. With neither listed, a call
     * site that forgets `unoptimized` throws in `next dev` (the localPatterns
     * match in next/dist/shared/lib/image-loader.js runs outside production
     * only), so the mistake surfaces before review; in production it gets the
     * same optimizer 400 as before (the optimizer checks this list itself),
     * never a cached copy. The loader's other check, the one that throws on a
     * query string in every environment including production, fires only
     * when this list is the single default `**` entry, so it cannot fire here
     * and take a page down.
     */
    localPatterns: [
      { pathname: "/file-uploads/**", search: "" },
      { pathname: "/videos/**", search: "" },
    ],
  },
};

export default nextConfig;
