/**
 * Asset budget for `public/`: fail when a file is heavier than the site needs.
 *
 *   node scripts/check-assets.mjs        exits 1 on any unlisted file over budget
 *
 * Everything under `public/` is uploaded with every deployment (Vercel Hobby
 * caps deployment storage) and any raw fetch of it (a crawler, a direct link,
 * the hero film, a narration track) is paid for in Fast Data Transfer. The
 * library once held a 15120 px, 14 MB PNG strip that nobody had looked at;
 * this check is what stops the next one at review time instead of at the
 * storage cap.
 *
 * Budgets, by kind of file:
 *
 * | kind                                | limit                                |
 * | ----------------------------------- | ------------------------------------ |
 * | raster (png, jpg, webp, avif, gif)  | 1 MB, and 3840 px on the long edge   |
 * | 3D model or HDR (glb, gltf, hdr, exr) | 6 MB                               |
 * | video (mp4, webm, mov)              | 3 MB                                 |
 * | audio (mp3, ogg, m4a, wav, opus)    | 400 KB                               |
 *
 * (MB here is 1024 x 1024 bytes and KB is 1024 bytes.) Rasters are measured
 * with sharp's header read, which decodes no pixels, so the whole scan takes
 * well under a second. Other files are not budgeted.
 *
 * **Exceptions** live in `scripts/asset-budget-allowlist.json`, keyed by the
 * path relative to the repo root. Every entry needs a `reason` a reviewer can
 * check, and may set `maxBytes`: a listed file that grows past it fails again,
 * so an exception covers the file as reviewed, not anything later saved under
 * that name. Entries for files that are gone or back within budget are
 * reported so the list can be pruned, without failing the run.
 *
 * Fixing a failure: `node scripts/optimize-assets.mjs --write` re-encodes
 * oversized PNGs and JPEGs in place under the same name (the paths are in the
 * live database, so names never change). Anything else is resized or
 * re-encoded by hand, or allowlisted with a reason.
 *
 * No network, no database, no environment variables: safe in CI as is.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const allowlistPath = join(root, "scripts", "asset-budget-allowlist.json");

const KB = 1024;
const MB = 1024 * 1024;

/** Every budgeted kind: which extensions it covers and what it may weigh. */
const BUDGETS = [
  { kind: "raster", exts: [".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif"], maxBytes: 1 * MB, maxEdge: 3840 },
  { kind: "model", exts: [".glb", ".gltf", ".hdr", ".exr"], maxBytes: 6 * MB },
  { kind: "video", exts: [".mp4", ".webm", ".mov"], maxBytes: 3 * MB },
  { kind: "audio", exts: [".mp3", ".ogg", ".m4a", ".wav", ".opus"], maxBytes: 400 * KB },
];

/**
 * Directories never scanned: `maplibre/` is a git-ignored copy of a library
 * chunk written by `predev`/`prebuild`, not a committed asset.
 */
const SKIP_DIRS = new Set(["maplibre"]);

/** Repo-relative path with forward slashes, the allowlist's key format. */
const toKey = (file) => relative(root, file).split(sep).join("/");

function fmt(bytes) {
  return bytes >= MB ? `${(bytes / MB).toFixed(2)} MB` : `${Math.round(bytes / KB)} KB`;
}

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

/** @returns {Promise<Record<string, { reason: string; maxBytes?: number }>>} */
async function loadAllowlist() {
  let parsed;
  try {
    parsed = JSON.parse(await readFile(allowlistPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw new Error(`${toKey(allowlistPath)} is not valid JSON: ${error.message}`);
  }
  const files = parsed?.files ?? {};
  for (const [key, entry] of Object.entries(files)) {
    if (typeof entry?.reason !== "string" || entry.reason.trim().length < 10) {
      throw new Error(`${toKey(allowlistPath)}: "${key}" needs a reason a reviewer can check`);
    }
    if (entry.maxBytes !== undefined && !Number.isInteger(entry.maxBytes)) {
      throw new Error(`${toKey(allowlistPath)}: "${key}" maxBytes must be an integer`);
    }
  }
  return files;
}

const allowlist = await loadAllowlist();
const seen = new Set();
const failures = [];
const allowed = [];

for (const file of await walk(publicDir)) {
  const ext = extname(file).toLowerCase();
  const budget = BUDGETS.find((b) => b.exts.includes(ext));
  if (!budget) continue;

  const key = toKey(file);
  const { size } = await stat(file);
  const problems = [];

  if (size > budget.maxBytes) problems.push(`${fmt(size)} > ${fmt(budget.maxBytes)}`);
  if (budget.maxEdge) {
    try {
      const { width = 0, height = 0 } = await sharp(file).metadata();
      const edge = Math.max(width, height);
      if (edge > budget.maxEdge) problems.push(`${width}x${height} > ${budget.maxEdge} px long edge`);
    } catch (error) {
      problems.push(`unreadable ${budget.kind} (${error.message})`);
    }
  }
  if (problems.length === 0) continue;

  const entry = allowlist[key];
  if (entry) {
    seen.add(key);
    if (entry.maxBytes !== undefined && size > entry.maxBytes) {
      failures.push(`${key}: ${fmt(size)} exceeds its allowlisted ceiling of ${fmt(entry.maxBytes)}`);
    } else {
      allowed.push(`${key}: ${problems.join(", ")} (allowlisted)`);
    }
    continue;
  }
  failures.push(`${key}: ${budget.kind} ${problems.join(", ")}`);
}

for (const line of allowed) console.log(`[assets:check] ok   ${line}`);

for (const key of Object.keys(allowlist)) {
  if (!seen.has(key)) {
    console.warn(`[assets:check] note ${key} is allowlisted but missing or within budget; prune the entry`);
  }
}

if (failures.length > 0) {
  for (const line of failures) console.error(`[assets:check] FAIL ${line}`);
  console.error(
    `[assets:check] ${failures.length} file(s) over budget. Run \`node scripts/optimize-assets.mjs --write\` ` +
      "for PNG/JPEG, re-encode the rest, or add a reasoned entry to scripts/asset-budget-allowlist.json.",
  );
  process.exit(1);
}

console.log(`[assets:check] public/ is within budget (${allowed.length} allowlisted exception(s))`);
