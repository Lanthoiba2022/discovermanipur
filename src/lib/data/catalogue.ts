/**
 * Catalogue loaders: the database half of the data layer.
 *
 * Each loader pulls a whole table, maps snake_case columns back to the domain
 * types, and falls back to the bundled seed module when the database is absent
 * (or, at runtime only, when the query fails; see `loader` for the exact
 * policy, which differs between the build and a running deployment).
 *
 * Why fetch whole tables rather than push filters into SQL: the catalogue is
 * ~160 rows across nine tables, and `index.ts` already implements the exact
 * filter, sort, paginate and search semantics the UI expects. Loading the rows
 * and reusing that logic keeps behaviour identical whether rows come from the
 * database or the seed fallback. `sharedRead` (./cache.ts) makes it one round
 * trip per table per deployment across all requests and build workers, and
 * React's `cache` dedupes within a render.
 *
 * If the catalogue ever grows past a few thousand rows, this is the seam to
 * change: push `matches`/`sortRows`/`paginate` down into SQL.
 *
 * Visibility is enforced here, not by the database. This connection is the
 * table owner and sees every row, so the loaders for homestays and crafts
 * (`is_active`) and testimonials (`approved`) pass that filter as `where`.
 * Drop one and hidden listings go public. A filter that hides every row yields
 * an empty list, never the seed rows (see `readTable`).
 *
 * Cache tags: every entry carries CATALOGUE_TAG and its own table tag
 * (`catalogueTableTag`), so a write to one table refreshes only the pages that
 * read that table. See ./cache.ts.
 *
 * Each mapper receives the table's Drizzle row type, so a renamed or misspelt
 * column is a type error rather than a silently empty field.
 */
import { cache } from "react";
import { eq, sql, type SQL } from "drizzle-orm";
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

import { creditLine } from "./photos";
import { signedPlacePhotoUrl } from "./place-photo-signature";

import { getDb, schema } from "@/lib/db";
import { logDbError } from "@/lib/log";

import {
  CATALOGUE_TAG,
  catalogueTableTag,
  isProductionBuild,
  readWithBuildRetry,
  sharedRead,
} from "./cache";

import { crafts as seedCrafts } from "./seed/crafts";
import { eateries as seedEateries } from "./seed/eateries";
import { experiences as seedExperiences } from "./seed/experiences";
import { festivals as seedFestivals } from "./seed/festivals";
import { homestays as seedHomestays } from "./seed/homestays";
import { hotspots as seedHotspots } from "./seed/hotspots";
import { testimonials as seedTestimonials } from "./seed/testimonials";
import { tours as seedTours } from "./seed/tours";
import { transportOptions as seedTransport } from "./seed/transport";

/**
 * What a table read returns. `tableHasRows` separates "the visibility filter
 * hid every row" (an admin deactivated the last listing: show the empty state)
 * from "the table is empty" (not seeded yet, or a seeding accident). Plain
 * JSON, because this is what the data cache stores.
 */
interface TableRead<Row> {
  rows: Row[];
  tableHasRows: boolean;
}

/**
 * Fetch a whole table, optionally filtered. Throws on a database error so the
 * error is never cached.
 *
 * When a filter returns nothing, one `select 1 ... limit 1` on the unfiltered
 * table tells the two empty cases apart. It runs only in that rare case, and
 * the answer is cached with the rows.
 */
async function readTable<TTable extends PgTable>(
  table: TTable,
  where?: SQL,
): Promise<TableRead<TTable["$inferSelect"]>> {
  const db = getDb();
  if (!db) return { rows: [], tableHasRows: false };
  const query = db.select().from(table as PgTable);
  const rows = (await (where ? query.where(where) : query)) as TTable["$inferSelect"][];
  if (rows.length > 0 || !where) return { rows, tableHasRows: rows.length > 0 };
  const probe = await db
    .select({ one: sql<number>`1` })
    .from(table as PgTable)
    .limit(1);
  return { rows, tableHasRows: probe.length > 0 };
}

function tableName(table: PgTable) {
  return (table as unknown as { [k: symbol]: string })[Symbol.for("drizzle:Name")] ?? "table";
}

/** When a loader may show its bundled seed rows instead of the database. */
interface SeedPolicy {
  /** The table itself is empty (not seeded yet). Never applies inside a production build. */
  seedWhenEmpty: boolean;
  /** The read failed at runtime. Never applies inside a production build. */
  seedOnRuntimeError: boolean;
}

