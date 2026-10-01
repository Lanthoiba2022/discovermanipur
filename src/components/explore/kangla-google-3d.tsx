"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleMapsAuthError, loadGoogleMaps } from "@/lib/google-maps-loader";
import { KANGLA_CENTER, KANGLA_MAP_BOUNDS, kanglaPlaces, type KanglaPlace } from "@/lib/immersive/kangla-places";

/**
 * Kangla through Google's Photorealistic 3D renderer (`Map3DElement`). Imphal
 * has no 3D building mesh yet, so what renders is Google's satellite imagery
 * draped over terrain. The UI says exactly that rather than promising a mesh.
 *
 * This is a map of one place, not a world map that opens on Imphal:
 *
 * - The camera is fenced to the fort (see `BOUNDS` and `clampCenter`) and
 *   cannot climb high enough to see past it.
 * - It opens in SATELLITE mode, which is imagery only: no road labels, no
 *   place pins, no business names. The Labels toggle switches to HYBRID.
 * - Gestures are GREEDY: scroll and trackpad pinch zoom the map directly
 *   instead of asking for a modifier key, because the map owns the viewport.
 * - Google's own control cluster is hidden so the page can place controls
 *   away from the site's floating concierge button.
 *
 * Landmarks are the repo's own OSM-sourced coordinates, drawn as 3D markers.
 */

type Map3D = google.maps.maps3d.Map3DElement;

const MOBILE_WIDTH = 760;
const TILT_3D = 62;
const HEADING = 342; // -18°, so the fort's long axis runs across the screen.
const HOME_RANGE = { desktop: 1500, mobile: 2100 };
const PLACE_RANGE = 320;
const FLY_MS = 1600;
const ZOOM_STEP = 0.6;
const READY_TIMEOUT_MS = 25_000;
/** One slow lap around the fort while the page settles; any touch ends it. */
const INTRO_ORBIT_MS = 90_000;

/**
 * Google fences the camera's own position, not the point it looks at. A camera
 * tilted 62° at 1.5 km range sits ~1.3 km behind its target, so Google's fence
 * has to be `KANGLA_MAP_BOUNDS` plus that standoff, or the opening shot could
 * never fit and the camera would be shoved into a corner. The point the camera
 * looks at is then clamped to the site box itself in `clampCenter`, so a
 * visitor can orbit Kangla from outside but never pan away from it.
 */
const CAMERA_STANDOFF = { lat: 0.0125, lng: 0.0135 }; // ≈ 1.4 km each way
const BOUNDS: google.maps.LatLngBoundsLiteral = {
  west: KANGLA_MAP_BOUNDS[0][0] - CAMERA_STANDOFF.lng,
  south: KANGLA_MAP_BOUNDS[0][1] - CAMERA_STANDOFF.lat,
  east: KANGLA_MAP_BOUNDS[1][0] + CAMERA_STANDOFF.lng,
  north: KANGLA_MAP_BOUNDS[1][1] + CAMERA_STANDOFF.lat,
};
/** Imphal's valley floor at Kangla, metres above sea level (SRTM ≈ 785 m). */
const GROUND = 785;
const CENTER = { lat: KANGLA_CENTER[1], lng: KANGLA_CENTER[0], altitude: GROUND };
// Camera altitude, metres above sea level: roughly 45 m to 2.1 km above ground.
const MIN_ALTITUDE = GROUND + 45;
const MAX_ALTITUDE = GROUND + 2100;

const SITE = {
  west: KANGLA_MAP_BOUNDS[0][0],
  south: KANGLA_MAP_BOUNDS[0][1],
  east: KANGLA_MAP_BOUNDS[1][0],
  north: KANGLA_MAP_BOUNDS[1][1],
};
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
/** Pulls the look-at point back inside the site box; returns false when it was already inside. */
function clampCenter(instance: Map3D): boolean {
  const c = instance.center;
  if (!c) return false;
  const lat = clamp(c.lat, SITE.south, SITE.north);
  const lng = clamp(c.lng, SITE.west, SITE.east);
  if (lat === c.lat && lng === c.lng) return false;
  instance.center = { lat, lng, altitude: c.altitude };
  return true;
}

