"use client";

import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  AttributionControl,
  setWorkerUrl,
  type StyleSpecification,
} from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

import {
  KANGLA_OVERVIEW,
  KANGLA_SITE_GEOJSON,
  kanglaMapAttribution,
  kanglaPlaces,
  type KanglaPlace,
} from "@/lib/immersive/kangla-places";

import "maplibre-gl/dist/maplibre-gl.css";

/**
 * The site level of the Kangla experience: the real fort, from the air, in 3D.
 *
 * Satellite imagery carries the ground truth — the moats, the citadel and the
 * tree cover are all legible in it — and the OpenStreetMap footprints are
 * extruded on top so the buildings have height when the camera is pitched.
 * Heights are a flat 8 m because OSM carries no `height` tag for any building
 * inside Kangla; they are there to read as massing, not as measured storeys.
 */

const PIN_COLOURS: Record<KanglaPlace["kind"], string> = {
  guardian: "#c08a2e",
  temple: "#9b2335",
  gate: "#2c4a38",
  hall: "#7a1729",
  museum: "#4a4038",
  water: "#2f6b8a",
};

const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      // Esri serves real imagery over Imphal to z18; z19+ returns a "Map data
      // not available" placeholder. Declaring 18 makes MapLibre overzoom the
      // last real tile instead of requesting the placeholder, so the landmark
      // close-ups stay on photography rather than going blank.
      maxzoom: 18,
      attribution: kanglaMapAttribution,
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#0e0c0b" } },
    { id: "satellite", type: "raster", source: "satellite" },
  ],
};

function pinElement(place: KanglaPlace, onSelect: (id: string) => void): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.dataset.placeId = place.id;
  el.setAttribute("aria-label", `${place.name} — show details`);
  el.style.cssText = [
    "display:grid",
    "place-items:center",
    "width:30px",
    "height:30px",
    "padding:0",
    "border-radius:999px",
    `border:2px solid ${PIN_COLOURS[place.kind]}`,
    "background:rgba(251,248,243,.94)",
    `color:${PIN_COLOURS[place.kind]}`,
    "font:600 12px/1 ui-monospace,monospace",
    "cursor:pointer",
    "box-shadow:0 6px 18px -6px rgba(14,12,11,.7)",
    "transition:transform 180ms cubic-bezier(.22,1,.36,1)",
  ].join(";");
  el.textContent = String(kanglaPlaces.indexOf(place) + 1).padStart(2, "0");
  el.addEventListener("click", (event) => {
    event.stopPropagation();
    onSelect(place.id);
  });
  return el;
}

