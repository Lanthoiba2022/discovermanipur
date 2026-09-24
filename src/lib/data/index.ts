/**
 * Manipur Tourism data layer — the single boundary between content and UI.
 *
 * Every route imports from here and never from `./seed/*` directly.
 *
 * Rows come from Neon via `./catalogue`, which falls back to the bundled
 * seed data when the project is unconfigured or a query fails. The filter,
 * sort, paginate and search logic below is unchanged from the seed-backed
 * version — only the source of the rows moved.
 */

import type {
  Craft,
  Eatery,
  Experience,
  Festival,
  Homestay,
  Hotspot,
  ListQuery,
  Testimonial,
  Tour,
  TransportOption,
} from "@/types";

import {
  loadCrafts,
  loadEateries,
  loadExperiences,
  loadFestivals,
  loadHomestays,
  loadHotspots,
  loadTestimonials,
  loadTours,
  loadTransportOptions,
} from "./catalogue";

type Indexable = { featured?: boolean; district?: string };

function matches(item: unknown, q: ListQuery | undefined, haystack: string) {
  if (!q) return true;
  const it = item as Indexable;
  if (q.featured !== undefined && Boolean(it.featured) !== q.featured) return false;
  if (q.district && it.district !== q.district) return false;
  if (q.search && !haystack.toLowerCase().includes(q.search.toLowerCase())) return false;
  return true;
}

function paginate<T>(rows: T[], q?: ListQuery) {
  const offset = q?.offset ?? 0;
  const limit = q?.limit ?? rows.length;
  return rows.slice(offset, offset + limit);
}

/**
 * Default ordering is cohort first, then featured.
 *
 * `sortWeight` exists so the verified 2026 research rows lead every listing
 * while the original 2025 seed still appears, appended after them. New rows are
 * seeded at 100; everything already in the table sits at the column default of
 * 0. Rows loaded from the bundled seed modules have no weight at all, which
 * `?? 0` puts in the same cohort as the old database rows — so the fallback
 * path orders identically to the database path.
 *
 * An explicit user sort (price, rating) overrides the cohort entirely: someone
 * who asked for "cheapest first" means it, and quietly keeping one cohort on top
 * would just look like the sort is broken.
 */
function sortRows<T extends { featured?: boolean; rating?: number; sortWeight?: number }>(
  rows: T[],
  q: ListQuery | undefined,
  priceOf: (row: T) => number,
) {
  const out = [...rows];
  switch (q?.sort) {
    case "price-asc":
      return out.sort((a, b) => priceOf(a) - priceOf(b));
    case "price-desc":
      return out.sort((a, b) => priceOf(b) - priceOf(a));
    case "rating":
      return out.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    default:
      return out.sort(
        (a, b) =>
          (b.sortWeight ?? 0) - (a.sortWeight ?? 0) ||
          Number(b.featured) - Number(a.featured),
      );
  }
}

/* --------------------------------- Hotspots ---------------------------------- */

export async function getHotspots(q?: ListQuery): Promise<Hotspot[]> {
  const rows = (await loadHotspots()).filter((h) =>
    matches(h, q, `${h.name} ${h.tagline} ${h.location} ${h.district} ${h.tags.join(" ")}`),
  );
  return paginate(sortRows(rows, q, () => 0), q);
}

export async function getHotspotBySlug(slug: string): Promise<Hotspot | null> {
  return (await loadHotspots()).find((h) => h.slug === slug) ?? null;
}

export async function getHotspotCategories() {
  return [...new Set((await loadHotspots()).map((h) => h.category))].sort();
}

/* --------------------------------- Homestays --------------------------------- */

export async function getHomestays(q?: ListQuery): Promise<Homestay[]> {
  const rows = (await loadHomestays()).filter(
    (h) => h.isActive && matches(h, q, `${h.title} ${h.description} ${h.location} ${h.district}`),
  );
  return paginate(sortRows(rows, q, (r) => r.pricePerNight), q);
}

export async function getHomestayBySlug(slug: string): Promise<Homestay | null> {
  return (await loadHomestays()).find((h) => h.slug === slug) ?? null;
}

/* -------------------------------- Experiences -------------------------------- */

export async function getExperiences(q?: ListQuery): Promise<Experience[]> {
  const rows = (await loadExperiences()).filter((e) =>
    matches(e, q, `${e.title} ${e.description} ${e.location} ${e.category}`),
  );
  return paginate(sortRows(rows, q, (r) => r.pricePerPerson), q);
}

export async function getExperienceBySlug(slug: string): Promise<Experience | null> {
  return (await loadExperiences()).find((e) => e.slug === slug) ?? null;
}

/* ---------------------------------- Eateries --------------------------------- */

export async function getEateries(q?: ListQuery): Promise<Eatery[]> {
  const rows = (await loadEateries()).filter((e) =>
    matches(e, q, `${e.name} ${e.description} ${e.location} ${e.cuisines.join(" ")}`),
  );
  return paginate(sortRows(rows, q, (r) => r.priceRange), q);
}

