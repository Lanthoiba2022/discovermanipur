/**
 * Turns `saved_items` references into the cards the saved list renders, from
 * the live catalogue. Server code only (it reaches the database through
 * `@/lib/data`); not a `"use server"` file, so none of it is an endpoint.
 */

import { getExperiences, getHomestays, getHotspots } from "@/lib/data";

import type { SavedItem, SavedKind, SavedRef } from "./schema";

type Card = Omit<SavedItem, "savedAt">;

const keyOf = (ref: { kind: SavedKind; slug: string }) => `${ref.kind}:${ref.slug}`;

/**
 * Cards for the public listings of every kind in `refs`, keyed by `kind:slug`;
 * a reference with no entry no longer points at a public listing. Inactive homestays are left out by `getHomestays`, so a hidden
 * listing never surfaces through someone's old bookmark.
 *
 * `imageCredit` carries the lead photo's credit with it: for the research rows
 * that photo is a Google Places photo, whose attribution must be shown
 * wherever the photo is.
 */
export async function resolveCards(refs: readonly SavedRef[]): Promise<Map<string, Card>> {
  const kinds = new Set(refs.map((ref) => ref.kind));
  const [homestays, hotspots, experiences] = await Promise.all([
    kinds.has("homestay") ? getHomestays() : [],
    kinds.has("hotspot") ? getHotspots() : [],
    kinds.has("experience") ? getExperiences() : [],
  ]);

  const cards = new Map<string, Card>();
  for (const h of homestays) {
    cards.set(keyOf({ kind: "homestay", slug: h.slug }), {
      kind: "homestay",
      slug: h.slug,
      title: h.title,
      subtitle: h.location,
      image: h.images[0]?.src,
      imageCredit: h.images[0]?.credit,
      href: `/homestays/${h.slug}`,
    });
  }
  for (const h of hotspots) {
    cards.set(keyOf({ kind: "hotspot", slug: h.slug }), {
      kind: "hotspot",
      slug: h.slug,
      title: h.name,
      subtitle: h.location,
      image: h.images[0]?.src,
      imageCredit: h.images[0]?.credit,
      href: `/hotspots/${h.slug}`,
    });
  }
  for (const e of experiences) {
    cards.set(keyOf({ kind: "experience", slug: e.slug }), {
      kind: "experience",
      slug: e.slug,
      title: e.title,
      subtitle: e.location,
      image: e.images[0]?.src,
      imageCredit: e.images[0]?.credit,
      href: `/experiences/${e.slug}`,
    });
  }

  return cards;
}

export { keyOf as savedKeyOf };
