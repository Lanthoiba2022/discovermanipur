"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

import type { HotspotMapProps } from "./hotspot-map";

/**
 * MapLibre touches `window` at module scope, so the real map is loaded only in
 * the browser. Everything above this boundary stays a Server Component.
 */
const HotspotMap = dynamic(() => import("./hotspot-map"), {
  ssr: false,
  loading: () => (
    <Skeleton className="h-full min-h-[60vh] w-full rounded-[var(--radius-lg)]" />
  ),
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

  return <HotspotMap {...props} />;
}
