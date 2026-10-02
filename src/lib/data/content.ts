/**
 * Content layer: editorial copy, served from the database.
 *
 * Same contract as `./index.ts`: call sites import from here and never reach
 * for the seed modules directly. Every getter tries the database first and falls
 * back to the bundled seed content when the project is unconfigured *or* the
 * query fails.
 *
 * The fallback is not belt-and-braces. Two things depend on it: the documented
 * property that this app builds and runs with zero environment variables, and
 * the fact that a page of prose should not 500 because the database had a bad
 * minute. Content is the one thing safe to serve slightly stale.
 *
 * One exception: inside a Vercel Production build a failed read is retried
 * and then fails the build (`readWithBuildRetry` in ./cache.ts). Seed copy
 * baked into static pages would stay until the next deploy, and the edited
 * live copy differs from the seed files. `ALLOW_SEED_FALLBACK=1` overrides.
 */
import { cache } from "react";
import { asc, eq } from "drizzle-orm";

import { getDb, schema, type Db } from "@/lib/db";

import { logDbError } from "@/lib/log";

import { CONTENT_TAG, isProductionBuild, readWithBuildRetry, sharedRead } from "./cache";

import { faqGroups as seedFaqGroups, type FaqGroup } from "@/app/faq/faq-data";
import { PHOTO_CREDITS, type PhotoCredit } from "./photo-credits";
import { kanglaSources, kanglaStops } from "@/lib/immersive/kangla";
import {
  aboutPrinciples,
  aboutThemes,
  contactChannels,
  homeStats,
  hostFaqs,
  hostGallery,
  hostSteps,
  hostWeHandle,
  hostWhy,
  pledgeItems,
  responsibleQuickAsks,
  type Channel,
  type IconCard,
  type ImageItem,
  type NamedIconCard,
  type Principle,
  type QaItem,
  type QuickAsk,
  type Stat,
} from "./seed/site-content";

/* ------------------------------------------------------------------ helper -- */

/**
 * A read cached across requests (see `./cache.ts`). `run` gets the live
 * connection and throws on error; it is only invoked through `fromDb`, which
 * has already checked a database is configured.
 *
 * Every table read here holds published editorial copy with no hidden rows, so
 * unlike `catalogue.ts` none of these queries needs a visibility filter.
 */
function contentRead<A extends unknown[], T>(
  key: string,
  run: (db: Db, ...args: A) => Promise<T>,
): (...args: A) => Promise<T> {
  return sharedRead(`content:${key}`, CONTENT_TAG, (...args: A) => run(getDb() as Db, ...args));
}

/**
 * Run a cached read, returning its result, or `null` (use the seed) if the
 * database is unconfigured or, at runtime, errors. Inside a production build
 * an error is retried and then rethrown, failing the build (see the header).
 * Wrapped in React's `cache` at call sites that run more than once per render.
 */
async function fromDb<T>(read: () => Promise<T>, label: string): Promise<T | null> {
  if (!getDb()) return null;
  try {
    return await readWithBuildRetry(`content:${label}`, read);
  } catch (err) {
    if (isProductionBuild()) throw err;
    logDbError("content", err, { read: label, fallback: "seed" });
    return null;
  }
}

/* ---------------------------------------------------------- site sections -- */

/**
 * Page blocks are stored one row per key, payload as a jsonb array. The shape
 * differs per key, so the cast happens here, at the single boundary where the
 * key and its expected type are both known.
 */
const readSection = contentRead("site_sections", (db, key: string) =>
  db
    .select({ payload: schema.site_sections.payload })
    .from(schema.site_sections)
    .where(eq(schema.site_sections.key, key))
    .limit(1),
);

const sectionPayload = cache(async (key: string): Promise<unknown[] | null> => {
  const rows = await fromDb(() => readSection(key), `site_sections[${key}]`);
  const payload = rows?.[0]?.payload;
  return Array.isArray(payload) ? payload : null;
});

async function section<T>(key: string, fallback: T[]): Promise<T[]> {
  const rows = await sectionPayload(key);
  // An empty array in the database is almost certainly a seeding accident
  // rather than an editorial decision to show nothing, so prefer the seed.
  return rows && rows.length > 0 ? (rows as T[]) : fallback;
}

export const getAboutThemes = () => section<NamedIconCard>("about.themes", aboutThemes);
export const getAboutPrinciples = () => section<Principle>("about.principles", aboutPrinciples);
export const getHostWhy = () => section<IconCard>("host.why", hostWhy);
export const getHostWeHandle = () => section<IconCard>("host.we_handle", hostWeHandle);
export const getHostSteps = () => section<IconCard>("host.steps", hostSteps);
export const getHostGallery = () => section<ImageItem>("host.gallery", hostGallery);
export const getContactChannels = () => section<Channel>("contact.channels", contactChannels);
export const getHomeStats = () => section<Stat>("home.stats", homeStats);
export const getResponsibleQuickAsks = () =>
  section<QuickAsk>("responsible.quick_asks", responsibleQuickAsks);

// `home.marquee_words`, `hero.subjects` and `home.statement` are still seeded
// (scripts/seed.ts) but have no getter: the home components that showed them
// were removed. Add a getter back here if a component needs one again.

