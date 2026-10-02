"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import type { RawSearchParams } from "@/components/filters/params";
import { ListingGrid } from "@/components/listing/listing-grid";
import { searchToRawParams } from "@/components/listing/search-params";
import { useListingUrl } from "@/components/listing/url-search-store";
import {
  useListingOrder,
  type KeyedFacets,
  type ListingResultItem,
} from "@/components/listing/use-listing-order";
import { MapPanel } from "@/components/map/map-panel";
import type { MapPoint } from "@/components/map/hotspot-map";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import {
  applyHotspotFilters,
  hasHotspotFilters,
  parseHotspotFilters,
  type HotspotFacets,
} from "./hotspot-filters";
import { parseHotspotView } from "./view-switch";

/**
 * The /hotspots results: the card grid, or the map, filtered in the browser
 * from the query string. The page is static; see `@/components/listing`.
 */

export type HotspotResultFacets = HotspotFacets & { slug: string };

const MAP_CLASS = "h-[70vh] min-h-[28rem]";

function selectHotspots(
  rows: KeyedFacets<HotspotResultFacets>[],
  params: RawSearchParams,
) {
  return applyHotspotFilters(rows, parseHotspotFilters(params));
}

export function HotspotResults({
  items,
  emptyNode,
}: {
  /** Every place, in `getHotspots()` order, with its server-rendered card. */
  items: ListingResultItem<HotspotResultFacets>[];
  /** The "no place matches" state, rendered on the server. */
  emptyNode: ReactNode;
}) {
  const { order, search } = useListingOrder(items, selectHotspots);
  const view = parseHotspotView(search);

  const visibleSlugs = useMemo(() => {
    const keys = new Set(order);
    return new Set(items.filter((item) => keys.has(item.key)).map((item) => item.facets.slug));
  }, [items, order]);

  if (order.length === 0) return <>{emptyNode}</>;

  if (view === "map") return <HotspotMapView visibleSlugs={visibleSlugs} />;

  return (
    <ListingGrid
      items={items}
      order={order}
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
      emptyNode={emptyNode}
    />
  );
}

/** "All places" or "Filtered places", following the URL. "All places" in the static HTML. */
export function HotspotResultsHeading() {
  const { search } = useListingUrl();
  const filtered = hasHotspotFilters(parseHotspotFilters(searchToRawParams(search)));
  return <>{filtered ? "Filtered places" : "All places"}</>;
}

/* ----------------------------------------------------------------- map --- */

/**
 * Map points are fetched once per page load, the first time the map opens,
 * from a static JSON route, and shared by every later open. A failed request
 * is forgotten so "Try again" really retries.
 */
const POINTS_URL = "/api/catalogue/hotspot-points";
let pointsRequest: Promise<MapPoint[]> | null = null;
let loadedPoints: MapPoint[] | null = null;

function loadPoints(): Promise<MapPoint[]> {
  pointsRequest ??= fetch(POINTS_URL)
    .then(async (response) => {
      if (!response.ok) throw new Error(`${POINTS_URL} answered ${response.status}`);
      const points = (await response.json()) as MapPoint[];
      loadedPoints = points;
      return points;
    })
    .catch((error: unknown) => {
      pointsRequest = null;
      throw error;
    });
  return pointsRequest;
}

function HotspotMapView({ visibleSlugs }: { visibleSlugs: ReadonlySet<string> }) {
  const [points, setPoints] = useState<MapPoint[] | null>(() => loadedPoints);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (points) return;
    let cancelled = false;
    loadPoints().then(
      (loaded) => {
        if (!cancelled) setPoints(loaded);
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [points, attempt]);

  const shown = useMemo(
    () => (points ?? []).filter((point) => visibleSlugs.has(point.slug)),
    [points, visibleSlugs],
  );

  if (failed) {
    return (
      <div
        className={`flex w-full flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sunken p-8 text-center ${MAP_CLASS}`}
      >
        <p className="max-w-sm text-sm text-muted-foreground">
          The map could not load. Check your connection and try again, or browse the places as
          cards.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFailed(false);
            setAttempt((n) => n + 1);
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!points) {
    return (
      <Skeleton
        className={`w-full rounded-[var(--radius-lg)] ${MAP_CLASS}`}
        role="status"
        aria-label="Loading the map"
      />
    );
  }

  return (
    <MapPanel
      points={shown}
      className={MAP_CLASS}
      ariaLabel={`Map of ${shown.length} places in Manipur`}
    />
  );
}
