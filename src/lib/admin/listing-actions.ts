"use server";

/**
 * Listing moderation for /admin/listings. Every export here is a public POST
 * endpoint, so each one re-reads the caller's role from `public.profiles` and
 * takes nothing from the client but which row and the new value.
 */

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { getSessionProfile } from "@/lib/auth/dal";
import { catalogueTableTag } from "@/lib/data/cache";
import { getDb, schema } from "@/lib/db";
import { logDbError } from "@/lib/log";

import type { ModerationResult } from "./types";

const NOT_ALLOWED: ModerationResult = { ok: false, error: "You do not have permission to do that." };
const FAILED: ModerationResult = { ok: false, error: "That change could not be saved. Try again in a moment." };

// `guid` rather than `uuid`: it checks the shape without insisting on an RFC
// version nibble, which hand-written seed ids may not carry.
const featuredInput = z.strictObject({
  kind: z.enum(["homestay", "experience"]),
  id: z.guid(),
  featured: z.boolean(),
});

const activeInput = z.strictObject({
  id: z.guid(),
  isActive: z.boolean(),
});

/**
 * Refresh what one moderation change affects, and nothing more.
 *
 * `updateTag(catalogueTableTag(table))` drops the cached rows of that one table.
 * Next copies a cache entry's tags onto every prerendered page that read it
 * (see src/lib/data/cache.ts), so the same call also regenerates exactly the
 * public pages that show the table (its listing and detail pages, search,
 * district views, the sitemap, home if it shows them). No public
 * `revalidatePath` is needed, and the other eight tables and every page that
 * never read this one stay cached. (This used to clear the whole catalogue tag plus
 * `revalidatePath("/", "layout")`, regenerating the entire site per click.)
 *
 * `/admin/listings` is dynamic and not tagged, so it is revalidated by path to
 * re-render with the change in this same response.
 */
function refreshListings(table: "homestays" | "experiences") {
  updateTag(catalogueTableTag(table));
  revalidatePath("/admin/listings");
}

export async function setListingFeatured(input: z.input<typeof featuredInput>): Promise<ModerationResult> {
  const profile = await getSessionProfile();
  if (profile?.role !== "admin") return NOT_ALLOWED;

  const parsed = featuredInput.safeParse(input);
  if (!parsed.success) return FAILED;
  const { kind, id, featured } = parsed.data;

  const db = getDb();
  if (!db) return FAILED;

  try {
    const updated =
      kind === "homestay"
        ? await db
            .update(schema.homestays)
            .set({ featured })
            .where(eq(schema.homestays.id, id))
            .returning({ id: schema.homestays.id })
        : await db
            .update(schema.experiences)
            .set({ featured })
            .where(eq(schema.experiences.id, id))
            .returning({ id: schema.experiences.id });
    if (updated.length === 0) return FAILED;
  } catch (err) {
    logDbError("admin.set-featured", err, { kind });
    return FAILED;
  }

  refreshListings(kind === "homestay" ? "homestays" : "experiences");
  return { ok: true };
}

/** Homestays only: `experiences` has no `is_active` column. */
export async function setHomestayActive(input: z.input<typeof activeInput>): Promise<ModerationResult> {
  const profile = await getSessionProfile();
  if (profile?.role !== "admin") return NOT_ALLOWED;

  const parsed = activeInput.safeParse(input);
  if (!parsed.success) return FAILED;
  const { id, isActive } = parsed.data;

  const db = getDb();
  if (!db) return FAILED;

  try {
    const updated = await db
      .update(schema.homestays)
      .set({ is_active: isActive })
      .where(eq(schema.homestays.id, id))
      .returning({ id: schema.homestays.id });
    if (updated.length === 0) return FAILED;
  } catch (err) {
    logDbError("admin.set-active", err);
    return FAILED;
  }

  refreshListings("homestays");
  return { ok: true };
}