const rangeFor = (width: number) => (width < MOBILE_WIDTH ? HOME_RANGE.mobile : HOME_RANGE.desktop);
/**
 * On wide screens the landmark panel covers the left ~380 px, so the home shot
 * looks a little west of the fort's centre and the fort itself sits in the
 * open two-thirds of the viewport. Still inside the site box, so the clamp
 * leaves it alone.
 */
const PANEL_OFFSET_LNG = 0.0034; // ≈ 345 m
const homeCamera = (width: number, tilted: boolean): google.maps.maps3d.CameraOptions => ({
  center: width < MOBILE_WIDTH ? CENTER : { ...CENTER, lng: CENTER.lng - PANEL_OFFSET_LNG },
  range: rangeFor(width),
  heading: HEADING,
  tilt: tilted ? TILT_3D : 0,
});
const placeCamera = (place: KanglaPlace, tilted: boolean): google.maps.maps3d.CameraOptions => ({
  center: { lat: place.coord[1], lng: place.coord[0], altitude: GROUND },
  range: place.kind === "water" ? 900 : PLACE_RANGE,
  tilt: tilted ? Math.min(place.view.pitch, 75) : 0,
  heading: (place.view.bearing + 360) % 360,
});

interface Props {
  apiKey: string;
  tilted: boolean;
  labels: boolean;
  /** The landmark the panel has chosen; the camera follows it. */
  selectedId: string | null;
  /** Incremented by the Recenter button; the value itself is not read. */
  overview: number;
  /** Incremented by zoom in, decremented by zoom out. */
  zoomStep: number;
  onSelect: (id: string | null) => void;
  /** Fired on the first gesture, so the shell can retire its hints. */
  onInteract?: () => void;
}

