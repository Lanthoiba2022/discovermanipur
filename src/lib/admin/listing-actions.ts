"use server";

/**
 * Listing moderation for /admin/listings. Every export here is a public POST
 * endpoint, so each one re-reads the caller's role from `public.profiles` and
 * takes nothing from the client but which row and the new value.
 */

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSessionProfile } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";

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
 * Catalogue rows feed prerendered pages across the site (home, detail pages,
 * district and search views, the sitemap), so a moderation change refreshes
 * every cached route rather than a list that would drift out of date. It also
 * re-renders the admin page in the same response.
 */
function refreshSite() {
  revalidatePath("/", "layout");
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
    console.error("[admin] set featured failed:", err);
    return FAILED;
  }

  refreshSite();
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
    console.error("[admin] set active failed:", err);
    return FAILED;
  }

  refreshSite();
  return { ok: true };
}
