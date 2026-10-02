"use client";

import { ExternalLink, Map as MapIcon, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { HotspotMapProps } from "./hotspot-map";
import { MapPanel } from "./map-panel";

/**
 * A click-to-load stand-in for a single-pin map.
 *
 * MapPanel's `dynamic(() => import("./hotspot-map"), { ssr: false })` starts
 * fetching MapLibre (about 280 KB gzip, then a WebGL context and OSM raster
 * tiles) the moment it renders, and on a place page it rendered at hydration,
 * far below the fold, for a reader who may never scroll there. A lazy
 * component's chunk is requested only when React first renders it, so keeping
 * MapPanel out of the tree until the reader asks is all the gating needed:
 * this file imports MapPanel statically, but not the map itself.
 *
 * The card is useful on its own rather than a placeholder: the coordinates,
 * and a Google Maps deep link (the universal `maps/search` URL, which opens
 * the app on phones) for the one thing most readers want from a map here,
 * which is directions. "Show interactive map" swaps in MapPanel with exactly
 * the props it was given, so the map behaves as it did before.
 *
 * Layout: the card takes the same `className` the map would (its height
 * utility included), so the swap does not move anything below it. Focus moves
 * to the map's wrapper once it mounts, because the button that held it has
 * just been removed from the document.
 *
 * Use it for single-spot maps only. The listing page's map view is a map the
 * reader explicitly opened, and keeps MapPanel directly.
 */
export function MapFacade(props: HotspotMapProps) {
  const [open, setOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) mapRef.current?.focus();
  }, [open]);

  const point = props.points[0];
  if (!point) return <MapPanel {...props} />;

  if (open) {
    return (
      // tabIndex -1: focusable from script only, so it never joins tab order.
      // A named region, so the focus move is announced as arriving somewhere
      // ("Interactive map of ...") rather than on an unnamed group.
      <div
        ref={mapRef}
        tabIndex={-1}
        role="region"
        aria-label={`Interactive map of ${point.name}`}
        className="outline-none"
      >
        <MapPanel {...props} />
      </div>
    );
  }

  const coords = `${point.lat.toFixed(4)}°N, ${point.lng.toFixed(4)}°E`;
  const googleMaps = `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`;

  return (
    <section
      aria-label={props.ariaLabel ?? `Location of ${point.name}`}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-5 rounded-[var(--radius-lg)] border border-border bg-surface-sunken p-8 text-center",
        props.className,
      )}
    >
      <MapPin aria-hidden className="size-8 text-primary" />
      <div>
        <p className="font-display text-xl">{point.name}</p>
        {point.subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{point.subtitle}</p>
        )}
        <p className="mt-2 font-mono text-xs text-muted-foreground">{coords}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="primary" size="pill">
          <a href={googleMaps} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden />
            Open in Google Maps
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </Button>
        <Button type="button" variant="outline" size="pill" onClick={() => setOpen(true)}>
          <MapIcon aria-hidden />
          Show interactive map
        </Button>
      </div>
    </section>
  );
}
