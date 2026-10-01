/**
 * Catalogue loaders: the database half of the data layer.
 *
 * Each loader pulls a whole table, maps snake_case columns back to the domain
 * types, and falls back to the bundled seed module when the database is absent
 * or the query fails.
 *
 * Why fetch whole tables rather than push filters into SQL: the catalogue is
 * ~160 rows across nine tables, and `index.ts` already implements the exact
 * filter, sort, paginate and search semantics the UI expects. Loading the rows
 * and reusing that logic keeps behaviour identical whether rows come from the
 * database or the seed fallback. React's `cache` makes it one round trip per
 * table per render.
 *
 * If the catalogue ever grows past a few thousand rows, this is the seam to
 * change: push `matches`/`sortRows`/`paginate` down into SQL.
 *
 * Visibility is enforced here, not by the database. This connection is the
 * table owner and sees every row, so the loaders for homestays and crafts
 * (`is_active`) and testimonials (`approved`) pass that filter as `where`.
 * Drop one and hidden listings go public.
 *
 * Each mapper receives the table's Drizzle row type, so a renamed or misspelt
 * column is a type error rather than a silently empty field.
 */
import { cache } from "react";
import { eq, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

import type {
  Craft,
  Eatery,
  Experience,
  Festival,
  Homestay,
  Hotspot,
  MediaImage,
  PhotoRef,
  Testimonial,
  Tour,
  TransportOption,
} from "@/types";

import { creditLine, placePhotoUrl } from "./photos";

import { getDb, schema } from "@/lib/db";

import { crafts as seedCrafts } from "./seed/crafts";
import { eateries as seedEateries } from "./seed/eateries";
import { experiences as seedExperiences } from "./seed/experiences";
import { festivals as seedFestivals } from "./seed/festivals";
import { homestays as seedHomestays } from "./seed/homestays";
import { hotspots as seedHotspots } from "./seed/hotspots";
import { testimonials as seedTestimonials } from "./seed/testimonials";
import { tours as seedTours } from "./seed/tours";
import { transportOptions as seedTransport } from "./seed/transport";

/** Fetch a whole table, or `null` if the database is unavailable or errors. */
async function loadTable<TTable extends PgTable>(
  table: TTable,
  where?: SQL,
): Promise<TTable["$inferSelect"][] | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const query = db.select().from(table as PgTable);
    return (await (where ? query.where(where) : query)) as TTable["$inferSelect"][];
  } catch (err) {
    console.warn(`[catalogue] ${tableName(table)} fell back to seed:`, err);
    return null;
  }
}

function tableName(table: PgTable) {
  return (table as unknown as { [k: symbol]: string })[Symbol.for("drizzle:Name")] ?? "table";
}

/**
 * Build a cached loader. An empty table is treated as "not seeded yet" and
 * falls back, so a half-migrated database shows content rather than a blank
 * catalogue.
 */
function loader<T, TTable extends PgTable>(
  table: TTable,
  map: (row: TTable["$inferSelect"]) => T,
  seed: T[],
  where?: SQL,
) {
  return cache(async (): Promise<T[]> => {
    const rows = await loadTable(table, where);
    if (!rows || rows.length === 0) return seed;
    return rows.map(map);
  });
}

const str = (v: unknown) => (v == null ? "" : String(v));
const num = (v: unknown) => (v == null ? 0 : Number(v));
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/**
 * Give every row a usable `images` array.
 *
 * The 2026 research rows carry their photography in `photo_refs` (Google Places
 * references resolved per request) and have an empty `images`. Every card and
 * gallery in the app reads `images`, so without this they would all fall
 * through to the shared placeholder.
 *
 * Fixing it here rather than in the ~20 components that render a photo means
 * each of them keeps working unchanged, and there is one place to reason about
 * which photo source won.
 *
 * Self-hosted files always win: we control the crop, pay no per-render API cost
 * and owe no attribution overlay. Places refs are only synthesised when `images`
 * is empty, and each one carries its `credit` so the licence condition travels
 * with the image instead of being remembered separately.
 */
function withPhotos<T extends { images: MediaImage[]; photoRefs?: PhotoRef[] }>(
  row: T,
  name: string,
): T {
  if (row.images.length > 0 || !row.photoRefs?.length) return row;
  return {
    ...row,
    images: row.photoRefs.map((ref) => ({
      src: placePhotoUrl(ref.ref),
      // Places photos come with no description. Naming the place is the honest
      // ceiling. Inventing detail about a photo nobody has looked at would put
      // false information into a screen-reader's mouth.
      alt: `${name}, Manipur`,
      credit: creditLine(ref) ?? undefined,
    })),
  };
}

/* -------------------------------------------------------------- loaders -- */

export const loadHotspots = loader(
  schema.hotspots,
  (r) =>
    withPhotos({
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
      photoRefs: arr(r.photo_refs),
      sortWeight: num(r.sort_weight),
      verification: (r.verification as Hotspot["verification"]) ?? undefined,
      sources: arr(r.sources),
    } as Hotspot, str(r.name)),
  seedHotspots,
);

export const loadHomestays = loader(
  schema.homestays,
  (r) =>
    withPhotos({
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
      photoRefs: arr(r.photo_refs),
      sortWeight: num(r.sort_weight),
      verification: (r.verification as Homestay["verification"]) ?? undefined,
      sources: arr(r.sources),
    } as Homestay, str(r.title)),
  seedHomestays,
  eq(schema.homestays.is_active, true),
);

/**
 * Every homestay slug, inactive ones included. The detail route prerenders all
 * of them, so a listing an admin or host switches back on renders after
 * revalidation instead of 404ing until the next deploy; the page itself still
 * 404s while the listing is inactive.
 */
export const loadAllHomestaySlugs = cache(async (): Promise<string[]> => {
  const rows = await loadTable(schema.homestays);
  return rows?.length ? rows.map((r) => r.slug) : seedHomestays.map((h) => h.slug);
});

export const loadExperiences = loader(
  schema.experiences,
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

export const loadEateries = loader(
  schema.eateries,
  (r) =>
    withPhotos({
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
      photoRefs: arr(r.photo_refs),
      sortWeight: num(r.sort_weight),
      verification: (r.verification as Eatery["verification"]) ?? undefined,
    } as Eatery, str(r.name)),
  seedEateries,
);

export const loadTours = loader(
  schema.tours,
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

export const loadTransportOptions = loader(
  schema.transport_options,
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

export const loadFestivals = loader(
  schema.festivals,
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

export const loadCrafts = loader(
  schema.crafts,
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
  eq(schema.crafts.is_active, true),
);

export const loadTestimonials = loader(
  schema.testimonials,
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
  eq(schema.testimonials.approved, true),
);
