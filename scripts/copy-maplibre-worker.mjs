/**
 * Publish MapLibre's worker chunk to `public/maplibre/`.
 *
 * MapLibre GL v6 ships its worker as a separate ESM chunk and resolves it at
 * runtime from `import.meta.url` + "maplibre-gl-worker.mjs". Once the library
 * is bundled, that URL points at the emitted chunk directory, where the worker
 * file does not exist — so `new Worker(...)` fails, the worker dies, and the
 * map still renders raster tiles (decoded on the main thread) while every
 * GeoJSON source silently stays empty, with no error raised.
 *
 * Copying the worker and its shared chunk into `public/` and pointing
 * `setWorkerUrl` at them fixes it without patching the bundler. Run from
 * `predev` and `prebuild` so the copies track the installed version.
 */
import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "node_modules", "maplibre-gl", "dist");
const to = join(root, "public", "maplibre");

// The worker imports the shared chunk by relative path, so both must sit
// together in the published directory.
const FILES = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

await mkdir(to, { recursive: true });

for (const file of FILES) {
  const src = join(from, file);
  try {
    await stat(src);
  } catch {
    console.error(
      `[maplibre] ${file} not found in maplibre-gl/dist — the dist layout has changed.\n` +
        `           Check whether setWorkerUrl is still needed before shipping.`,
    );
    process.exit(1);
  }
  await copyFile(src, join(to, file));
}

console.log(`[maplibre] published ${FILES.length} worker files to public/maplibre/`);