export default function KanglaSiteMap({
  selectedId,
  onSelect,
  tilted = true,
  buildings = false,
  overview = 0,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  tilted?: boolean;
  buildings?: boolean;
  overview?: number;
}) {
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const options = useRef({ tilted, buildings, selectedId });
  useEffect(() => { options.current = { tilted, buildings, selectedId }; }, [tilted, buildings, selectedId]);
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef<Map<string, Marker>>(new Map());

  // The select handler lives in a ref so that a new callback identity from the
  // parent never re-runs the setup effect and tears the whole map down.
  const selectRef = useRef(onSelect);
  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    // MapLibre v6 loads its worker as a separate ESM chunk resolved from
    // `import.meta.url`, which does not survive bundling: the worker fails to
    // start, raster tiles keep rendering (they decode on the main thread) and
    // every GeoJSON source stays silently empty. The chunk is republished to
    // /maplibre/ by scripts/copy-maplibre-worker.mjs.
    setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

    let instance: MapLibreMap;
    try { instance = new MapLibreMap({
      container: el,
      style: SATELLITE_STYLE,
      center: KANGLA_OVERVIEW.center,
      zoom: KANGLA_OVERVIEW.zoom,
      pitch: options.current.tilted ? KANGLA_OVERVIEW.pitch : 0,
      bearing: KANGLA_OVERVIEW.bearing,
      maxPitch: 75,
      attributionControl: false,
      // The fort is 750 x 1300 m; there is nothing to see two districts away.
      maxBounds: [
        [93.929, 24.795],
        [93.955, 24.822],
      ],
    });
    } catch {
      const note = document.createElement("p");
      note.textContent = "The satellite map needs WebGL. Explore the landmark list or open Google Maps below.";
      note.setAttribute("role", "status"); note.style.padding = "2rem"; el.appendChild(note);
      return () => { note.remove(); };
    }
    map.current = instance;
    const resize = new ResizeObserver(() => {
      instance.stop(); instance.resize();
      const selected = kanglaPlaces.find(place => place.id === options.current.selectedId);
      instance.jumpTo({
        center: selected?.coord ?? KANGLA_OVERVIEW.center,
        zoom: selected?.view.zoom ?? (el.clientWidth < 600 ? 14.9 : KANGLA_OVERVIEW.zoom),
        pitch: options.current.tilted ? (selected?.view.pitch ?? KANGLA_OVERVIEW.pitch) : 0,
        bearing: selected?.view.bearing ?? KANGLA_OVERVIEW.bearing,
      });
    });
    resize.observe(el);
    instance.addControl(new AttributionControl({ compact: true }), "bottom-left");
    instance.addControl(new NavigationControl({ visualizePitch: true }), "bottom-right");
    instance.getCanvas().setAttribute(
      "aria-label",
      "3D map of Kangla Fort, Imphal. Drag to orbit, scroll to zoom. Landmark buttons are listed beside the map.",
    );

    // Surface style/source failures instead of leaving a silently empty map.
    instance.on("error", (event) => {
      if (event.error) setMapError("Some map imagery could not load. You can still browse places or open Google Maps.");
    });

    instance.on("idle", () => { if (instance.areTilesLoaded()) setMapError(""); });
    instance.on("load", () => {
      instance.addSource("kangla", { type: "geojson", data: KANGLA_SITE_GEOJSON });

      // Moats first — they sit under everything and give the island its shape.
      instance.addLayer({
        id: "kangla-moat",
        type: "fill",
        source: "kangla",
        filter: ["==", ["get", "kind"], "moat"],
        paint: { "fill-color": "#2f6b8a", "fill-opacity": 0.05 },
      });
      instance.addLayer({
        id: "kangla-moat-edge",
        type: "line",
        source: "kangla",
        filter: ["==", ["get", "kind"], "moat"],
        paint: { "line-color": "#7fc8e8", "line-width": 1.2, "line-opacity": 0.25 },
      });

      // The enclosure boundary, drawn as a bright hairline.
      instance.addLayer({
        id: "kangla-wall",
        type: "line",
        source: "kangla",
        filter: ["==", ["get", "kind"], "fort"],
        paint: { "line-color": "#d9a441", "line-width": 1.2, "line-opacity": 0.65 },
      });
      instance.addLayer({
        id: "kangla-wall-glow",
        type: "fill",
        source: "kangla",
        filter: ["==", ["get", "kind"], "fort"],
        paint: { "fill-color": "#d9a441", "fill-opacity": 0 },
      });

      instance.addLayer({
        id: "kangla-buildings",
        type: "fill-extrusion",
        layout: { visibility: options.current.buildings ? "visible" : "none" },
        source: "kangla",
        filter: ["==", ["get", "kind"], "building"],
        paint: {
          // The monument footprint (the Pakhangba complex) stands taller.
          "fill-extrusion-color": [
            "case",
            ["==", ["get", "historic"], "monument"], "#f0e6d2",
            "#cdbfa6",
          ],
          "fill-extrusion-height": [
            "case",
            ["==", ["get", "historic"], "monument"], 13,
            8,
          ],
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": 0.92,
        },
      });
      setReady(true);
    });

    for (const place of kanglaPlaces) {
      const marker = new Marker({ element: pinElement(place, (id) => selectRef.current(id)), anchor: "center" })
        .setLngLat(place.coord)
        .addTo(instance);
      markers.current.set(place.id, marker);
    }

    const markerMap = markers.current;
    return () => {
      markerMap.forEach((m) => m.remove());
      markerMap.clear();
      resize.disconnect();
      instance.remove();
      map.current = null;
    };
  }, []);

  // Fly to the selected place, and scale its pin up so the target is obvious.
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;

    markers.current.forEach((marker, id) => {
      const el = marker.getElement();
      const active = id === selectedId;
      el.style.borderWidth = active ? "4px" : "2px";
      el.setAttribute("aria-pressed", String(active));
      el.style.zIndex = active ? "2" : "1";
      el.style.background = active ? "#fbf8f3" : "rgba(251,248,243,.94)";
    });

    const place = kanglaPlaces.find((p) => p.id === selectedId);
    if (!place) {
      instance.easeTo({ ...KANGLA_OVERVIEW, zoom: instance.getContainer().clientWidth < 600 ? 14.9 : KANGLA_OVERVIEW.zoom, pitch: tilted ? KANGLA_OVERVIEW.pitch : 0, duration: 1000 });
      return;
    }
    instance.flyTo({
      center: place.coord,
      zoom: place.view.zoom,
      pitch: tilted ? place.view.pitch : 0,
      bearing: place.view.bearing,
      duration: 1600,
      essential: false,
    });
  }, [selectedId, overview, ready, tilted]);

  useEffect(() => {
    const instance = map.current;
    if (ready && instance?.getLayer("kangla-buildings")) instance.setLayoutProperty("kangla-buildings", "visibility", buildings ? "visible" : "none");
  }, [buildings, ready]);

  return <><div ref={host} className="size-full" data-testid="kangla-map" data-view={tilted ? "3d" : "2d"} data-buildings={buildings} />{mapError && <p role="status" className="absolute left-4 right-4 top-16 rounded-lg bg-background p-3 text-xs text-foreground shadow">{mapError}</p>}</>;
}
