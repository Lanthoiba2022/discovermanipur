import { z } from "zod";

/**
 * Shapes shared by the wishlist client module and its Server Actions. A
 * `public.saved_items` row is only `(user_id, kind, slug)`; everything the
 * list shows is looked up from the catalogue when it is read.
 */

export const SAVED_KINDS = ["homestay", "hotspot", "experience"] as const;

export type SavedKind = (typeof SAVED_KINDS)[number];

export interface SavedItem {
  kind: SavedKind;
  slug: string;
  title: string;
  subtitle?: string;
  image?: string;
  href: string;
  savedAt: string;
}

/** Per-account cap, so one account cannot grow the table without limit. */
export const MAX_SAVED_ITEMS = 500;

/** Most entries one browser-to-account import may carry. */
export const MAX_SAVED_IMPORT = 200;

export const savedRefSchema = z.object({
  kind: z.enum(SAVED_KINDS),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/),
});

export type SavedRef = z.infer<typeof savedRefSchema>;

export const savedImportSchema = z
  .array(
    savedRefSchema.extend({
      savedAt: z.iso.datetime({ offset: true }).optional().catch(undefined),
    }),
  )
  .max(MAX_SAVED_IMPORT);

/**
 * Where the signed-in visitor's list lives. `browser` means this deployment
 * has no database (or nobody is signed in), so the list stays in
 * localStorage exactly as before.
 */
export type SavedListResult =
  | { storage: "browser" }
  | { storage: "account"; items: SavedItem[] }
  | { error: string };

export type SavedWriteResult = { ok: true } | { ok: false; error: string };