/** The catalogue tables: seed rows are real places, so they beat a blank page. */
const CATALOGUE_SEED: SeedPolicy = { seedWhenEmpty: true, seedOnRuntimeError: true };

/**
 * Every array a loader handed back from its seed path, recorded explicitly
 * rather than inferred later.
 *
 * Callers that cache something derived from the rows (search's entry list,
 * ./search.ts) must not cache a fallback: at runtime the seed rows may mean
 * the read FAILED, and caching them would pin an outage until the next deploy
 * or catalogue write. Comparing against the seed modules by reference would
 * silently stop working the day a loader copies or filters its seed array, so
 * `loader` marks whatever it returns from the seed path here instead, and
 * `isSeedFallback` reads the mark. A WeakSet holds no rows alive and adds no
 * field to them, so the loaders' return types and the cached entries are
 * unchanged. Database rows are never marked; nor is the `[]` a loader returns
 * when its policy forbids the seed rows, since that is not seed data.
 */
const seedFallbackRows = new WeakSet<readonly unknown[]>();

/** Mark `rows` as the seed fallback and return them, for `loader`'s seed paths. */
function fromSeed<T>(rows: T[]): T[] {
  seedFallbackRows.add(rows);
  return rows;
}

/**
 * Did this loader result come from the bundled seed rows instead of the
 * database? True for every seed path in `loader` (no database configured, a
 * runtime read failure, an empty table), false for database rows and for
 * empty results. Pass the array exactly as the loader returned it.
 */
export function isSeedFallback(rows: readonly unknown[]): boolean {
  return seedFallbackRows.has(rows);
}

/**
 * Build a cached loader. The mapped rows are what gets cached; the seed
 * fallback is chosen outside the cache, so an outage is retried on the next
 * request instead of being pinned.
 *
 * The policy, in order:
 * - No database configured (forks, CI, a fresh clone): the seed rows. This is
 *   what keeps the app building and running with zero environment variables.
 * - The read failed. Inside a production build (`isProductionBuild`), after
 *   `readWithBuildRetry` has retried: rethrow, failing the build. Baking seed
 *   rows into static pages with `dynamicParams = false` would 404 every
 *   database-only slug for the whole deployment, while failing leaves the
 *   previous deployment serving. At runtime: log it and serve the seed rows
 *   if `seedOnRuntimeError`, else nothing.
 * - Rows came back: those rows.
 * - None came back but the table has rows (moderation hid them all): `[]`, so
 *   the page's empty state renders. Never resurrect seed listings an admin
 *   has, in effect, switched off.
 * - The table is empty: in a production build with `seedWhenEmpty`, throw (a
 *   wiped table must not ship as a seed catalogue); otherwise the seed rows if
 *   `seedWhenEmpty`, else nothing.
 */
