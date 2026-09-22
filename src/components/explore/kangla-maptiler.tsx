"use client";

import {
  AttributionControl,
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
  type ErrorEvent,
  type FillExtrusionLayerSpecification,
  type StyleSpecification,
} from "maplibre-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KANGLA_BUILDINGS_GEOJSON,
  KANGLA_CENTER,
  KANGLA_MAP_BOUNDS,
  KANGLA_SITE_GEOJSON,
} from "@/lib/immersive/kangla-places";
import "maplibre-gl/dist/maplibre-gl.css";

/**
 * Kangla in 3D, drawn entirely from MapTiler and OpenStreetMap.
 *
 * Two deliberate choices, both about honesty of the data:
 *
 * 1. MapTiler's own `Building 3D` layer is switched off. Its planet tiles only
 *    carry buildings that already have a height tag, which is ten features over
 *    the whole of Kangla — a flat map wearing a 3D label. Instead the extrusions
 *    come from `kangla-buildings.geojson`: every OSM footprint inside the map's
 *    bounds, each one carrying where its height came from.
 * 2. Nothing is invented. Footprints are as mapped; a building with no height
 *    in OSM is drawn at a flat default and shaded differently so the map never
 *    claims to know a roof it does not know.
 *
 * The camera cannot leave `KANGLA_MAP_BOUNDS`, so this is a map of one place
 * rather than a world map that happens to open there.
 */

const STYLE = "streets-v4";
const MOBILE_WIDTH = 600;
const PITCH_3D = 55;
const BEARING = -18;

/** MapLibre v6 resolves its worker from the bundle directory; see scripts/copy-maplibre-worker.mjs. */
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const zoomFor = (width: number) => (width < MOBILE_WIDTH ? 15.6 : 16);

interface Props {
  apiKey: string;
  tilted: boolean;
  labels: boolean;
  /** Incremented by the Recenter button; the value itself is not read. */
  overview: number;
}

