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

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_AUTH_CONFIGURED: authConfigured ? "true" : "false",
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
    ],
  },
};

export default nextConfig;
