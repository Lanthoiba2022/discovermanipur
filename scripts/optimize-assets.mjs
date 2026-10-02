/**
 * Re-encode oversized rasters under `public/` in place, keeping every name.
 *
 *   node scripts/optimize-assets.mjs            dry run: prints before/after sizes
 *   node scripts/optimize-assets.mjs --write    applies the re-encodes
 *   node scripts/optimize-assets.mjs --write public/file-uploads/foo.jpg
 *                                               limits the run to the given files
 *
 * Why in place, and why the same format. Every photo in `public/file-uploads/`
 * is referenced by its exact path from the seeds, and therefore from the live
 * Neon rows the site actually reads (the seeds are not the live data). A new
 * name or extension would be a broken image on every row nobody migrated, so
 * this tool never renames, never converts and never deletes. A `.png` stays a
 * PNG and a `.jpg` stays a JPEG, byte for byte a valid file of that type.
 *
 * Two rules, each chosen so a second run is a no-op (idempotent):
 *
 * - **PNG: lossless only.** zlib level 9 with adaptive filtering, truecolour
 *   (no palette quantisation; that is a deferred quality decision, not a
 *   free win). The alpha channel is dropped only when sharp reports the image
 *   fully opaque, so collages whose gaps really are transparent keep them.
 *   The single pixel change allowed is a downscale to `PNG_MAX_EDGE` on the
 *   long edge. Panoramic strips (3:1 or wider) are the exception: they render
 *   as `object-cover` tiles, which crop to the short edge, so a strip like
 *   `hotspotcar5.png` (15120x1350, seven 2160 px panels) keeps a short edge of
 *   `STRIP_MIN_SHORT_EDGE` instead. Capped at 3840 it was 343 px tall and a
 *   4:3 festival tile on a 2x screen upscaled it about 1.75x. Re-running
 *   re-encodes to the same bytes, which do not shrink, so the file is skipped.
 * - **JPEG: only when the long edge exceeds `JPEG_MAX_EDGE`.** The EXIF
 *   orientation is baked in with `rotate()` (it would otherwise be lost with
 *   the metadata), the long edge is resized to `JPEG_MAX_EDGE`, and the file
 *   is written with mozjpeg at quality 82. The ICC profile is kept so colours
 *   do not shift on wide-gamut sources; everything else (EXIF, XMP, IPTC) is
 *   stripped. JPEGs already at or under the cap are never touched, because a
 *   lossy re-encode of an already-sized file only adds generation loss. After
 *   one run every resized file is at the cap, so a second run skips it.
 *
 * Every candidate is encoded to memory first. A result that is not smaller
 * than the original is discarded and the file is left alone. A result that is
 * smaller goes to a temporary file in the same directory and is then renamed
 * over the original, so an interrupted run never leaves a half-written image
 * where the site expects a whole one.
 *
 * Other formats (WebP, AVIF, the Kangla GLB and HDR files) are out of scope:
 * they are either already web encodings or need a content decision first.
 * `scripts/check-assets.mjs` is the matching gate that reports what is still
 * over budget. No network and no database are touched.
 */
import { readdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

/** Long-edge cap for PNG collages: the asset budget's limit, and 2x a 1920 display. */
const PNG_MAX_EDGE = 3840;
/**
 * Short edge kept for panoramic strips (aspect 3:1 or wider): enough for a 4:3
 * cover crop of 900x675, which fills a ~450 CSS px tile on a 2x screen.
 */
const STRIP_MIN_SHORT_EDGE = 675;
const STRIP_MIN_ASPECT = 3;

/**
 * Target long edge for a PNG: `PNG_MAX_EDGE`, or for a panoramic strip the
 * long edge that keeps `STRIP_MIN_SHORT_EDGE` on the short side.
 */
function pngTargetLongEdge(width, height) {
  const long = Math.max(width, height);
  const short = Math.min(width, height);
  if (short === 0 || long / short < STRIP_MIN_ASPECT) return PNG_MAX_EDGE;
  return Math.max(PNG_MAX_EDGE, Math.round((STRIP_MIN_SHORT_EDGE * long) / short));
}
/** Long-edge cap for photographs: the largest the site requests through next/image. */
const JPEG_MAX_EDGE = 2560;
const JPEG_QUALITY = 82;

/**
 * Directories never scanned. `maplibre/` is a git-ignored copy of a library
 * chunk, and `models/` holds GLB/HDR files this tool does not handle.
 */
const SKIP_DIRS = new Set(["maplibre", "models"]);

const args = process.argv.slice(2);
const write = args.includes("--write");
const only = args.filter((a) => !a.startsWith("--")).map((a) => resolve(root, a));

/** Every file under `dir`, depth first, skipping `SKIP_DIRS` at any depth. */
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) files.push(...(await walk(full)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Encode one PNG losslessly, returning the new bytes and a note on what
 * changed, or null when the file is not a PNG this rule applies to.
 */
async function encodePng(input) {
  const meta = await sharp(input).metadata();
  if (meta.format !== "png") return null;

  const { isOpaque } = await sharp(input).stats();
  const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0);
  const targetEdge = pngTargetLongEdge(meta.width ?? 0, meta.height ?? 0);
  const notes = [];

  let pipeline = sharp(input).keepIccProfile();
  if (longEdge > targetEdge) {
    // Fit the long edge to the target and let sharp derive the other side, so
    // the aspect ratio is preserved exactly (rounded to the nearest pixel).
    pipeline = pipeline.resize(
      meta.width >= meta.height
        ? { width: targetEdge, withoutEnlargement: true }
        : { height: targetEdge, withoutEnlargement: true },
    );
    notes.push(`resize long edge ${longEdge} -> ${targetEdge}`);
  }
  if (meta.hasAlpha && isOpaque) {
    pipeline = pipeline.removeAlpha();
    notes.push("drop unused alpha");
  }

  const data = await pipeline
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      // Explicitly truecolour. Setting `palette: false` matters: sharp turns
      // palette mode on implicitly when `effort` is passed without it. With
      // palette off, `effort` has no effect; it is kept so that a later switch
      // to palette mode inherits the slowest, best search.
      palette: false,
      effort: 10,
    })
    .toBuffer();
  notes.push("lossless zlib 9");
  return { data, notes };
}

