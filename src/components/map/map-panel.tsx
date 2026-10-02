"use client";

import dynamic from "next/dynamic";
import { createContext, useContext } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { HotspotMapProps } from "./hotspot-map";

/**
 * The caller's `className` (its height and margin), for the loading skeleton.
 * `dynamic`'s `loading` gets no props, so without this the skeleton guessed a
 * 60vh box and the page jumped twice: to that box, then to the map's own.
 */
const MapBoxClass = createContext<string | undefined>(undefined);

function MapSkeleton() {
  const className = useContext(MapBoxClass);
  return (
    <Skeleton
      role="status"
      aria-label="Loading the map"
      className={cn("min-h-[60vh] w-full rounded-[var(--radius-lg)]", className && "min-h-0", className)}
    />
  );
}

/**
 * MapLibre touches `window` at module scope, so the real map is loaded only in
 * the browser. Everything above this boundary stays a Server Component.
 */
const HotspotMap = dynamic(() => import("./hotspot-map"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

export function MapPanel(props: HotspotMapProps) {
  if (props.points.length === 0) {
    return (
      <div
        className={
          "flex min-h-[50vh] w-full items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sunken p-8 text-center " +
          (props.className ?? "")
        }
      >
        <p className="max-w-sm text-sm text-muted-foreground">
          Nothing to plot yet. Clear a filter or two and the map will fill up with
          lakes, hills and forts.
        </p>
      </div>
    );
  }

  return (
    <MapBoxClass.Provider value={props.className}>
      <HotspotMap {...props} />
    </MapBoxClass.Provider>
  );
}
