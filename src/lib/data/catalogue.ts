/**
 * Catalogue loaders — the database half of the data layer.
 *
 * Each loader pulls a whole table, maps snake_case columns back to the domain
 * types, and falls back to the bundled seed module when Supabase is absent or
 * the query fails.
 *
 * Why fetch whole tables rather than push filters into SQL: the catalogue is
 * ~160 rows across nine tables, and `index.ts` already implements the exact
 * filter, sort, paginate and search semantics the UI expects. Loading the rows
 * and reusing that logic keeps behaviour identical to the seed-backed version,
 * which is the contract the routes were written against. React's `cache` makes
 * it one round trip per table per render.
 *
 * If the catalogue ever grows past a few thousand rows, this is the seam to
 * change: push `matches`/`sortRows`/`paginate` down into PostgREST queries.
 */
import { cache } from "react";

import type {
  Craft,
  Eatery,
  Experience,
  Festival,
  Homestay,
  Hotspot,
  Testimonial,
  Tour,
  TransportOption,
} from "@/types";

import { getSupabasePublicClient } from "@/lib/supabase/public";

import { crafts as seedCrafts } from "./seed/crafts";
import { eateries as seedEateries } from "./seed/eateries";
import { experiences as seedExperiences } from "./seed/experiences";
import { festivals as seedFestivals } from "./seed/festivals";
import { homestays as seedHomestays } from "./seed/homestays";
import { hotspots as seedHotspots } from "./seed/hotspots";
import { testimonials as seedTestimonials } from "./seed/testimonials";
import { tours as seedTours } from "./seed/tours";
import { transportOptions as seedTransport } from "./seed/transport";

type Row = Record<string, unknown>;

/** Fetch a whole table, or `null` if Supabase is unavailable or errors. */
async function loadTable(table: string, columns = "*"): Promise<Row[] | null> {
  const db = getSupabasePublicClient();
  if (!db) return null;
  try {
    const { data, error } = await db.from(table).select(columns);
    if (error) {
      console.warn(`[catalogue] ${table} fell back to seed: ${error.message}`);
      return null;
    }
    return (data as unknown as Row[]) ?? null;
  } catch (err) {
    console.warn(`[catalogue] ${table} fell back to seed:`, err);
    return null;
  }
}

/**
 * Build a cached loader. An empty table is treated as "not seeded yet" and
 * falls back, so a half-migrated database shows content rather than a blank
 * catalogue.
 */
function loader<T>(table: string, map: (row: Row) => T, seed: T[]) {
  return cache(async (): Promise<T[]> => {
    const rows = await loadTable(table);
    if (!rows || rows.length === 0) return seed;
    return rows.map(map);
  });
}

const str = (v: unknown) => (v == null ? "" : String(v));
const num = (v: unknown) => (v == null ? 0 : Number(v));
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/* -------------------------------------------------------------- loaders -- */

export const loadHotspots = loader<Hotspot>(
  "hotspots",
  (r) =>
    ({
      id: str(r.id),
      slug: str(r.slug),
      name: str(r.name),
      meiteiName: (r.meitei_name as string) ?? undefined,
      tagline: str(r.tagline),
      description: str(r.description),
      history: (r.history as string) ?? undefined,
      category: r.category,
      district: r.district,
      location: str(r.location),
      coordinates: { lat: num(r.lat), lng: num(r.lng) },
      images: arr(r.images),
      bestTimeToVisit: str(r.best_time),
      bestSeasons: arr(r.best_seasons),
      entryFee: str(r.entry_fee),
      timings: str(r.timings),
      howToReach: str(r.how_to_reach),
      distanceFromImphalKm: num(r.distance_km),
      durationHours: num(r.duration_hours),
      tips: arr(r.tips),
      accessibility: (r.accessibility as Hotspot["accessibility"]) ?? {
        wheelchairAccessible: false,
        notes: "",
      },
      tags: arr(r.tags),
      featured: Boolean(r.featured),
      panoramaUrl: (r.panorama_url as string) ?? undefined,
    }) as Hotspot,
  seedHotspots,
);

export const loadHomestays = loader<Homestay>(
  "homestays",
  (r) =>
    ({
      id: str(r.id),
      slug: str(r.slug),
      title: str(r.title),
      description: str(r.description),
      hostName: str(r.host_name),
      hostStory: (r.host_story as string) ?? undefined,
      hostAvatar: (r.host_avatar as string) ?? undefined,
      location: str(r.location),
      district: r.district,
      coordinates: { lat: num(r.lat), lng: num(r.lng) },
      pricePerNight: num(r.price_per_night),
      maxGuests: num(r.max_guests),
      bedrooms: num(r.bedrooms),
      bathrooms: num(r.bathrooms),
      amenities: arr(r.amenities),
      images: arr(r.images),
      rating: num(r.rating),
      reviewCount: num(r.review_count),
      houseRules: arr(r.house_rules),
      cancellationPolicy: str(r.cancellation_policy),
      featured: Boolean(r.featured),
      isActive: Boolean(r.is_active),
    }) as Homestay,
  seedHomestays,
);