function loader<T, TTable extends PgTable>(
  table: TTable,
  map: (row: TTable["$inferSelect"]) => T,
  seed: T[],
  options: { where?: SQL; policy?: SeedPolicy } = {},
) {
  const { where, policy = CATALOGUE_SEED } = options;
  const name = tableName(table);
  const key = `catalogue:${name}`;
  const read = sharedRead(key, [CATALOGUE_TAG, catalogueTableTag(name)], async () => {
    const { rows, tableHasRows } = await readTable(table, where);
    return { rows: rows.map(map), tableHasRows };
  });

  return cache(async (): Promise<T[]> => {
    if (!getDb()) return fromSeed(seed);

    let result: TableRead<T>;
    try {
      result = await readWithBuildRetry(key, read);
    } catch (err) {
      if (isProductionBuild()) throw err;
      logDbError("catalogue", err, {
        table: name,
        fallback: policy.seedOnRuntimeError ? "seed" : "empty",
      });
      return policy.seedOnRuntimeError ? fromSeed(seed) : [];
    }

    if (result.rows.length > 0) return result.rows;
    if (result.tableHasRows) return [];
    if (isProductionBuild() && policy.seedWhenEmpty) {
      throw new Error(
        `${key}: the table is empty during the production build. Refusing to ship seed data. ` +
          "Restore the rows, or set ALLOW_SEED_FALLBACK=1 to ship seed data instead.",
      );
    }
    return policy.seedWhenEmpty ? fromSeed(seed) : [];
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
 *
 * Every Places `src` is minted by `signedPlacePhotoUrl`: the single 1200px
 * width the whole site uses (one CDN entry and one billed Places call per
 * photo), plus a signature when PLACE_PHOTO_URL_SECRET is set, so
 * /api/place-photo serves only refs this site rendered.
 *
 * `photoRefs` is dropped from every returned row (set to `undefined`, which
 * `JSON.stringify` omits from the cached entry). Once images are synthesised
 * nothing reads the refs again, and for rows with their own photos they were
 * never rendered. They were about half of the cached eateries and hotspots
 * entries, which sit close to Next's 2 MB data-cache limit (see ./cache.ts).
 *
 * Open content decision, not made here: 0009 backfilled Places refs onto seed
 * hotspots that already have self-hosted photos. Appending those to the
 * gallery would show more photos, at a billed Places call each.
 * `resolvePhotos` in ./photos.ts implements "ours first, then Places" but is
 * unused; adopting it is that decision.
 */
function withPhotos<T extends { images: MediaImage[]; photoRefs?: PhotoRef[] }>(
  row: T,
  name: string,
): T {
  if (row.images.length > 0 || !row.photoRefs?.length) return { ...row, photoRefs: undefined };
  return {
    ...row,
    images: row.photoRefs.map((ref) => ({
      src: signedPlacePhotoUrl(ref.ref),
      // Places photos come with no description. Naming the place is the honest
      // ceiling. Inventing detail about a photo nobody has looked at would put
      // false information into a screen-reader's mouth.
      alt: `${name}, Manipur`,
      credit: creditLine(ref) ?? undefined,
    })),
    photoRefs: undefined,
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
      // Merged over defaults: the column defaults to '{}', which would
      // otherwise reach the page as an object with neither field.
      accessibility: {
        wheelchairAccessible: false,
        notes: "",
        ...(r.accessibility as Partial<Hotspot["accessibility"]> | null),
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
  { where: eq(schema.homestays.is_active, true) },
);

/**
 * Every homestay slug, inactive ones included. The detail route prerenders all
 * of them, so a listing an admin or host switches back on renders after
 * revalidation instead of 404ing until the next deploy; the page itself still
 * 404s while the listing is inactive.
 *
 * Tagged with the homestays table tag, so a homestay write refreshes it too.
 */
const HOMESTAY_SLUGS_KEY = "catalogue:homestays:slugs";
const readAllHomestaySlugs = sharedRead(
  HOMESTAY_SLUGS_KEY,
  [CATALOGUE_TAG, catalogueTableTag("homestays")],
  async () => {
    const db = getDb();
    if (!db) return [];
    const rows = await db.select({ slug: schema.homestays.slug }).from(schema.homestays);
    return rows.map((r) => r.slug);
  },
);

/**
 * The same build policy as `loader`: inside a production build a failed read
 * (after retries) or an empty table fails the build, because these slugs are
 * the detail route's whole `generateStaticParams`. At runtime it falls back to
 * the seed slugs exactly as before.
 */
export const loadAllHomestaySlugs = cache(async (): Promise<string[]> => {
  const fallback = seedHomestays.map((h) => h.slug);
  if (!getDb()) return fallback;

  let slugs: string[];
  try {
    slugs = await readWithBuildRetry(HOMESTAY_SLUGS_KEY, readAllHomestaySlugs);
  } catch (err) {
    if (isProductionBuild()) throw err;
    logDbError("catalogue", err, { table: "homestays", read: "slugs", fallback: "seed" });
    return fallback;
  }

  if (slugs.length) return slugs;
  if (isProductionBuild()) {
    throw new Error(
      `${HOMESTAY_SLUGS_KEY}: the homestays table is empty during the production build. ` +
        "Refusing to ship seed data. Restore the rows, or set ALLOW_SEED_FALLBACK=1 to ship seed data instead.",
    );
  }
  return fallback;
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
  { where: eq(schema.crafts.is_active, true) },
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
  {
    where: eq(schema.testimonials.approved, true),
    // The seed quotes are invented. With a database configured they must never
    // be shown as real travellers' words, so an empty or failing table shows
    // the band's empty state instead.
    policy: { seedWhenEmpty: false, seedOnRuntimeError: false },
  },
);
