import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
