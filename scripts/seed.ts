/**
 * Push the local seed catalogue and editorial content into the database.
 *
 *   npm run db:seed -- --confirm-host=<host>
 *
 * Without `--confirm-host` it prints the target host and database and exits
 * without connecting (see `confirmTarget`).
 *
 * Idempotent: every table upserts on a natural key, so re-running reconciles
 * rather than duplicating. Connects as the database owner. This is a
 * server-side operator script and must never be imported by the app.
 */

import { createHash } from "node:crypto";

import { getTableColumns, getTableName, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PgTable } from "drizzle-orm/pg-core";
import pg from "pg";

import * as schema from "../src/lib/db/schema.ts";

import { crafts } from "../src/lib/data/seed/crafts.ts";
import { eateries } from "../src/lib/data/seed/eateries.ts";
import { experiences } from "../src/lib/data/seed/experiences.ts";
import { festivals } from "../src/lib/data/seed/festivals.ts";
import { homestays } from "../src/lib/data/seed/homestays.ts";
import { hotspots } from "../src/lib/data/seed/hotspots.ts";
import { testimonials } from "../src/lib/data/seed/testimonials.ts";
import { tours } from "../src/lib/data/seed/tours.ts";
import { transportOptions } from "../src/lib/data/seed/transport.ts";
import { faqGroups } from "../src/app/faq/faq-data.ts";
import { PHOTO_CREDITS } from "../src/lib/data/photo-credits.ts";
import { kanglaStops, kanglaSources } from "../src/lib/immersive/kangla.ts";
import {
  aboutPrinciples,
  aboutThemes,
  contactChannels,
  heroSubjects,
  homeStatement,
  homeStats,
  hostFaqs,
  hostGallery,
  hostSteps,
  hostWeHandle,
  hostWhy,
  marqueeWords,
  pledgeItems,
  responsibleQuickAsks,
} from "../src/lib/data/seed/site-content.ts";

/**
 * The testimonial seed ids are human-readable slugs ("ts-priya-sharma") but the
 * column is a uuid. Derive a stable RFC-4122 v5 uuid from each slug so the
 * upsert stays idempotent across runs without widening the schema.
 */
const SEED_NAMESPACE = "1b4d5f2e-7a63-4c18-9f0e-2c6a8d3b5471";

