import type { District, GeoPoint, Hotspot, HotspotCategory, Season } from "@/types";

/** Imphal city centre. Every "distance from Imphal" is measured from here. */
export const IMPHAL: GeoPoint = { lat: 24.817, lng: 93.9368 };

export const CATEGORY_LABELS: Record<HotspotCategory, string> = {
  lake: "Lake",
  hill: "Hill",
  heritage: "Heritage",
  wildlife: "Wildlife",
  waterfall: "Waterfall",
  temple: "Temple",
  museum: "Museum",
  market: "Market",
  village: "Village",
  memorial: "Memorial",
  cave: "Cave",
  park: "Park",
};

export const SEASONS: Season[] = ["spring", "summer", "monsoon", "autumn", "winter"];

export const SEASON_LABELS: Record<Season, string> = {
  spring: "Spring",
  summer: "Summer",
  monsoon: "Monsoon",
  autumn: "Autumn",
  winter: "Winter",
};

export function categoryLabel(value: string) {
  return CATEGORY_LABELS[value as HotspotCategory] ?? titleCase(value);
}

export function seasonLabel(value: string) {
  return SEASON_LABELS[value as Season] ?? titleCase(value);
}

export function titleCase(value: string) {
  return value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type MonthName = (typeof MONTHS)[number];

/**
 * Festival `month` is free text ("March", "Feb–Mar", "November / December").
 * Resolve it to a 0-based month index, or -1 when nothing matches.
 */
export function monthIndexOf(raw: string): number {
  const text = raw.toLowerCase();
  for (let i = 0; i < MONTHS.length; i += 1) {
    if (text.includes(MONTHS[i].slice(0, 3).toLowerCase())) return i;
  }
  return -1;
}

/** Great-circle distance in km between two points. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface NearbyHotspot {
  hotspot: Hotspot;
  km: number;
}

/** The `count` nearest hotspots to `origin`, never including `origin` itself. */
export function nearestHotspots(
  origin: Hotspot,
  all: Hotspot[],
  count = 4,
): NearbyHotspot[] {
  return all
    .filter((h) => h.slug !== origin.slug && h.coordinates)
    .map((hotspot) => ({ hotspot, km: haversineKm(origin.coordinates, hotspot.coordinates) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, count);
}

export function formatDuration(hours: number): string {
  if (!hours || hours <= 0) return "Flexible";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours >= 24) {
    const days = Math.round(hours / 24);
    return `${days} day${days > 1 ? "s" : ""}`;
  }
  const whole = Math.floor(hours);
  const rest = hours - whole;
  if (rest >= 0.25 && rest < 0.75) return `${whole}½ hrs`;
  return `${Math.round(hours)} hr${Math.round(hours) > 1 ? "s" : ""}`;
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export function uniqueDistricts(rows: { district: District }[]): District[] {
  return [...new Set(rows.map((r) => r.district))].sort() as District[];
}

/** A deterministic fallback so an image-less record never renders a broken box. */
export const PLACEHOLDER_IMAGE = "/file-uploads/11.jpg";
