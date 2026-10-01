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
 */
import { cache } from "react";
import { asc, eq } from "drizzle-orm";

import { getDb, schema, type Db } from "@/lib/db";

import { faqGroups as seedFaqGroups, type FaqGroup } from "@/app/faq/faq-data";
import { PHOTO_CREDITS, type PhotoCredit } from "./photo-credits";
import { kanglaSources, kanglaStops } from "@/lib/immersive/kangla";
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
 * Run a read, returning its result, or `null` if the database is unavailable
 * or errors. Wrapped in React's `cache` at each call site so one
 * render hits the network once per key, not once per component.
 *
 * Every table read here holds published editorial copy with no hidden rows, so
 * unlike `catalogue.ts` none of these queries needs a visibility filter.
 */
async function fromDb<T>(run: (db: Db) => Promise<T>, label: string): Promise<T | null> {
  const db = getDb();
  if (!db) return null;
  try {
    return await run(db);
  } catch (err) {
    console.warn(`[content] ${label} fell back to seed:`, err);
    return null;
  }
}

/* ---------------------------------------------------------- site sections -- */

/**
 * Page blocks are stored one row per key, payload as a jsonb array. The shape
 * differs per key, so the cast happens here, at the single boundary where the
 * key and its expected type are both known.
 */
const sectionPayload = cache(async (key: string): Promise<unknown[] | null> => {
  const rows = await fromDb(
    (db) =>
      db
        .select({ payload: schema.site_sections.payload })
        .from(schema.site_sections)
        .where(eq(schema.site_sections.key, key))
        .limit(1),
    `site_sections[${key}]`,
  );
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

/** Stored as `[{ word }]` so the payload stays a uniform array of objects. */
export async function getMarqueeWords(): Promise<string[]> {
  const rows = await section<{ word?: string }>(
    "home.marquee_words",
    marqueeWords.map((word) => ({ word })),
  );
  return rows.map((r) => r.word ?? "").filter(Boolean);
}

export async function getHeroSubjects(): Promise<string[]> {
  const rows = await section<{ text?: string }>(
    "hero.subjects",
    heroSubjects.map((text) => ({ text })),
  );
  return rows.map((r) => r.text ?? "").filter(Boolean);
}

export async function getPledgeItems(): Promise<string[]> {
  const rows = await section<{ text?: string }>(
    "pledge.items",
    pledgeItems.map((text) => ({ text })),
  );
  return rows.map((r) => r.text ?? "").filter(Boolean);
}

export async function getHomeStatement(): Promise<string> {
  const rows = await section<{ text?: string }>("home.statement", [{ text: homeStatement }]);
  return rows[0]?.text || homeStatement;
}

/* ------------------------------------------------------------------- FAQs -- */

export async function getFaqGroups(
  audience: "traveller" | "host" = "traveller",
): Promise<FaqGroup[]> {
  const rows = await fromDb(
    (db) =>
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
    `faq_groups[${audience}]`,
  );

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

export const getPhotoCredits = cache(async (): Promise<PhotoCredit[]> => {
  const rows = await fromDb(
    (db) =>
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
    "photo_credits",
  );
  if (!rows || rows.length === 0) return PHOTO_CREDITS;
  return rows as PhotoCredit[];
});

export async function getPhotoCredit(file: string): Promise<PhotoCredit | undefined> {
  return (await getPhotoCredits()).find((c) => c.file === file);
}

/* -------------------------------------------------------------- immersive -- */

export type ImmersiveStop = (typeof kanglaStops)[number];

export async function getImmersiveStops(scene = "kangla-fort"): Promise<ImmersiveStop[]> {
  const rows = await fromDb(
    (db) =>
      db
        .select()
        .from(schema.immersive_stops)
        .where(eq(schema.immersive_stops.scene, scene))
        .orderBy(asc(schema.immersive_stops.sort_order)),
    `immersive_stops[${scene}]`,
  );
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

export async function getImmersiveSources(scene = "kangla-fort") {
  const rows = await fromDb(
    (db) =>
      db
        .select({
          title: schema.immersive_sources.title,
          href: schema.immersive_sources.href,
          note: schema.immersive_sources.note,
        })
        .from(schema.immersive_sources)
        .where(eq(schema.immersive_sources.scene, scene))
        .orderBy(asc(schema.immersive_sources.sort_order)),
    `immersive_sources[${scene}]`,
  );
  if (!rows || rows.length === 0) return kanglaSources;
  return rows as { title: string; href: string; note: string }[];
}