export const loadExperiences = loader<Experience>(
  "experiences",
  (r) =>
    ({
      id: str(r.id),
      slug: str(r.slug),
      title: str(r.title),
      description: str(r.description),
      category: r.category,
      host: str(r.host),
      location: str(r.location),
      district: r.district,
      durationHours: num(r.duration_hours),
      pricePerPerson: num(r.price_per_person),
      groupSizeMax: num(r.group_size_max),
      languages: arr(r.languages),
      includes: arr(r.includes),
      images: arr(r.images),
      rating: num(r.rating),
      reviewCount: num(r.review_count),
      featured: Boolean(r.featured),
    }) as Experience,
  seedExperiences,
);

export const loadEateries = loader<Eatery>(
  "eateries",
  (r) =>
    ({
      id: str(r.id),
      slug: str(r.slug),
      name: str(r.name),
      description: str(r.description),
      cuisines: arr(r.cuisines),
      location: str(r.location),
      district: r.district,
      coordinates: { lat: num(r.lat), lng: num(r.lng) },
      priceRange: num(r.price_range),
      timings: str(r.timings),
      phone: (r.phone as string) ?? undefined,
      images: arr(r.images),
      rating: num(r.rating),
      reviewCount: num(r.review_count),
      signatureDishes: arr(r.signature_dishes),
      acceptsReservations: Boolean(r.accepts_reservations),
      featured: Boolean(r.featured),
    }) as Eatery,
  seedEateries,
);

export const loadTours = loader<Tour>(
  "tours",
  (r) =>
    ({
      id: str(r.id),
      slug: str(r.slug),
      title: str(r.title),
      description: str(r.description),
      durationDays: num(r.duration_days),
      pricePerPerson: num(r.price_per_person),
      groupSizeMax: num(r.group_size_max),
      difficulty: r.difficulty,
      themes: arr(r.themes),
      districtsCovered: arr(r.districts_covered),
      itinerary: arr(r.itinerary),
      includes: arr(r.includes),
      excludes: arr(r.excludes),
      images: arr(r.images),
      departureDates: arr(r.departure_dates),
      rating: num(r.rating),
      reviewCount: num(r.review_count),
      featured: Boolean(r.featured),
    }) as Tour,
  seedTours,
);

export const loadTransportOptions = loader<TransportOption>(
  "transport_options",
  (r) =>
    ({
      id: str(r.id),
      slug: str(r.slug),
      name: str(r.name),
      mode: r.mode,
      operator: str(r.operator),
      description: str(r.description),
      seats: num(r.seats),
      pricePerDay: r.price_per_day == null ? undefined : num(r.price_per_day),
      pricePerKm: r.price_per_km == null ? undefined : num(r.price_per_km),
      routes: arr(r.routes),
      includes: arr(r.includes),
      images: arr(r.images),
      rating: num(r.rating),
      featured: Boolean(r.featured),
    }) as TransportOption,
  seedTransport,
);

export const loadFestivals = loader<Festival>(
  "festivals",
  (r) =>
    ({
      id: str(r.id),
      slug: str(r.slug),
      name: str(r.name),
      meiteiName: (r.meitei_name as string) ?? undefined,
      description: str(r.description),
      month: r.month,
      typicalDates: str(r.typical_dates),
      location: str(r.location),
      district: r.district,
      significance: str(r.significance),
      images: arr(r.images),
      featured: Boolean(r.featured),
    }) as Festival,
  seedFestivals,
);

export const loadCrafts = loader<Craft>(
  "crafts",
  (r) =>
    ({
      id: str(r.id),
      slug: str(r.slug),
      name: str(r.name),
      meiteiName: (r.meitei_name as string) ?? undefined,
      description: str(r.description),
      story: (r.story as string) ?? undefined,
      category: r.category,
      price: num(r.price),
      priceNote: (r.price_note as string) ?? undefined,
      maker: str(r.maker),
      makerStory: (r.maker_story as string) ?? undefined,
      location: str(r.location),
      district: r.district,
      phone: (r.phone as string) ?? undefined,
      website: (r.website as string) ?? undefined,
      images: arr(r.images),
      materials: arr(r.materials),
      madeToOrder: Boolean(r.made_to_order),
      leadTimeDays: r.lead_time_days == null ? undefined : num(r.lead_time_days),
      giTagged: Boolean(r.gi_tagged),
      featured: Boolean(r.featured),
    }) as Craft,
  seedCrafts,
);

export const loadTestimonials = loader<Testimonial>(
  "testimonials",
  (r) =>
    ({
      id: str(r.id),
      name: str(r.name),
      origin: str(r.origin),
      avatar: (r.avatar as string) ?? undefined,
      quote: str(r.quote),
      rating: num(r.rating),
      tripType: str(r.trip_type),
    }) as Testimonial,
  seedTestimonials,
);
