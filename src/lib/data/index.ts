/**
 * Discover Manipur data layer: the single boundary between content and UI.
 *
 * Every route imports from here and never from `./seed/*` directly.
 *
 * Rows come from Neon via `./catalogue`, which falls back to the bundled
 * seed data when the project is unconfigured or a query fails. The filter,
 * sort, paginate and search logic below runs in memory over either source.
 * Ordering itself lives in `./sort.ts`, which client components may import;
 * this file may not be imported from the browser.
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
  loadAllHomestaySlugs,
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
import { sortRows as sortListRows, type SortableRow } from "./sort";

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
 * Ordering lives in `./sort.ts` so the static listing pages can run the same
 * comparator in the browser. Default: cohort (`sortWeight`) first, then
 * featured. Explicit price sorts put unpriced rows last. See that file for why.
 */
function sortRows<T extends SortableRow>(
  rows: T[],
  q: ListQuery | undefined,
  priceOf: (row: T) => number,
) {
  return sortListRows(rows, q?.sort, priceOf);
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

export async function getAllHomestaySlugs(): Promise<string[]> {
  return loadAllHomestaySlugs();
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