function uuidV5(name: string, namespace = SEED_NAMESPACE): string {
  const ns = Buffer.from(namespace.replace(/-/g, ""), "hex");
  const hash = createHash("sha1").update(ns).update(name, "utf8").digest();
  const b = Buffer.from(hash.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50; // version 5
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 4122 variant
  const h = b.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const url = process.env.DATABASE_URL;

if (!url) {
  console.error(
    "Missing DATABASE_URL.\n" +
      "Put it in .env.local (see .env.example) and run `npm run db:migrate` before seeding.",
  );
  process.exit(1);
}

/**
 * Refuse to write to a database the operator did not name on the command line.
 *
 * `.env.local` usually holds the PRODUCTION connection string, so running this
 * script by habit, or from shell history, would write to production. Print the
 * target (host and database only, never the user or password) and stop unless
 * the same host was passed as `--confirm-host=<host>`.
 */
function confirmTarget(connectionString: string): void {
  let target: URL;
  try {
    target = new URL(connectionString);
  } catch {
    console.error("DATABASE_URL is not a valid connection URL.");
    process.exit(1);
  }
  const host = target.hostname;
  const database = decodeURIComponent(target.pathname.replace(/^\//, "")) || "(default)";
  console.log(`Target: ${host}/${database}`);

  if (!process.argv.slice(2).includes(`--confirm-host=${host}`)) {
    console.error(
      "Refusing to seed without confirming the target. This upserts every seed row and " +
        "overwrites live edits to matching rows. If this is the database you mean, run:\n" +
        `  npm run db:seed -- --confirm-host=${host}`,
    );
    process.exit(1);
  }
}

confirmTarget(url);

const pool = new pg.Pool({ connectionString: url, max: 1 });
const db = drizzle({ client: pool });

/**
 * `INSERT … ON CONFLICT (conflict) DO UPDATE` every column the rows supply.
 * Rows are checked against the table's insert type, so a seed field that no
 * longer matches the schema is a type error, not a runtime surprise.
 */
async function upsert<TTable extends PgTable>(
  table: TTable,
  rows: TTable["$inferInsert"][],
  conflict: (keyof TTable["$inferSelect"] & string)[] = ["slug" as keyof TTable["$inferSelect"] & string],
) {
  const name = getTableName(table);
  if (rows.length === 0) {
    console.log(`  ${name}: nothing to seed`);
    return;
  }
  const columns = getTableColumns(table) as Record<string, { name: string }>;
  const supplied = [...new Set(rows.flatMap((r) => Object.keys(r as object)))];
  const set = Object.fromEntries(
    supplied
      .filter((key) => !conflict.includes(key as never))
      .map((key) => [key, sql.raw(`excluded."${columns[key].name}"`)]),
  );
  try {
    // Batched so one statement never outgrows Postgres's parameter ceiling.
    for (let i = 0; i < rows.length; i += 100) {
      await db
        .insert(table)
        .values(rows.slice(i, i + 100))
        .onConflictDoUpdate({ target: conflict.map((key) => columns[key]) as never, set: set as never });
    }
  } catch (error) {
    console.error(`  ${name}: FAILED: ${(error as Error).message}`);
    throw error;
  }
  console.log(`  ${name}: ${rows.length} rows`);
}

async function main() {
  console.log("Seeding Yening catalogue into Neon…");

  await upsert(
    schema.hotspots,
    hotspots.map((h) => ({
      slug: h.slug,
      name: h.name,
      meitei_name: h.meiteiName ?? null,
      tagline: h.tagline,
      description: h.description,
      history: h.history ?? null,
      category: h.category,
      district: h.district,
      location: h.location,
      lat: h.coordinates.lat,
      lng: h.coordinates.lng,
      images: h.images,
      best_time: h.bestTimeToVisit,
      best_seasons: h.bestSeasons,
      entry_fee: h.entryFee,
      timings: h.timings,
      how_to_reach: h.howToReach,
      distance_km: h.distanceFromImphalKm,
      duration_hours: h.durationHours,
      tips: h.tips,
      accessibility: h.accessibility,
      tags: h.tags,
      featured: h.featured,
      panorama_url: h.panoramaUrl ?? null,
    })),
  );

  await upsert(
    schema.homestays,
    homestays.map((h) => ({
      slug: h.slug,
      title: h.title,
      description: h.description,
      host_name: h.hostName,
      host_story: h.hostStory ?? null,
      host_avatar: h.hostAvatar ?? null,
      location: h.location,
      district: h.district,
      lat: h.coordinates.lat,
      lng: h.coordinates.lng,
      price_per_night: h.pricePerNight,
      max_guests: h.maxGuests,
      bedrooms: h.bedrooms,
      bathrooms: h.bathrooms,
      amenities: h.amenities,
      images: h.images,
      rating: h.rating,
      review_count: h.reviewCount,
      house_rules: h.houseRules,
      cancellation_policy: h.cancellationPolicy,
      featured: h.featured,
      is_active: h.isActive,
    })),
  );

  await upsert(
    schema.experiences,
    experiences.map((e) => ({
      slug: e.slug,
      title: e.title,
      description: e.description,
      category: e.category,
      host: e.host,
      location: e.location,
      district: e.district,
      duration_hours: e.durationHours,
      price_per_person: e.pricePerPerson,
      group_size_max: e.groupSizeMax,
      languages: e.languages,
      includes: e.includes,
      images: e.images,
      rating: e.rating,
      review_count: e.reviewCount,
      featured: e.featured,
    })),
  );

  await upsert(
    schema.eateries,
    eateries.map((e) => ({
      slug: e.slug,
      name: e.name,
      description: e.description,
      cuisines: e.cuisines,
      location: e.location,
      district: e.district,
      lat: e.coordinates.lat,
      lng: e.coordinates.lng,
      price_range: e.priceRange,
      timings: e.timings,
      phone: e.phone ?? null,
      images: e.images,
      rating: e.rating,
      review_count: e.reviewCount,
      signature_dishes: e.signatureDishes,
      accepts_reservations: e.acceptsReservations,
      featured: e.featured,
    })),
  );

  await upsert(
    schema.tours,
    tours.map((t) => ({
      slug: t.slug,
      title: t.title,
      description: t.description,
      duration_days: t.durationDays,
      price_per_person: t.pricePerPerson,
      group_size_max: t.groupSizeMax,
      difficulty: t.difficulty,
      themes: t.themes,
      districts_covered: t.districtsCovered,
      itinerary: t.itinerary,
      includes: t.includes,
      excludes: t.excludes,
      images: t.images,
      departure_dates: t.departureDates,
      rating: t.rating,
      review_count: t.reviewCount,
      featured: t.featured,
    })),
  );

  await upsert(
    schema.transport_options,
    transportOptions.map((t) => ({
      slug: t.slug,
      name: t.name,
      mode: t.mode,
      operator: t.operator,
      description: t.description,
      seats: t.seats,
      price_per_day: t.pricePerDay ?? null,
      price_per_km: t.pricePerKm ?? null,
      routes: t.routes,
      includes: t.includes,
      images: t.images,
      rating: t.rating,
      featured: t.featured,
    })),
  );

  await upsert(
    schema.festivals,
    festivals.map((f) => ({
      slug: f.slug,
      name: f.name,
      meitei_name: f.meiteiName ?? null,
      description: f.description,
      month: f.month,
      typical_dates: f.typicalDates,
      location: f.location,
      district: f.district,
      significance: f.significance,
      images: f.images,
      featured: f.featured,
    })),
  );

  await upsert(
    schema.crafts,
    crafts.map((c) => ({
      slug: c.slug,
      name: c.name,
      meitei_name: c.meiteiName ?? null,
      description: c.description,
      story: c.story ?? null,
      category: c.category,
      price: c.price,
      price_note: c.priceNote ?? null,
      maker: c.maker,
      maker_story: c.makerStory ?? null,
      location: c.location,
      district: c.district,
      phone: c.phone ?? null,
      website: c.website ?? null,
      images: c.images,
      materials: c.materials,
      made_to_order: c.madeToOrder,
      lead_time_days: c.leadTimeDays ?? null,
      gi_tagged: c.giTagged,
      featured: c.featured,
      is_active: true,
    })),
  );

  // Testimonials have no natural slug; reconcile on the stable seed id.
  await upsert(
    schema.testimonials,
    testimonials.map((t) => ({
      id: uuidV5(t.id),
      name: t.name,
      origin: t.origin,
      avatar: t.avatar ?? null,
      quote: t.quote,
      rating: t.rating,
      trip_type: t.tripType,
      approved: true,
    })),
    ["id"],
  );

  /* ------------------------------ site content ---------------------------- */

  // Page blocks. Each key holds an array whose shape is that block's own; the
  // data layer casts it back to the interface the component expects.
  const sections: [string, string, string, unknown[]][] = [
    ["about.themes", "About: programme themes", "The six themes the project is built around.", aboutThemes],
    ["about.principles", "About: editorial principles", "How the writing decides what to claim.", aboutPrinciples],
    ["host.why", "Host: why list here", "The pitch to a prospective host.", hostWhy],
    ["host.we_handle", "Host: what we handle", "What Yening does on the host's behalf.", hostWeHandle],
    ["host.steps", "Host: how it works", "Onboarding, in four steps.", hostSteps],
    ["host.gallery", "Host: gallery strip", "Images under the host landing hero.", hostGallery],
    ["contact.channels", "Contact: channels", "Where each kind of message goes.", contactChannels],
    ["home.stats", "Home: counted facts", "The four figures under the statement.", homeStats],
    ["home.marquee_words", "Home: marquee", "Scrolling word strip.", marqueeWords.map((w) => ({ word: w }))],
    ["hero.subjects", "Hero: rotating subjects", "The line that cycles in the hero.", heroSubjects.map((s) => ({ text: s }))],
    ["responsible.quick_asks", "Responsible travel: quick asks", "The short version, for anyone who reads nothing else.", responsibleQuickAsks],
    ["pledge.items", "Responsible travel: visitor's pledge", "The commitment checklist.", pledgeItems.map((t) => ({ text: t }))],
    ["home.statement", "Home: opening statement", "The paragraph under the hero.", [{ text: homeStatement }]],
  ];

  await upsert(
    schema.site_sections,
    sections.map(([key, label, description, payload], i) => ({
      key,
      label,
      description,
      payload,
      sort_order: i,
    })),
    ["key"],
  );

  await upsert(
    schema.photo_credits,
    PHOTO_CREDITS.map((c) => ({
      file: c.file,
      alt: c.alt,
      subject: c.subject,
      author: c.author,
      licence: c.licence,
      source: c.source,
    })),
    ["file"],
  );

  /* ---------------------------------- FAQs -------------------------------- */
  // Groups first, then their items keyed to the returned ids. The host FAQ is
  // a flat list, so it becomes a single group under the 'host' audience.
  const groupRows = [
    ...faqGroups.map((g, i) => ({
      slug: g.id,
      audience: "traveller" as const,
      label: g.label,
      blurb: g.blurb,
      sort_order: i,
    })),
    {
      slug: "hosting",
      audience: "host" as const,
      label: "Hosting with Yening",
      blurb: "What hosts ask before they apply.",
      sort_order: 0,
    },
  ];
  await upsert(schema.faq_groups, groupRows, ["audience", "slug"]);

  const savedGroups = await db
    .select({
      id: schema.faq_groups.id,
      slug: schema.faq_groups.slug,
      audience: schema.faq_groups.audience,
    })
    .from(schema.faq_groups);
  const groupId = new Map(savedGroups.map((g) => [`${g.audience}:${g.slug}`, g.id]));

  /** Resolve a group id, aborting rather than orphaning rows if one is missing. */
  const groupOf = (key: string) => {
    const id = groupId.get(key);
    if (!id) throw new Error(`faq_items: group ${key} failed to resolve, aborting rather than orphaning rows`);
    return id;
  };

  const itemRows = [
    ...faqGroups.flatMap((g) =>
      g.items.map((it, i) => ({
        group_id: groupOf(`traveller:${g.id}`),
        question: it.q,
        answer: it.a,
        sort_order: i,
      })),
    ),
    ...hostFaqs.map((it, i) => ({
      group_id: groupOf("host:hosting"),
      question: it.q,
      answer: it.a,
      sort_order: i,
    })),
  ];
  await upsert(schema.faq_items, itemRows, ["group_id", "question"]);

  /* -------------------------------- immersive ----------------------------- */
  await upsert(
    schema.immersive_stops,
    kanglaStops.map((s, i) => ({
      scene: "kangla-fort",
      slug: s.id,
      name: s.name,
      short_name: s.shortName,
      subtitle: s.subtitle,
      image: s.image,
      alt: s.alt,
      description: s.description,
      look_for: s.lookFor,
      reconstruction: s.reconstruction,
      camera: s.camera,
      target: s.target,
      sort_order: i,
    })),
    ["scene", "slug"],
  );

  await upsert(
    schema.immersive_sources,
    kanglaSources.map((s, i) => ({
      scene: "kangla-fort",
      title: s.title,
      href: s.href,
      note: s.note,
      sort_order: i,
    })),
    ["scene", "title"],
  );

  console.log("Done.");
}

main()
  .catch(() => {
    process.exitCode = 1;
  })
  .finally(() => pool.end());