export async function getEateryBySlug(slug: string): Promise<Eatery | null> {
  return (await loadEateries()).find((e) => e.slug === slug) ?? null;
}

/* ----------------------------------- Tours ----------------------------------- */

export async function getTours(q?: ListQuery): Promise<Tour[]> {
  const rows = (await loadTours()).filter((t) => matches(t, q, `${t.title} ${t.description} ${t.themes.join(" ")}`));
  return paginate(sortRows(rows, q, (r) => r.pricePerPerson), q);
}

export async function getTourBySlug(slug: string): Promise<Tour | null> {
  return (await loadTours()).find((t) => t.slug === slug) ?? null;
}

/* --------------------------------- Transport --------------------------------- */

export async function getTransportOptions(q?: ListQuery): Promise<TransportOption[]> {
  const rows = (await loadTransportOptions()).filter((t) =>
    matches(t, q, `${t.name} ${t.operator} ${t.routes.join(" ")}`),
  );
  return paginate(sortRows(rows, q, (r) => r.pricePerDay ?? 0), q);
}

export async function getTransportBySlug(slug: string): Promise<TransportOption | null> {
  return (await loadTransportOptions()).find((t) => t.slug === slug) ?? null;
}

/* ----------------------------------- Crafts ---------------------------------- */

export async function getCrafts(q?: ListQuery): Promise<Craft[]> {
  const rows = (await loadCrafts()).filter((c) =>
    matches(c, q, `${c.name} ${c.description} ${c.maker} ${c.category} ${c.materials.join(" ")}`),
  );
  return paginate(sortRows(rows, q, (r) => r.price), q);
}

export async function getCraftBySlug(slug: string): Promise<Craft | null> {
  return (await loadCrafts()).find((c) => c.slug === slug) ?? null;
}

export async function getCraftCategories() {
  return [...new Set((await loadCrafts()).map((c) => c.category))].sort();
}

/* --------------------------------- Festivals --------------------------------- */

export async function getFestivals(q?: ListQuery): Promise<Festival[]> {
  const rows = (await loadFestivals()).filter((f) => matches(f, q, `${f.name} ${f.description} ${f.month}`));
  return paginate(rows, q);
}

export async function getFestivalBySlug(slug: string): Promise<Festival | null> {
  return (await loadFestivals()).find((f) => f.slug === slug) ?? null;
}

/* -------------------------------- Testimonials ------------------------------- */

export async function getTestimonials(): Promise<Testimonial[]> {
  return loadTestimonials();
}

/* ------------------------------- Global search ------------------------------- */

export interface SearchResult {
  kind: "hotspot" | "homestay" | "experience" | "eatery" | "tour" | "craft";
  slug: string;
  title: string;
  subtitle: string;
  href: string;
  image?: string;
}

export async function globalSearch(term: string, limit = 8): Promise<SearchResult[]> {
  const t = term.trim().toLowerCase();
  if (!t) return [];
  const out: SearchResult[] = [];

  const [hotspots, homestays, experiences, eateries, crafts, tours] = await Promise.all([
    loadHotspots(),
    loadHomestays(),
    loadExperiences(),
    loadEateries(),
    loadCrafts(),
    loadTours(),
  ]);

  for (const h of hotspots) {
    if (`${h.name} ${h.location} ${h.tags.join(" ")}`.toLowerCase().includes(t))
      out.push({ kind: "hotspot", slug: h.slug, title: h.name, subtitle: h.location, href: `/hotspots/${h.slug}`, image: h.images[0]?.src });
  }
  for (const h of homestays) {
    if (`${h.title} ${h.location}`.toLowerCase().includes(t))
      out.push({ kind: "homestay", slug: h.slug, title: h.title, subtitle: h.location, href: `/homestays/${h.slug}`, image: h.images[0]?.src });
  }
  for (const e of experiences) {
    if (`${e.title} ${e.location}`.toLowerCase().includes(t))
      out.push({ kind: "experience", slug: e.slug, title: e.title, subtitle: e.location, href: `/experiences/${e.slug}`, image: e.images[0]?.src });
  }
  for (const e of eateries) {
    if (`${e.name} ${e.location}`.toLowerCase().includes(t))
      out.push({ kind: "eatery", slug: e.slug, title: e.name, subtitle: e.location, href: `/eateries/${e.slug}`, image: e.images[0]?.src });
  }
  for (const c of crafts) {
    if (`${c.name} ${c.maker} ${c.materials.join(" ")}`.toLowerCase().includes(t))
      out.push({ kind: "craft", slug: c.slug, title: c.name, subtitle: c.maker, href: `/store/${c.slug}`, image: c.images[0]?.src });
  }
  for (const t2 of tours) {
    if (`${t2.title} ${t2.themes.join(" ")}`.toLowerCase().includes(t))
      out.push({ kind: "tour", slug: t2.slug, title: t2.title, subtitle: `${t2.durationDays} days`, href: `/tours/${t2.slug}`, image: t2.images[0]?.src });
  }

  return out.slice(0, limit);
}
