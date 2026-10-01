/**
 * How long does a resolved Google Places photo URL stay usable?
 *
 * `/api/place-photo` caches the signed `photoUri` Google hands back, and that
 * cache must never outlive the URL. Google does not document the lifetime, so
 * this measures it:
 *
 *   node --env-file=.env.local scripts/probe-place-photo-ttl.mjs [ref]
 *     Resolves one ref (one billed Places call), fetches the image, prints the
 *     image's own cache headers and records the URL with a timestamp.
 *
 *   node scripts/probe-place-photo-ttl.mjs --check
 *     Re-fetches every recorded URL (no Places call, no key needed) and prints
 *     how old each one is and whether it still loads. Run it every few hours;
 *     the first failure bounds the lifetime.
 *
 * The log lives in .next/cache, outside the fetch cache the prebuild clears.
 * It holds URLs and timestamps only — never image bytes, which Google's terms
 * do not let us store.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const LOG = join(process.cwd(), ".next", "cache", "place-photo-ttl.json");
// A ref already in the catalogue (Kangla Fort), used when none is passed.
const DEFAULT_REF =
  "places/ChIJpx0dXUYiSTcR6VC4QGwo6Qw/photos/Aa-ngMbmfwXa317tTLB_fXHkkpUWZSerw1qoXYrIPI7a42EPBQvDu-Ikfv3UCEZTGAo0MFFPLarxPOwwMRuNRBJuOAc2lBhs1-SLRfrxtdrkSXv1h69w4BUDufByPmUazkO_QRbgacnyVrH3-H4xqANovDjMk67xmCHPB83tSet5nUzgHgucNgdTsSy3RVepas-GoAKSfjYREkKCcPGY7-H60hyukww80ns-2J-X8FJ_NCz7QZRdvBHdJ6qFFfQip7Ki-pfxtLHN2xdSw4VxaVndXwJZtr54VD6Uequ-PpkQHERgODmDOru2bN51Sx8j4Ef7ynlckWoxd-w5D2Q53HXxzFpGs2DelqNsY6wMYtH6IzNE0ijOORUqfp1jW90qjtrqIlJaZsZrPq_G3EhzL8bKJU0sYHETG9wHlBqdyDXxF3NXjH4";

const readLog = async () => {
  try {
    return JSON.parse(await readFile(LOG, "utf8"));
  } catch {
    return [];
  }
};

const hours = (ms) => `${(ms / 3_600_000).toFixed(1)}h`;

/** Status plus the headers that say how long Google lets a browser keep it. */
async function probeImage(uri) {
  const res = await fetch(uri, { method: "GET" });
  await res.arrayBuffer(); // drain; nothing is kept
  return {
    status: res.status,
    cacheControl: res.headers.get("cache-control"),
    expires: res.headers.get("expires"),
  };
}

if (process.argv.includes("--check")) {
  const log = await readLog();
  if (!log.length) {
    console.log("Nothing recorded yet. Run without --check first.");
    process.exit(0);
  }
  for (const entry of log) {
    const age = Date.now() - Date.parse(entry.resolvedAt);
    const { status } = await probeImage(entry.photoUri);
    console.log(`${status === 200 ? "ok  " : "DEAD"} age ${hours(age)}  status ${status}  ${entry.resolvedAt}`);
  }
} else {
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) {
    console.error("GOOGLE_PLACES_API_KEY (or GOOGLE_API_KEY) is not set. Run with --env-file=.env.local.");
    process.exit(1);
  }
  const ref = process.argv[2] || DEFAULT_REF;
  const res = await fetch(
    `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=1200&skipHttpRedirect=true&key=${key}`,
  );
  if (!res.ok) {
    console.error(`Places answered ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const { photoUri } = await res.json();
  const image = await probeImage(photoUri);
  console.log("photoUri host:", new URL(photoUri).host);
  console.log("image status: ", image.status);
  console.log("cache-control:", image.cacheControl);
  console.log("expires:      ", image.expires);

  const log = await readLog();
  log.push({ ref, photoUri, resolvedAt: new Date().toISOString() });
  await mkdir(dirname(LOG), { recursive: true });
  await writeFile(LOG, JSON.stringify(log, null, 2));
  console.log(`Recorded. Re-run with --check later to see when it stops loading.`);
}
