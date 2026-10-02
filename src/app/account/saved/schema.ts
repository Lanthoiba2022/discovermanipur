import { z } from "zod";

import { MAX_SAVED_IMPORT, SAVED_KINDS } from "./types";

/**
 * Validation for the saved-list Server Actions. A `public.saved_items` row is
 * only `(user_id, kind, slug)`; everything the list shows is looked up from
 * the catalogue when it is read.
 *
 * Server-side only in practice: the kinds, caps and row types live in the
 * zod-free `./types` (re-exported below), which is what client code imports,
 * so this module and zod stay out of the browser bundle.
 */

export {
  MAX_SAVED_IMPORT,
  MAX_SAVED_ITEMS,
  SAVED_KINDS,
  type SavedItem,
  type SavedKind,
  type SavedListResult,
  type SavedWriteResult,
} from "./types";

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
