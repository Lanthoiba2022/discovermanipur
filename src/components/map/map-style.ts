import type { MapOptions } from "maplibre-gl";

/** The object form of MapLibre's `style` option (i.e. not a URL string). */
export type MapStyle = Exclude<NonNullable<MapOptions["style"]>, string>;

/**
 * A key-free raster basemap built straight from the OpenStreetMap standard
 * tile layer. No token, no vendor account; it just renders.
 */
export const OSM_RASTER_STYLE: MapStyle = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    { id: "osm-background", type: "background", paint: { "background-color": "#e9e3d3" } },
    { id: "osm-tiles", type: "raster", source: "osm", minzoom: 0, maxzoom: 19 },
  ],
};

/** Manipur's approximate centre, the fallback view when nothing is plotted. */
export const MANIPUR_CENTER: [number, number] = [93.9368, 24.817];