/** Stored as `[{ text }]` so the payload stays a uniform array of objects. */
export async function getPledgeItems(): Promise<string[]> {
  const rows = await section<{ text?: string }>(
    "pledge.items",
    pledgeItems.map((text) => ({ text })),
  );
  return rows.map((r) => r.text ?? "").filter(Boolean);
}

/* ------------------------------------------------------------------- FAQs -- */

const readFaqGroups = contentRead("faq_groups", (db, audience: "traveller" | "host") =>
  db.query.faq_groups.findMany({
    columns: { slug: true, label: true, blurb: true, sort_order: true },
    where: eq(schema.faq_groups.audience, audience),
    orderBy: asc(schema.faq_groups.sort_order),
    with: {
      faq_items: {
        columns: { question: true, answer: true, sort_order: true },
        orderBy: asc(schema.faq_items.sort_order),
      },
    },
  }),
);

export async function getFaqGroups(
  audience: "traveller" | "host" = "traveller",
): Promise<FaqGroup[]> {
  const rows = await fromDb(() => readFaqGroups(audience), `faq_groups[${audience}]`);

  if (!rows || rows.length === 0) {
    return audience === "host"
      ? [{ id: "hosting", label: "Hosting with Yening", blurb: "", items: hostFaqs }]
      : seedFaqGroups;
  }

  return rows.map((g) => ({
    id: g.slug,
    label: g.label,
    blurb: g.blurb ?? "",
    items: g.faq_items.map((it) => ({ q: it.question, a: it.answer })),
  }));
}

export async function getHostFaqs(): Promise<QaItem[]> {
  const groups = await getFaqGroups("host");
  return groups.flatMap((g) => g.items);
}

/** Flattened for the FAQPage JSON-LD on /faq. */
export async function getAllFaqItems(): Promise<QaItem[]> {
  const groups = await getFaqGroups("traveller");
  return groups.flatMap((g) => g.items);
}

/* ---------------------------------------------------------- photo credits -- */

const readPhotoCredits = contentRead("photo_credits", (db) =>
  db
    .select({
      file: schema.photo_credits.file,
      alt: schema.photo_credits.alt,
      subject: schema.photo_credits.subject,
      author: schema.photo_credits.author,
      licence: schema.photo_credits.licence,
      source: schema.photo_credits.source,
    })
    .from(schema.photo_credits),
);

export const getPhotoCredits = cache(async (): Promise<PhotoCredit[]> => {
  const rows = await fromDb(readPhotoCredits, "photo_credits");
  if (!rows || rows.length === 0) return PHOTO_CREDITS;
  return rows as PhotoCredit[];
});

export async function getPhotoCredit(file: string): Promise<PhotoCredit | undefined> {
  return (await getPhotoCredits()).find((c) => c.file === file);
}

/* -------------------------------------------------------------- immersive -- */

export type ImmersiveStop = (typeof kanglaStops)[number];

const readImmersiveStops = contentRead("immersive_stops", (db, scene: string) =>
  db
    .select({
      slug: schema.immersive_stops.slug,
      name: schema.immersive_stops.name,
      short_name: schema.immersive_stops.short_name,
      subtitle: schema.immersive_stops.subtitle,
      image: schema.immersive_stops.image,
      alt: schema.immersive_stops.alt,
      description: schema.immersive_stops.description,
      look_for: schema.immersive_stops.look_for,
      reconstruction: schema.immersive_stops.reconstruction,
      camera: schema.immersive_stops.camera,
      target: schema.immersive_stops.target,
    })
    .from(schema.immersive_stops)
    .where(eq(schema.immersive_stops.scene, scene))
    .orderBy(asc(schema.immersive_stops.sort_order)),
);

export async function getImmersiveStops(scene = "kangla-fort"): Promise<ImmersiveStop[]> {
  const rows = await fromDb(() => readImmersiveStops(scene), `immersive_stops[${scene}]`);
  if (!rows || rows.length === 0) return kanglaStops;

  return rows.map((r) => ({
    // Narration audio lives in the local `kanglaStops` table, not in the database:
    // the row below has no `narration` column, so spreading the matching local
    // stop first is what keeps the voice tracks when the DB is seeded. Every
    // field the row does carry then overrides it.
    ...kanglaStops.find((stop) => stop.id === r.slug),
    id: r.slug,
    name: r.name,
    shortName: r.short_name,
    subtitle: r.subtitle,
    image: r.image,
    alt: r.alt,
    description: r.description,
    lookFor: r.look_for,
    reconstruction: r.reconstruction,
    camera: r.camera as [number, number, number],
    target: r.target as [number, number, number],
  })) as ImmersiveStop[];
}

const readImmersiveSources = contentRead("immersive_sources", (db, scene: string) =>
  db
    .select({
      title: schema.immersive_sources.title,
      href: schema.immersive_sources.href,
      note: schema.immersive_sources.note,
    })
    .from(schema.immersive_sources)
    .where(eq(schema.immersive_sources.scene, scene))
    .orderBy(asc(schema.immersive_sources.sort_order)),
);

export async function getImmersiveSources(scene = "kangla-fort") {
  const rows = await fromDb(() => readImmersiveSources(scene), `immersive_sources[${scene}]`);
  if (!rows || rows.length === 0) return kanglaSources;
  return rows as { title: string; href: string; note: string }[];
}