export default function KanglaGoogle3D({ apiKey, tilted, labels, selectedId, overview, zoomStep, onSelect, onInteract }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<Map3D | null>(null);
  const settings = useRef({ tilted, labels });
  const callbacks = useRef({ onSelect, onInteract });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    settings.current = { tilted, labels };
    callbacks.current = { onSelect, onInteract };
  }, [tilted, labels, onSelect, onInteract]);

  useEffect(() => {
    const element = host.current;
    if (!element || !apiKey) return;

    let alive = true;
    let instance: Map3D | undefined;
    let readyTimer: ReturnType<typeof setTimeout> | undefined;
    const fail = (message: string) => {
      if (alive) setError(message);
    };
    const onAuthFailure = () =>
      fail(
        "Google did not authorise this key for this address. Check that the Maps JavaScript API and Map Tiles API are enabled and that the key's allowed referrers include this origin, including the port.",
      );
    window.addEventListener("yening:gm-auth-failure", onAuthFailure);

    async function initialize(container: HTMLDivElement) {
      try {
        await loadGoogleMaps(apiKey);
        if (!alive) return;
        const { Map3DElement, Marker3DInteractiveElement } = await google.maps.importLibrary("maps3d");
        if (!alive) return;

        instance = new Map3DElement({
          ...homeCamera(container.clientWidth, settings.current.tilted),
          mode: settings.current.labels ? "HYBRID" : "SATELLITE",
          bounds: BOUNDS,
          minAltitude: MIN_ALTITUDE,
          maxAltitude: MAX_ALTITUDE,
          maxTilt: 80,
          defaultUIHidden: true,
          gestureHandling: "GREEDY",
        });
        instance.setAttribute(
          "aria-label",
          "3D map of Kangla and its immediate surroundings. Drag to pan, right-drag or two-finger drag to rotate and tilt, scroll or pinch to zoom.",
        );
        // The browser must not claim pinch or pan for itself before the map
        // sees them, and a drag must never start a text selection.
        container.style.touchAction = "none";
        container.style.userSelect = "none";
        instance.style.touchAction = "none";
        container.replaceChildren(instance);
        map.current = instance;

        for (const place of kanglaPlaces) {
          const marker = new Marker3DInteractiveElement({
            position: { lat: place.coord[1], lng: place.coord[0], altitude: 6 },
            altitudeMode: "RELATIVE_TO_GROUND",
            extruded: true,
            label: place.name,
            title: place.name,
            collisionBehavior: "OPTIONAL_AND_HIDES_LOWER_PRIORITY",
            collisionPriority: place.model ? 10 : 5,
          });
          marker.dataset.placeId = place.id;
          marker.addEventListener("gmp-click", () => callbacks.current.onSelect(place.id));
          instance.append(marker);
        }
        // A marker's click bubbles up to the map as well. Only a click on the
        // ground itself clears the selection, or every pin would open and
        // close the panel in the same instant.
        instance.addEventListener("gmp-click", event => {
          if (event.target === instance) callbacks.current.onSelect(null);
        });

        // Safari reports a trackpad pinch as gesture events, not ctrl+wheel,
        // and Google only listens for the latter. Drive the range ourselves
        // there; Chrome and Firefox never fire these, so nothing doubles up.
        let pinchStartRange = 0;
        const onGestureStart = (event: Event) => {
          pinchStartRange = instance?.range ?? HOME_RANGE.desktop;
          event.preventDefault();
        };
        const onGestureChange = (event: Event) => {
          event.preventDefault();
          const scale = (event as Event & { scale?: number }).scale;
          if (!instance || !scale) return;
          touch();
          instance.range = clamp(pinchStartRange / scale, 90, 3200);
        };
        container.addEventListener("gesturestart", onGestureStart, { passive: false });
        container.addEventListener("gesturechange", onGestureChange, { passive: false });
        container.addEventListener("gestureend", onGestureStart, { passive: false });
        // Diagnostics: how many wheel events actually reached the map host.
        let wheels = 0;
        container.addEventListener("wheel", event => {
          container.dataset.wheelCount = String(++wheels);
          container.dataset.lastWheel = event.ctrlKey ? "pinch" : "scroll";
        }, { passive: true, capture: true });

        // The intro orbit is a gift, not a lock: the first gesture ends it.
        let touched = false;
        const touch = () => {
          if (touched) return;
          touched = true;
          instance?.stopCameraAnimation();
          container.dataset.orbit = "false";
          callbacks.current.onInteract?.();
        };
        for (const type of ["pointerdown", "mousedown", "wheel", "touchstart", "keydown", "gesturestart"] as const) {
          container.addEventListener(type, touch, { passive: true, capture: true });
        }
        // Belt and braces: Google ends its own animation on a gesture, but if
        // any browser delivers the gesture without the events above, the
        // animation-end tells us the orbit is over and the map is theirs.
        instance.addEventListener("gmp-animationend", () => {
          if (container.dataset.orbit === "true") touch();
        });
        container.addEventListener("yening:stop-orbit", touch);

        let steady = false;
        const markReady = () => {
          if (!alive || !instance) return;
          steady = true;
          clearTimeout(readyTimer);
          setReady(true);
          const stillMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (!touched && !stillMotion) {
            container.dataset.orbit = "true";
            instance.flyCameraAround({
              camera: homeCamera(container.clientWidth, settings.current.tilted),
              durationMillis: INTRO_ORBIT_MS,
              repeatCount: 1,
            });
          }
        };
        instance.addEventListener("gmp-steadychange", markReady, { once: true });
        instance.addEventListener("gmp-error", () => fail("Google could not load the 3D imagery for Kangla. Check your connection, then retry."));
        readyTimer = setTimeout(() => {
          if (alive && !steady) fail("The 3D map is taking too long to load. Check your connection and that this browser supports WebGL, then retry.");
        }, READY_TIMEOUT_MS);

        // Probe hooks for automated browser checks. No UI reads these.
        (window as unknown as { kanglaMap?: Map3D }).kanglaMap = instance;
        const report = () => {
          if (!instance) return;
          const c = instance.center;
          if (c) container.dataset.center = JSON.stringify([c.lng, c.lat]);
          container.dataset.range = String(Math.round(instance.range ?? 0));
          container.dataset.tilt = String(Math.round(instance.tilt ?? 0));
          container.dataset.mode = String(instance.mode);
        };
        instance.addEventListener("gmp-steadychange", report);
        instance.addEventListener("gmp-centerchange", () => {
          // Setting `center` fires this event again, but with an inside value,
          // so the clamp settles in one step rather than looping.
          if (instance && !clampCenter(instance)) report();
        });
        instance.addEventListener("gmp-tiltchange", report);
        instance.addEventListener("gmp-rangechange", report);
      } catch (cause) {
        if (!alive) return;
        console.error("[kangla-3d] failed to start", cause);
        if (cause instanceof GoogleMapsAuthError) onAuthFailure();
        else fail("The 3D map could not start. Check your connection and that this browser supports WebGL, then retry.");
      }
    }

    void initialize(element);
    return () => {
      alive = false;
      clearTimeout(readyTimer);
      window.removeEventListener("yening:gm-auth-failure", onAuthFailure);
      instance?.remove();
      map.current = null;
      delete (window as unknown as { kanglaMap?: Map3D }).kanglaMap;
    };
  }, [apiKey, retry]);

  /** Any UI-driven camera move ends the intro orbit first, or the two fight. */
  const fly = (instance: Map3D, endCamera: google.maps.maps3d.CameraOptions, durationMillis = FLY_MS) => {
    instance.parentElement?.dispatchEvent(new CustomEvent("yening:stop-orbit"));
    instance.flyCameraTo({ endCamera, durationMillis });
  };

  // Selecting a landmark (from a pin or the panel) flies to it; clearing the
  // selection leaves the camera where the visitor put it.
  const lastSelected = useRef<string | null>(null);
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready || selectedId === lastSelected.current) return;
    lastSelected.current = selectedId;
    const place = kanglaPlaces.find(candidate => candidate.id === selectedId);
    if (place) fly(instance, placeCamera(place, settings.current.tilted));
  }, [selectedId, ready]);

  // Only a *change* of tilt flies the camera; the first run after `ready`
  // must not, or it would cut the intro orbit short before it started.
  const lastTilted = useRef(tilted);
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready || tilted === lastTilted.current) return;
    lastTilted.current = tilted;
    fly(
      instance,
      { center: instance.center ?? CENTER, range: instance.range ?? HOME_RANGE.desktop, heading: instance.heading ?? HEADING, tilt: tilted ? TILT_3D : 0 },
      1000,
    );
  }, [tilted, ready]);

  useEffect(() => {
    if (!map.current || !ready) return;
    map.current.mode = labels ? "HYBRID" : "SATELLITE";
  }, [labels, ready]);

  const lastOverview = useRef(0);
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready || overview === lastOverview.current) return;
    lastOverview.current = overview;
    fly(instance, homeCamera(instance.parentElement?.clientWidth ?? 1200, settings.current.tilted));
  }, [overview, ready]);

  const lastZoom = useRef(0);
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready || zoomStep === lastZoom.current) return;
    const zoomIn = zoomStep > lastZoom.current;
    lastZoom.current = zoomStep;
    const range = instance.range ?? HOME_RANGE.desktop;
    fly(
      instance,
      {
        center: instance.center ?? CENTER,
        heading: instance.heading ?? HEADING,
        tilt: instance.tilt ?? TILT_3D,
        range: clamp(zoomIn ? range * ZOOM_STEP : range / ZOOM_STEP, 90, 3200),
      },
      700,
    );
  }, [zoomStep, ready]);

  return (
    <>
      <div
        ref={host}
        className="size-full"
        data-testid="kangla-map"
        data-provider="google-3d"
        data-ready={ready}
        data-view={tilted ? "3d" : "2d"}
        data-labels={labels}
      />
      {!apiKey || error ? (
        <div
          role="alert"
          className="absolute inset-x-5 top-28 z-10 mx-auto max-w-md rounded-xl border border-border bg-background p-5 text-sm shadow-lg"
        >
          <p>{!apiKey ? "Add GOOGLE_API_KEY to .env.local to load the Kangla map." : error}</p>
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
          <p role="status" className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/55 px-5 py-3 text-sm text-white backdrop-blur">
            Loading Kangla in 3D…
          </p>
        )
      )}
    </>
  );
}
