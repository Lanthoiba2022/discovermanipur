/**
 * Signed `/api/place-photo` URLs, so the route only resolves refs this site
 * itself rendered.
 *
 * SERVER ONLY, by convention: it imports `node:crypto` and reads a secret.
 * Never import it from a client component: `node:crypto` does not bundle for
 * the browser, and the secret must not reach it anyway. `photos.ts` stays browser-safe;
 * this module is the server half that the catalogue loader calls when it
 * mints image URLs.
 *
 * Why sign at all: without it, `/api/place-photo` resolves any well-formed
 * `places/<id>/photos/<id>` ref, so anyone can use this deployment as a free
 * Google Places photo proxy billed to the project. With it, the route answers
 * 404 to any ref whose `s` parameter was not produced here.
 *
 * What is signed: the ref only, not the width. The route snaps every width to
 * a fixed set and redirects odd ones to the canonical URL, so the width cannot
 * be used to multiply Places calls, and signing it would only break those
 * redirects.
 *
 * The signature is the first 22 characters (132 bits) of the base64url
 * HMAC-SHA256 of the ref. URL-safe, short enough not to bloat a gallery's
 * HTML, and far beyond guessing.
 *
 * Rollout:
 * - `PLACE_PHOTO_URL_SECRET` unset (or shorter than 32 characters): signing is
 *   off, URLs carry no `s`, and the route accepts every ref exactly as before.
 *   Forks and local machines need nothing.
 * - Set it in Vercel (Production): every new deployment's HTML carries signed
 *   URLs, because the catalogue cache is keyed by deployment and is rebuilt
 *   with the new URLs. From then on unsigned or tampered URLs 404.
 * - Rotating it invalidates every URL minted under the old value, which is
 *   harmless across a deploy and breaks pages only if done without one.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import { placePhotoUrl } from "./photos";

/** Signatures are this many base64url characters of the HMAC. */
const SIGNATURE_LENGTH = 22;

/** Shorter secrets are ignored rather than trusted: 32+ characters or nothing. */
const MIN_SECRET_LENGTH = 32;

const rawSecret = process.env.PLACE_PHOTO_URL_SECRET?.trim() ?? "";
const secret = rawSecret.length >= MIN_SECRET_LENGTH ? rawSecret : null;

/** True when `PLACE_PHOTO_URL_SECRET` is set to a usable value. */
export const isPlacePhotoSigningEnabled = secret !== null;

/** The signature for `ref`, or `null` when signing is off. */
export function signPlaceRef(ref: string): string | null {
  if (!secret) return null;
  return createHmac("sha256", secret).update(ref).digest("base64url").slice(0, SIGNATURE_LENGTH);
}

/**
 * `placePhotoUrl(ref)` (the single 1200px width the site uses), plus `&s=`
 * when signing is on. The catalogue loader mints every Places `src` here.
 */
export function signedPlacePhotoUrl(ref: string): string {
  const signature = signPlaceRef(ref);
  const url = placePhotoUrl(ref);
  return signature ? `${url}&s=${signature}` : url;
}

/**
 * Does `signature` match `ref`? Always true when signing is off, so the
 * route behaves exactly as it did before the secret existed.
 *
 * Constant-time over equal-length buffers; a length mismatch is rejected
 * first because `timingSafeEqual` throws on unequal lengths, and the length
 * of a valid signature is public anyway.
 */
export function verifyPlaceRef(ref: string, signature: string | null | undefined): boolean {
  if (!secret) return true;
  const expected = signPlaceRef(ref);
  if (!expected || !signature) return false;
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
