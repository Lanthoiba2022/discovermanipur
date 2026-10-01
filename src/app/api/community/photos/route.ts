/**
 * POST /api/community/photos: upload one photo for a place being listed.
 *
 * multipart/form-data with `file` plus the licence fields of `photoMetaSchema`.
 * Answers `{ photo }` (a `CommunityPhoto`) to attach when the place is
 * submitted. A Route Handler rather than a Server Action because it takes a
 * binary body several megabytes long, which Server Actions are capped below.
 *
 * In order, before any work is spent: same-origin check, per-IP rate limit,
 * signed-in verified account, a body-size cap enforced while reading, and a
 * daily per-account quota counted in the database. The bytes are then decoded
 * and re-encoded by sharp (`processPhoto`), which is also what strips GPS and
 * other metadata. Storage keys come from a server-generated id.
 */

import { randomUUID } from "node:crypto";

import { and, count, eq, gt, isNull, lt, sql } from "drizzle-orm";

import { processPhoto, PhotoRejected } from "@/lib/community/images";
import { photoCredit, photoUrl } from "@/lib/community/photo-links";
import { LIMITS } from "@/lib/community/rules";
import { MAX_PHOTO_UPLOAD_BYTES, photoMetaSchema } from "@/lib/community/schema";
import { getPhotoStore, photoKeys, type PhotoStore } from "@/lib/community/storage";
import type { CommunityPhoto } from "@/lib/community/types";
import { getCommunityViewer } from "@/lib/community/viewer";
import { getDb, schema, type Db } from "@/lib/db";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { clientIp, isSameOrigin, jsonError, readBodyBytes } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** The browser re-encodes photos to well under this before sending them. */
const MAX_FILE_BYTES = MAX_PHOTO_UPLOAD_BYTES;
/** The file plus the form fields and multipart framing. Under Vercel's 4.5 MB body limit. */
const MAX_BODY_BYTES = MAX_FILE_BYTES + 64 * 1024;

const TOO_LARGE = `That photo is too large. Use one under ${MAX_FILE_BYTES / (1024 * 1024)} MB.`;

const QUOTA_REACHED = `You can upload up to ${LIMITS.uploadsPerDay} photos a day. Try again tomorrow.`;

const RATE = { limit: 30, windowMs: 10 * 60_000 };

const { community_place_photos: photos } = schema;

/**
 * Uploads never attached to a place are discarded after a day. Done a few at a
 * time on each upload, so no scheduled job is needed.
 */
async function purgeStaleUploads(db: Db, store: PhotoStore) {
  const stale = await db
    .delete(photos)
    .where(
      sql`${photos.id} in (select id from ${photos} where ${and(
        isNull(photos.place_id),
        lt(photos.created_at, sql`now() - make_interval(hours => ${LIMITS.unattachedPhotoHours})`),
      )} limit 10)`,
    )
    .returning({ storageKey: photos.storage_key, thumbKey: photos.thumb_key });
  if (stale.length > 0) await store.delete(stale.flatMap((p) => [p.storageKey, p.thumbKey]));
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "Cross-site requests are not accepted.");

  const verdict = rateLimit("community-upload", clientIp(request.headers), RATE);
  if (!verdict.ok) return tooManyRequests(verdict);

  const db = getDb();
  const store = getPhotoStore();
  if (!db || !store) return jsonError(503, "Photo uploads are not available on this site right now.");

  const viewer = await getCommunityViewer();
  if (!viewer) return jsonError(401, "Sign in to upload photos.");
  if (viewer.banned) return jsonError(403, "This account cannot upload photos.");
  if (!viewer.emailVerified) return jsonError(403, "Verify your email address to upload photos.");

  const [{ today }] = await db
    .select({ today: count() })
    .from(photos)
    .where(and(eq(photos.uploaded_by, viewer.userId), gt(photos.created_at, sql`now() - interval '24 hours'`)));
  // A cheap early refusal; the authoritative check is under a lock below.
  if (today >= LIMITS.uploadsPerDay) return jsonError(429, QUOTA_REACHED);

  const body = await readBodyBytes(request, MAX_BODY_BYTES);
  if (body === null) return jsonError(413, TOO_LARGE);

  let form: FormData;
  try {
    form = await new Response(body as BodyInit, {
      headers: { "content-type": request.headers.get("content-type") ?? "" },
    }).formData();
  } catch {
    return jsonError(400, "Send the photo as a form upload.");
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return jsonError(400, "Choose a photo to upload.");
  if (file.size > MAX_FILE_BYTES) return jsonError(413, TOO_LARGE);

  const meta = photoMetaSchema.safeParse({
    licence: form.get("licence") ?? undefined,
    author: form.get("author") ?? undefined,
    sourceUrl: form.get("sourceUrl") ?? "",
    alt: form.get("alt") ?? "",
  });
  if (!meta.success) return jsonError(422, meta.error.issues[0]?.message ?? "Check the photo details.");

  let processed;
  try {
    processed = await processPhoto(Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    if (err instanceof PhotoRejected) return jsonError(422, err.message);
    throw err;
  }

  const id = randomUUID();
  const keys = photoKeys(id);
  try {
    await store.put(keys.full, processed.full.buffer, "image/webp");
    await store.put(keys.thumb, processed.thumb.buffer, "image/webp");
  } catch (err) {
    console.error("[community-upload] storage failed:", (err as Error).message);
    await store.delete([keys.full, keys.thumb]).catch(() => undefined);
    return jsonError(502, "The photo could not be saved. Try again in a moment.");
  }

  // The quota is checked again under a per-account lock, in the same
  // transaction as the insert, so parallel uploads cannot all pass at the
  // limit. Discarded uploads keep their row for a day and still count.
  let accepted: boolean;
  try {
    accepted = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`community_upload:${viewer.userId}`}))`);
      const [{ count: recent }] = await tx
        .select({ count: count() })
        .from(photos)
        .where(and(eq(photos.uploaded_by, viewer.userId), gt(photos.created_at, sql`now() - interval '24 hours'`)));
      if (recent >= LIMITS.uploadsPerDay) return false;
      await tx.insert(photos).values({
        id,
        uploaded_by: viewer.userId,
        storage_key: keys.full,
        thumb_key: keys.thumb,
        width: processed.full.width,
        height: processed.full.height,
        bytes: processed.full.buffer.byteLength,
        alt: meta.data.alt || null,
        licence: meta.data.licence,
        author: meta.data.author,
        source_url: meta.data.sourceUrl || null,
      });
      return true;
    });
  } catch (err) {
    console.error("[community-upload] insert failed:", (err as Error).message);
    await store.delete([keys.full, keys.thumb]).catch(() => undefined);
    return jsonError(500, "The photo could not be saved. Try again in a moment.");
  }
  if (!accepted) {
    await store.delete([keys.full, keys.thumb]).catch(() => undefined);
    return jsonError(429, QUOTA_REACHED);
  }

  await purgeStaleUploads(db, store).catch((err) =>
    console.warn("[community-upload] stale purge failed:", (err as Error).message),
  );

  const photo: CommunityPhoto = {
    id,
    src: photoUrl(id),
    thumbSrc: photoUrl(id, "thumb"),
    width: processed.full.width,
    height: processed.full.height,
    alt: meta.data.alt || "",
    licence: meta.data.licence,
    author: meta.data.author,
    sourceUrl: meta.data.sourceUrl || null,
    credit: photoCredit(meta.data.author, meta.data.licence),
  };
  return Response.json({ photo }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
