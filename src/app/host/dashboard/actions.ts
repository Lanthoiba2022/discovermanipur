"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { catalogueTableTag } from "@/lib/data/cache";
import { getDb, schema } from "@/lib/db";
import { getSessionUser } from "@/lib/host/role";
import { logDbError } from "@/lib/log";

export type ListingPauseResult = { ok: true; isActive: boolean } | { ok: false; message: string };

const pauseSchema = z.object({
  listingId: z.uuid(),
  paused: z.boolean(),
});

const FAILED: ListingPauseResult = {
  ok: false,
  message: "That listing could not be updated. Refresh the page and try again.",
};

/**
 * Pause or resume one of the signed-in host's homestays.
 *
 * A public endpoint like every Server Action, so the role is checked here and
 * the UPDATE matches on `host_id = <session user>` as well as the id: a host
 * who posts someone else's listing id updates nothing. Experiences have no
 * `is_active` column, so only homestays can be paused.
 *
 * Refreshing: `updateTag(catalogueTableTag("homestays"))` drops the cached
 * homestay rows, and because Next copies that tag onto every prerendered page
 * that read them (see src/lib/data/cache.ts), it also regenerates the detail
 * page, the listing, the sitemap and any other page that shows homestays. No
 * public `revalidatePath` is needed. The dashboard is dynamic and untagged, so it is revalidated by
 * path to show the new state in this same response.
 */
export async function setHomestayPaused(input: {
  listingId: string;
  paused: boolean;
}): Promise<ListingPauseResult> {
  const user = await getSessionUser();
  if (!user || (user.role !== "host" && user.role !== "admin")) return FAILED;

  const parsed = pauseSchema.safeParse(input);
  if (!parsed.success) return FAILED;

  const db = getDb();
  if (!db) return FAILED;

  const { listingId, paused } = parsed.data;
  try {
    const [row] = await db
      .update(schema.homestays)
      .set({ is_active: !paused })
      .where(and(eq(schema.homestays.id, listingId), eq(schema.homestays.host_id, user.id)))
      .returning({ isActive: schema.homestays.is_active });
    if (!row) return FAILED;

    updateTag(catalogueTableTag("homestays"));
    revalidatePath("/host/dashboard");
    return { ok: true, isActive: row.isActive };
  } catch (err) {
    logDbError("host-dashboard.pause", err);
    return FAILED;
  }
}
