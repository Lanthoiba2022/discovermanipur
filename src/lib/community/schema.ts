import { z } from "zod";

import { LIMITS } from "./rules";
import { CATEGORIES, DISTRICTS, LICENCES, RELATIONSHIPS, licenceNeedsSource } from "./taxonomy";

/**
 * Input shapes for community places. Shared by the forms (instant feedback)
 * and the Server Actions and Route Handlers (the actual gate): a Server Action
 * is a public endpoint, so the server always parses again.
 */

/** A rough box around Manipur, with margin. Coordinates outside it are a typo. */
export const MANIPUR_BOUNDS = { minLat: 23.7, maxLat: 25.8, minLng: 92.9, maxLng: 94.9 } as const;

/** Field lengths, shared with the form so its counters and the server agree. */
export const PLACE_LIMITS = {
  nameMin: 3,
  nameMax: 100,
  locationMin: 5,
  locationMax: 200,
  descriptionMin: 80,
  descriptionMax: 2000,
  practicalMax: 1500,
  sources: 5,
  sourceUrlMax: 500,
  authorMax: 80,
  altMax: 200,
} as const;

const count = (n: number) => n.toLocaleString("en-IN");

/** The largest photo file the upload route accepts. The browser re-encodes to below it. */
export const MAX_PHOTO_UPLOAD_BYTES = 4 * 1024 * 1024;

const coordinate = (axis: "latitude" | "longitude", min: number, max: number) =>
  z
    .number(`Enter the ${axis} as a number, e.g. ${axis === "latitude" ? "24.81" : "93.94"}.`)
    .min(min, `That ${axis} is outside Manipur. Check the number, or leave both coordinates empty.`)
    .max(max, `That ${axis} is outside Manipur. Check the number, or leave both coordinates empty.`)
    .optional();

const httpsUrl = z
  .string()
  .trim()
  .max(PLACE_LIMITS.sourceUrlMax, `Keep each link under ${PLACE_LIMITS.sourceUrlMax} characters.`)
  .url("Enter a full link, starting with https://")
  .refine((v) => /^https:\/\//i.test(v), "Use an https:// link.");

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(""));

export const placeSubmissionSchema = z
  .strictObject({
    name: z
      .string()
      .trim()
      .min(PLACE_LIMITS.nameMin, `Give the place a name of at least ${PLACE_LIMITS.nameMin} characters.`)
      .max(PLACE_LIMITS.nameMax, `Keep the name under ${PLACE_LIMITS.nameMax} characters.`),
    category: z.enum(CATEGORIES, "Choose what kind of place this is."),
    district: z.enum(DISTRICTS, "Choose the district."),
    location: z
      .string()
      .trim()
      .min(PLACE_LIMITS.locationMin, "Say where it is: leikai, village or nearest landmark.")
      .max(PLACE_LIMITS.locationMax, `Keep the location under ${PLACE_LIMITS.locationMax} characters.`),
    lat: coordinate("latitude", MANIPUR_BOUNDS.minLat, MANIPUR_BOUNDS.maxLat),
    lng: coordinate("longitude", MANIPUR_BOUNDS.minLng, MANIPUR_BOUNDS.maxLng),
    description: z
      .string()
      .trim()
      .min(PLACE_LIMITS.descriptionMin, `Tell visitors a little more: at least ${PLACE_LIMITS.descriptionMin} characters.`)
      .max(PLACE_LIMITS.descriptionMax, `Keep the description under ${count(PLACE_LIMITS.descriptionMax)} characters.`),
    practicalDetails: optionalText(
      PLACE_LIMITS.practicalMax,
      `Keep the practical details under ${count(PLACE_LIMITS.practicalMax)} characters.`,
    ),
    sources: z.array(httpsUrl).max(PLACE_LIMITS.sources, `Add at most ${PLACE_LIMITS.sources} links.`).default([]),
    relationship: z.enum(RELATIONSHIPS, "Say how you are connected to this place."),
    photoIds: z
      .array(z.uuid())
      .max(LIMITS.photosPerPlace, `Add at most ${LIMITS.photosPerPlace} photos.`)
      .refine((ids) => new Set(ids).size === ids.length, "Each photo can be added once.")
      .default([]),
    /** Optional description of each photo for screen readers, keyed by photo id. */
    photoAlts: z
      .record(z.uuid(), z.string().trim().max(PLACE_LIMITS.altMax, `Keep each photo description under ${PLACE_LIMITS.altMax} characters.`))
      .default({}),
    agree: z.literal(true, "Confirm the details are accurate and you may share the photos."),
  })
  .refine((v) => (v.lat === undefined) === (v.lng === undefined), {
    path: ["lat"],
    message: "Give both latitude and longitude, or neither.",
  })
  .refine((v) => Object.keys(v.photoAlts).every((id) => v.photoIds.includes(id)), {
    path: ["photoAlts"],
    message: "A photo description belongs to a photo that is not in this listing.",
  });

export type PlaceSubmissionInput = z.input<typeof placeSubmissionSchema>;
export type PlaceSubmission = z.output<typeof placeSubmissionSchema>;

/** The fields sent alongside each uploaded photo. */
export const photoMetaSchema = z
  .strictObject({
    licence: z.enum(LICENCES, "Choose the photo's licence."),
    author: z
      .string()
      .trim()
      .min(2, "Say who took the photo.")
      .max(PLACE_LIMITS.authorMax, `Keep the name under ${PLACE_LIMITS.authorMax} characters.`),
    sourceUrl: httpsUrl.optional().or(z.literal("")),
    alt: optionalText(PLACE_LIMITS.altMax, `Keep the description under ${PLACE_LIMITS.altMax} characters.`),
  })
  .refine((v) => !licenceNeedsSource(v.licence) || Boolean(v.sourceUrl), {
    path: ["sourceUrl"],
    message: "Link to the page that shows the photo's licence.",
  });


export const placeIdSchema = z.uuid();
export const photoIdSchema = z.uuid();

export const ADMIN_NOTE_MAX = 1000;
export const REJECT_NOTE_MIN = 10;

export const adminDecisionSchema = z.strictObject({
  placeId: z.uuid(),
  note: z.string().trim().max(ADMIN_NOTE_MAX).optional(),
});
