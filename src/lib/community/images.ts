/**
 * Turns an uploaded file into the two WebP images the site stores. Server-only.
 *
 * Nothing the browser sends is trusted: the bytes are decoded by sharp, which
 * proves they are an image (whatever the file name or Content-Type said),
 * refuses decompression bombs, and re-encodes from pixels. Re-encoding is also
 * what removes every piece of metadata, including GPS coordinates, which
 * matters for photos of people's homes. The camera's orientation is applied to
 * the pixels first so nothing ends up sideways.
 */

import sharp, { type Metadata } from "sharp";

/** Formats the browser re-encoder produces, plus the common camera ones. */
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp", "avif"]);

/** Decompression-bomb guard: about a 50 megapixel image. */
const MAX_INPUT_PIXELS = 50_000_000;
/** A photo this small cannot show a place. */
const MIN_EDGE = 320;

const FULL = { edge: 1600, quality: 82 } as const;
const THUMB = { edge: 640, quality: 74 } as const;

export class PhotoRejected extends Error {}

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
}

export interface ProcessedPhoto {
  full: ProcessedImage;
  thumb: ProcessedImage;
}

async function encode(input: Buffer, edge: number, quality: number): Promise<ProcessedImage> {
  const { data, info } = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" })
    .rotate()
    .resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}

export async function processPhoto(input: Buffer): Promise<ProcessedPhoto> {
  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" }).metadata();
  } catch {
    throw new PhotoRejected("That file is not an image we can read. Use a JPEG, PNG or WebP photo.");
  }

  if (!meta.format || !ACCEPTED_FORMATS.has(meta.format)) {
    throw new PhotoRejected("Use a JPEG, PNG or WebP photo.");
  }
  if ((meta.pages ?? 1) > 1) throw new PhotoRejected("Animated images are not accepted.");
  if (!meta.width || !meta.height || Math.min(meta.width, meta.height) < MIN_EDGE) {
    throw new PhotoRejected(`The photo is too small. Use one at least ${MIN_EDGE} pixels on each side.`);
  }

  try {
    const [full, thumb] = await Promise.all([
      encode(input, FULL.edge, FULL.quality),
      encode(input, THUMB.edge, THUMB.quality),
    ]);
    return { full, thumb };
  } catch {
    throw new PhotoRejected("That photo could not be processed. Try another one.");
  }
}
