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
  },
  experimental: {
    serverActions: {
      // Every Server Action here takes a small form; the 1MB default is only
      // room for abuse.
      bodySizeLimit: "128kb",
    },
  },
  async headers() {
    const privateArea = [
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Cache-Control", value: "private, no-store" },
    ];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/account/:path*", headers: privateArea },
      // Not `/admin`: a header there would tell its 404 apart from any other
      // path's. Its pages are dynamic (never cached) and answer 404 to anyone
      // who is not an admin.
      { source: "/host/dashboard/:path*", headers: privateArea },
      { source: "/auth", headers: privateArea },
      { source: "/api/auth/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
  images: {
    /**
     * `next/image` refuses a local `src` carrying a query string unless the
     * path is listed here, and the catalogue resolves Google Places photos
     * through `/api/place-photo?ref=…` at request time (see
     * `src/lib/data/photos.ts`). Without this the optimizer threw during
     * render and took the whole page down with a 500.
     *
     * Note this list is an allowlist: naming one path blocks every other
     * local image, so the app's own image roots have to be here too. They
     * pin `search: ""` — they are static files and never take a query.
     *
     * `/api/place-photo` cannot pin a `search`, because the value is a
     * per-photo Google reference. The exposure that leaves is bounded by the
     * route itself, which validates the `ref` shape and signs the upstream
     * call; nothing else under `/api` is listed.
     */
    localPatterns: [
      { pathname: "/file-uploads/**", search: "" },
      { pathname: "/videos/**", search: "" },
      { pathname: "/api/place-photo" },
      // Community photos (`/api/community/photos/...`) are deliberately NOT
      // listed: they are already resized WebP and always render `unoptimized`
      // (which skips this check). Listing them would let `/_next/image` keep
      // its own cached copy of a photo after an admin takes it down.
    ],
  },
};

export default nextConfig;
