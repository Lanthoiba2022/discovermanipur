"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb, schema } from "@/lib/db";
import { getSessionUser } from "@/lib/host/role";

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
      .returning({ slug: schema.homestays.slug, isActive: schema.homestays.is_active });
    if (!row) return FAILED;

    // The public catalogue is read per render, but the detail pages and the
    // sitemap are prerendered, so they must be told to rebuild.
    revalidatePath(`/homestays/${row.slug}`);
    revalidatePath("/homestays");
    revalidatePath("/sitemap.xml");
    revalidatePath("/host/dashboard");
    return { ok: true, isActive: row.isActive };
  } catch (err) {
    console.error("[host-dashboard] pause failed:", err);
    return FAILED;
  }
}
