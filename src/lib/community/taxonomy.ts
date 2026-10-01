/**
 * Labels for the community-place enums. Safe in the browser: no server
 * imports. The values mirror the Postgres enums in `src/lib/db/schema.ts`.
 */

export { DISTRICTS } from "@/lib/host/types";

export const CATEGORIES = ["attraction", "eatery", "stay", "craft"] as const;
export type CommunityCategory = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<CommunityCategory, string> = {
  attraction: "Attraction or hidden gem",
  eatery: "Cafe or restaurant",
  stay: "Homestay or resort",
  craft: "Handloom, craft or traditional wear",
};

/** Short form for chips and table cells. */
export const CATEGORY_SHORT_LABELS: Record<CommunityCategory, string> = {
  attraction: "Attraction",
  eatery: "Food",
  stay: "Stay",
  craft: "Crafts",
};

export const RELATIONSHIPS = ["none", "owner", "connected"] as const;
export type SubmitterRelationship = (typeof RELATIONSHIPS)[number];

export const RELATIONSHIP_LABELS: Record<SubmitterRelationship, string> = {
  none: "I am not connected to this place",
  owner: "I own it, work there or represent it",
  connected: "I am a relative or friend of the owner",
};

/** What a public page says about who listed a place. */
export const RELATIONSHIP_DISCLOSURES: Record<SubmitterRelationship, string | null> = {
  none: null,
  owner: "Listed by the owner or someone who works there.",
  connected: "Listed by a relative or friend of the owner.",
};

export const LICENCES = ["own-work", "cc-by-4.0", "cc-by-sa-4.0", "cc0"] as const;
export type PhotoLicence = (typeof LICENCES)[number];

export const LICENCE_LABELS: Record<PhotoLicence, string> = {
  "own-work": "I took this photo",
  "cc-by-4.0": "CC BY 4.0",
  "cc-by-sa-4.0": "CC BY-SA 4.0",
  cc0: "CC0 / public domain",
};

/** Photos the uploader did not take need a source page proving the licence. */
export function licenceNeedsSource(licence: PhotoLicence): boolean {
  return licence !== "own-work";
}

export const STATUS_LABELS = {
  pending: "Collecting votes",
  published: "Published",
  held: "Held for review",
  rejected: "Not published",
} as const;