/** Resize and re-encode one oversized JPEG, or null when it is within the cap. */
async function encodeJpeg(input) {
  const meta = await sharp(input).metadata();
  if (meta.format !== "jpeg") return null;

  // The orientation tag swaps the displayed width and height, so measure the
  // long edge as displayed. For orientations 5-8 the stored axes are rotated.
  const rotated = (meta.orientation ?? 1) >= 5;
  const width = rotated ? meta.height : meta.width;
  const height = rotated ? meta.width : meta.height;
  const longEdge = Math.max(width ?? 0, height ?? 0);
  if (longEdge <= JPEG_MAX_EDGE) return null;

  const data = await sharp(input)
    // Bake the EXIF orientation into the pixels before metadata is stripped.
    .rotate()
    .resize(
      width >= height
        ? { width: JPEG_MAX_EDGE, withoutEnlargement: true }
        : { height: JPEG_MAX_EDGE, withoutEnlargement: true },
    )
    .keepIccProfile()
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
  return { data, notes: [`resize long edge ${longEdge} -> ${JPEG_MAX_EDGE}`, `mozjpeg q${JPEG_QUALITY}`] };
}

/** Human-readable size: KB below a megabyte, MB above. */
function fmt(bytes) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`;
}

const candidates = (only.length > 0 ? only : await walk(publicDir)).filter((file) =>
  /\.(png|jpe?g)$/i.test(file),
);

let totalBefore = 0;
let totalAfter = 0;
let changed = 0;

for (const file of candidates) {
  const rel = relative(root, file);
  const input = await readFile(file);
  const ext = extname(file).toLowerCase();

  let result;
  try {
    result = ext === ".png" ? await encodePng(input) : await encodeJpeg(input);
  } catch (error) {
    console.error(`[assets] ${rel}: could not decode (${error.message}); left unchanged`);
    process.exitCode = 1;
    continue;
  }
  if (!result) continue;

  const before = input.length;
  const after = result.data.length;
  if (after >= before) {
    console.log(`[assets] skip  ${rel}: ${fmt(before)} would not shrink (${fmt(after)})`);
    continue;
  }

  totalBefore += before;
  totalAfter += after;
  changed += 1;
  const pct = (100 * (1 - after / before)).toFixed(0);
  console.log(
    `[assets] ${write ? "write" : "would"} ${rel}: ${fmt(before)} -> ${fmt(after)} (-${pct}%; ${result.notes.join(", ")})`,
  );

  if (write) {
    // Same directory, so the rename is atomic on one filesystem. The leading
    // dot keeps the half-written file out of any public/ glob in the meantime.
    const tmp = join(dirname(file), `.${basename(file)}.${process.pid}.tmp`);
    try {
      await writeFile(tmp, result.data);
      await rename(tmp, file);
    } catch (error) {
      await unlink(tmp).catch(() => undefined);
      throw error;
    }
    // A sanity read back: the file on disk must be the bytes just encoded.
    const { size } = await stat(file);
    if (size !== after) throw new Error(`${rel}: wrote ${after} bytes but found ${size}`);
  }
}

console.log(
  changed === 0
    ? "[assets] nothing to do: every raster is already within its rule"
    : `[assets] ${changed} file(s): ${fmt(totalBefore)} -> ${fmt(totalAfter)}` +
        (write ? "" : " (dry run; pass --write to apply)"),
);
