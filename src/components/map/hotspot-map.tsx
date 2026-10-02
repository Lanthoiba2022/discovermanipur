"use client";

import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
} from "maplibre-gl";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { skipsOptimizer } from "@/lib/data/photos";
import { cn } from "@/lib/utils";

import "maplibre-gl/dist/maplibre-gl.css";
import { MANIPUR_CENTER, OSM_RASTER_STYLE } from "./map-style";

export interface MapPoint {
  slug: string;
  name: string;
  subtitle: string;
  category: string;
  image?: string;
  /** Photographer credit, shown under the popup photo. Required for Places photos. */
  imageCredit?: string;
  lat: number;
  lng: number;
}

export interface HotspotMapProps {
  points: MapPoint[];
  /** Height utility classes for the map shell. */
  className?: string;
  /** Single-spot mode: no fit-to-bounds zoom-out, no popups opened by default. */
  zoom?: number;
  interactive?: boolean;
  ariaLabel?: string;
}

/**
 * Markers and popups live outside React's tree, so they are styled inline
 * rather than through the global stylesheet.
 */
function markerElement(label: string): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", `${label}: open details`);
  el.style.cssText = [
    "width:26px",
    "height:34px",
    "padding:0",
    "border:0",
    "background:transparent",
    "cursor:pointer",
    "display:block",
  ].join(";");
  el.innerHTML = `<svg width="26" height="34" viewBox="0 0 26 34" aria-hidden="true" focusable="false">
      <path d="M13 33.5C13 33.5 25 20.7 25 13A12 12 0 1 0 1 13c0 7.7 12 20.5 12 20.5Z"
            fill="#0b3b3c" stroke="#faf6ec" stroke-width="2" />
      <circle cx="13" cy="13" r="4.4" fill="#c9a227" />
    </svg>`;
  return el;
}

export default function HotspotMap({
  points,
  className,
  zoom,
  interactive = true,
  ariaLabel = "Map of places in Manipur",
}: HotspotMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const first = points[0];
    const map = new MapLibreMap({
      container,
      style: OSM_RASTER_STYLE,
      center: first ? [first.lng, first.lat] : MANIPUR_CENTER,
      zoom: zoom ?? (points.length > 1 ? 7 : 12),
      interactive,
      attributionControl: { compact: true },
    });
    if (interactive) {
      map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    }

    const markers: Marker[] = [];


    for (const point of points) {
      const popupNode = document.createElement("div");
      popupNode.style.cssText = "width:220px;font-family:inherit";
      popupNode.innerHTML = `
        ${
          point.image
            ? `<img src="${escapeHtml(popupImageSrc(point.image))}" alt="" loading="lazy" style="width:100%;height:110px;object-fit:cover;border-radius:10px;display:block" />
               ${
                 point.imageCredit
                   ? `<p style="margin:3px 0 0;font-size:9px;color:#8a8279;text-align:right">${escapeHtml(point.imageCredit)}</p>`
                   : ""
               }`
            : ""
        }
        <div style="padding-top:10px">
          <p style="margin:0;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#5a534a">${escapeHtml(point.category)}</p>
          <p style="margin:4px 0 2px;font-size:15px;font-weight:600;color:#12100e">${escapeHtml(point.name)}</p>
          <p style="margin:0;font-size:12px;color:#5a534a">${escapeHtml(point.subtitle)}</p>
          <a href="/hotspots/${encodeURIComponent(point.slug)}" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:#0b3b3c">View this place &rarr;</a>
        </div>`;

      popupNode.querySelector("a")?.addEventListener("click", (event) => {
        event.preventDefault();
        router.push(`/hotspots/${point.slug}`);
      });

      const popup = new Popup({ offset: 22, closeButton: true, maxWidth: "260px" }).setDOMContent(
        popupNode,
      );

      markers.push(
        new Marker({ element: markerElement(point.name), anchor: "bottom" })
          .setLngLat([point.lng, point.lat])
          .setPopup(popup)
          .addTo(map),
      );
    }

    if (points.length > 1) {
      const bounds = new LngLatBounds();
      points.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: 64, maxZoom: 11, duration: 0 });
    }

    return () => {
      markers.forEach((m) => m.remove());
      map.remove();
    };
  }, [points, zoom, interactive, router]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={ariaLabel}
      className={cn(
        "relative w-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-muted",
        className,
      )}
    />
  );
}

/**
 * The `src` for a popup's 220x110 photo. Popups are raw DOM built outside
 * React, so `next/image` is not available and the URL is chosen here.
 *
 * - Google Places (`/api/place-photo`) and community photos pass through
 *   VERBATIM. A Places URL may carry a signature (`&s=`) that covers its exact
 *   query, and every distinct width is a separate CDN entry and a separate
 *   billed Places call, so rewriting `w` for a thumbnail costs more than the
 *   bytes it saves. These must also never reach `/_next/image` (see
 *   `skipsOptimizer` in photos.ts).
 * - Our own files go through the optimizer at 640px, q75: the seeds hold
 *   originals of 2-3 MB (uhk.jpg is 3840x2564), far too much for a hover
 *   card. 640 must stay in `images.deviceSizes` or the optimizer answers 400.
 * - Anything else (an absolute URL, unexpected data) is left as it is.
 */
function popupImageSrc(src: string): string {
  if (skipsOptimizer(src)) return src;
  if (src.startsWith("/file-uploads/")) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=640&q=75`;
  }
  return src;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
