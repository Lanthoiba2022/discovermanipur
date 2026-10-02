/**
 * GET /api/catalogue/hotspot-points
 *
 * Every place on the /hotspots map, as the `MapPoint[]` the map panel
 * renders. Built at build time and served as a static file from the CDN.
 *
 * Why a separate file rather than part of the /hotspots page: the map is an
 * opt-in view (`?view=map`), and each point carries its photo URL, which for
 * a Google Places photo is a ~650 character `/api/place-photo?ref=...` URL.
 * Inlining 100+ of them into the page's flight payload would make every
 * visitor download the map's data to look at the grid. Instead the browser
 * fetches this once, the first time someone opens the map (see
 * `hotspot-results.tsx`), and filters it client-side to the same subset as
 * the grid.
 *
 * `force-static` prerenders the response during the build, so a request is a
 * CDN read rather than a function invocation
 * (node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md,
 * "Caching"). The rows come from the same cached loader as every catalogue
 * page, so a catalogue write that refreshes the hotspot tag refreshes this
 * too. There is deliberately no timed revalidate.
 *
 * The fields and their formatting are exactly what the page built inline
 * before the listing went static. Points are in `getHotspots()` order and
 * only places with coordinates are included.
 */

import type { MapPoint } from "@/components/map/hotspot-map";
import { categoryLabel } from "@/components/places/taxonomy";
import { getHotspots } from "@/lib/data";

export const dynamic = "force-static";

export async function GET() {
  const hotspots = await getHotspots();

  const points: MapPoint[] = hotspots
    .filter((h) => h.coordinates)
    .map((h) => ({
      slug: h.slug,
      name: h.name,
      subtitle: `${h.location} · ${h.district}`,
      category: categoryLabel(h.category),
      image: h.images[0]?.src,
      imageCredit: h.images[0]?.credit,
      lat: h.coordinates.lat,
      lng: h.coordinates.lng,
    }));

  return Response.json(points);
}