export default function KanglaMapTiler({ apiKey, tilted, labels, overview }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const settings = useRef({ tilted, labels });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    settings.current = { tilted, labels };
  }, [tilted, labels]);

  useEffect(() => {
    const element = host.current;
    if (!element || !apiKey) return;

    let alive = true;
    let instance: MapLibreMap | undefined;
    let observer: ResizeObserver | undefined;
    const request = new AbortController();
    const key = encodeURIComponent(apiKey);
    const fail = (message: string) => {
      if (alive) setError(message);
    };

    async function initialize(container: HTMLDivElement) {
      try {
        const response = await fetch(`https://api.maptiler.com/maps/${STYLE}/style.json?key=${key}`, {
          signal: AbortSignal.any([request.signal, AbortSignal.timeout(15000)]),
        });
        if (!response.ok) {
          fail(
            response.status === 401 || response.status === 403
              ? "MapTiler did not authorise this key for this address. Check the key’s allowed origins — it has to list the origin this page is served from, including the port."
              : "MapTiler could not load the map style. Please try again.",
          );
          return;
        }

        const style: StyleSpecification = await response.json();
        if (!alive) return;

        // MapTiler's sparse extrusions would sit inside ours, z-fighting and
        // disagreeing about heights. One source of buildings, not two.
        for (const layer of style.layers) {
          if (layer.type === "fill-extrusion") layer.layout = { ...layer.layout, visibility: "none" };
        }

        style.sources["kangla-terrain"] = {
          type: "raster-dem",
          url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${key}`,
          tileSize: 256,
          encoding: "mapbox",
          // The tileset itself stops at 14; asking past it returns nothing.
          maxzoom: 14,
        };
        // Imphal sits on a flat valley floor, so this is a true ground surface
        // rather than a dramatic one. Exaggerating it would be a lie about the site.
        style.terrain = { source: "kangla-terrain", exaggeration: 1 };
        style.sky = {
          "sky-color": "#a8c4dd",
          "horizon-color": "#e8e2d4",
          "fog-color": "#efe9dc",
          "sky-horizon-blend": 0.6,
          "horizon-fog-blend": 0.5,
          "fog-ground-blend": 0.2,
        };

        instance = new MapLibreMap({
          container,
          style,
          center: KANGLA_CENTER,
          zoom: zoomFor(container.clientWidth),
          pitch: settings.current.tilted ? PITCH_3D : 0,
          bearing: BEARING,
          maxBounds: KANGLA_MAP_BOUNDS,
          minZoom: 14.8,
          maxZoom: 19,
          maxPitch: 72,
          attributionControl: false,
          canvasContextAttributes: { antialias: true },
        });
        map.current = instance;

        instance.addControl(new NavigationControl({ visualizePitch: true }), "top-right");
        instance.addControl(new ScaleControl({ unit: "metric" }), "bottom-left");
        // The style already credits MapTiler and OpenStreetMap, and both the
        // basemap and the extruded footprints come from exactly those two —
        // a custom string here only prints the same credit twice. It sits
        // bottom-left because the site's concierge button covers the opposite
        // corner, and attribution has to stay readable.
        instance.addControl(new AttributionControl({ compact: true }), "bottom-left");
        instance
          .getCanvas()
          .setAttribute(
            "aria-label",
            "3D map of Kangla and its immediate surroundings. Drag to pan, right-drag to rotate and tilt, or use the zoom and compass controls.",
          );

        observer = new ResizeObserver(() => instance?.resize());
        observer.observe(container);

        instance.on("error", (event: ErrorEvent & { sourceId?: string }) => {
          if (!alive) return;
          if (event.sourceId === "kangla-terrain") {
            // Losing elevation costs almost nothing on this flat site; the
            // buildings are the point, so drop terrain and carry on.
            instance?.setTerrain(null);
            return;
          }
          fail("Some MapTiler map data could not load. Check your connection, then retry.");
        });

        instance.on("load", () => {
          if (!alive || !instance) return;
          addKanglaLayers(instance);
          setReady(true);
        });

        // Probe hooks for scripts/check-kangla.mjs — no UI reads these.
        (window as unknown as { kanglaMap?: MapLibreMap }).kanglaMap = instance;
        instance.on("moveend", () => {
          if (!instance) return;
          container.dataset.center = JSON.stringify(instance.getCenter().toArray());
          container.dataset.zoom = instance.getZoom().toFixed(2);
          container.dataset.pitch = instance.getPitch().toFixed(1);
        });
        instance.on("idle", () => {
          if (!instance || !alive) return;
          container.dataset.buildingCount = String(
            instance.queryRenderedFeatures({ layers: ["kangla-buildings-3d"] }).length,
          );
          container.dataset.terrain = String(!!instance.getTerrain());
        });
      } catch {
        if (alive && !request.signal.aborted) {
          fail("The 3D map could not start. Check your connection and that this browser supports WebGL, then retry.");
        }
      }
    }

    void initialize(element);
    return () => {
      alive = false;
      request.abort();
      observer?.disconnect();
      instance?.remove();
      map.current = null;
      delete (window as unknown as { kanglaMap?: MapLibreMap }).kanglaMap;
    };
  }, [apiKey, retry]);

  const flyHome = useCallback((instance: MapLibreMap) => {
    instance.easeTo({
      center: KANGLA_CENTER,
      zoom: zoomFor(instance.getContainer().clientWidth),
      bearing: BEARING,
      pitch: settings.current.tilted ? PITCH_3D : 0,
      duration: 900,
    });
  }, []);

  useEffect(() => {
    if (!map.current || !ready) return;
    map.current.easeTo({ pitch: tilted ? PITCH_3D : 0, duration: 700 });
  }, [tilted, ready]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    for (const layer of instance.getStyle().layers) {
      if (layer.type === "symbol") instance.setLayoutProperty(layer.id, "visibility", labels ? "visible" : "none");
    }
  }, [labels, ready]);

  useEffect(() => {
    if (!map.current || !ready) return;
    flyHome(map.current);
  }, [overview, ready, flyHome]);

  return (
    <>
      <div
        ref={host}
        className="size-full"
        data-testid="kangla-map"
        data-provider="maptiler"
        data-ready={ready}
        data-view={tilted ? "3d" : "2d"}
        data-labels={labels}
      />
      {!apiKey || error ? (
        <div
          role="alert"
          className="absolute inset-x-5 top-20 mx-auto max-w-md rounded-xl border border-border bg-background p-5 text-sm shadow-lg"
        >
          <p>{!apiKey ? "Add MAP_TILER_API_KEY to .env.local to load the Kangla map." : error}</p>
          {apiKey && (
            <button
              className="mt-3 rounded-md bg-primary px-4 py-2 text-primary-foreground"
              onClick={() => {
                setError("");
                setReady(false);
                setRetry(value => value + 1);
              }}
            >
              Retry map
            </button>
          )}
        </div>
      ) : (
        !ready && (
          <p role="status" className="absolute left-5 top-20 rounded-lg bg-background px-4 py-3 text-sm shadow">
            Loading Kangla’s 3D map…
          </p>
        )
      )}
    </>
  );
}

/**
 * The site's own geometry: moats, the enclosure outline, and the extruded
 * buildings. Inserted under the first symbol layer so MapTiler's place labels
 * stay legible on top of the massing.
 */
function addKanglaLayers(instance: MapLibreMap) {
  const firstLabel = instance.getStyle().layers.find(layer => layer.type === "symbol")?.id;

  instance.addSource("kangla-site", { type: "geojson", data: KANGLA_SITE_GEOJSON });
  instance.addSource("kangla-buildings", { type: "geojson", data: KANGLA_BUILDINGS_GEOJSON });

  instance.addLayer(
    {
      id: "kangla-moat",
      type: "fill",
      source: "kangla-site",
      filter: ["==", ["get", "kind"], "moat"],
      paint: { "fill-color": "#93b3bd", "fill-opacity": 0.55 },
    },
    firstLabel,
  );

  instance.addLayer(
    {
      id: "kangla-boundary",
      type: "line",
      source: "kangla-site",
      filter: ["==", ["get", "kind"], "fort"],
      paint: { "line-color": "#8d492c", "line-width": 2, "line-opacity": 0.85 },
    },
    firstLabel,
  );

  const buildings: FillExtrusionLayerSpecification = {
    id: "kangla-buildings-3d",
    type: "fill-extrusion",
    source: "kangla-buildings",
    minzoom: 14.5,
    paint: {
      "fill-extrusion-height": ["get", "height"],
      "fill-extrusion-base": ["get", "base"],
      // Warm stone where OSM knows the storeys; pale where the height is our
      // default, so the two are told apart on sight and not just in a footnote.
      "fill-extrusion-color": [
        "case",
        ["==", ["get", "heightSource"], "assumed"],
        "#ded5c4",
        ["interpolate", ["linear"], ["get", "height"], 5, "#c8ae8a", 18, "#a98a63"],
      ],
      "fill-extrusion-opacity": 0.95,
      "fill-extrusion-vertical-gradient": true,
    },
  };
  instance.addLayer(buildings, firstLabel);
}
