/**
 * The zod-free half of the saved-list contract: the kinds, the caps and the
 * row types. The wishlist client module (`@/lib/booking/wishlist`) reads these
 * on every page that shows a save button, so they live apart from the
 * validation schemas in `./schema`: importing anything from a module that
 * builds a zod schema at load time ships zod's whole runtime (about 95 KB
 * gzip with its locales) to that page, and `/homestays` needs none of it.
 *
 * `./schema` re-exports everything here, so server code can keep importing
 * from one place.
 */

export const SAVED_KINDS = ["homestay", "hotspot", "experience"] as const;

export type SavedKind = (typeof SAVED_KINDS)[number];

export interface SavedItem {
  kind: SavedKind;
  slug: string;
  title: string;
  subtitle?: string;
  image?: string;
  /**
   * The photographer credit for `image`, e.g. "Photo: A. Singh / Google Maps".
   * Showing it is a licence condition when `image` is a Google Places photo,
   * so it travels with the image rather than being looked up at render time.
   * Optional: shortlists saved in a browser before this field existed lack
   * it, and the panel falls back to a bare source line for Places photos.
   */
  imageCredit?: string;
  href: string;
  savedAt: string;
}

/** Per-account cap, so one account cannot grow the table without limit. */
export const MAX_SAVED_ITEMS = 500;

/** Most entries one browser-to-account import may carry. */
export const MAX_SAVED_IMPORT = 200;

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
