/**
 * Browser regression checks for the Kangla 3D map (Google Map3DElement).
 *
 * Start Next on port 3000 first. The port matters: the Google key is
 * referrer-restricted, so the map only authorises on the origins the key lists.
 * An auth alert here usually means the dev server is on a different port, not
 * that the map is broken.
 *
 * Env: PLAYWRIGHT_MODULE, BROWSER_EXECUTABLE, TEST_BASE_URL.
 */
import assert from "node:assert/strict";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({
  ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
  args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
// KANGLA_MAP_BOUNDS plus the camera standoff in kangla-google-3d.tsx: Google
// fences the camera itself, so the fence is the site box plus room to look at it.
const SITE = { west: 93.9355, south: 24.8008, east: 93.9492, north: 24.8148 };
const STANDOFF = { lat: 0.0125, lng: 0.0135 };
const BOUNDS = { west: SITE.west - STANDOFF.lng, south: SITE.south - STANDOFF.lat, east: SITE.east + STANDOFF.lng, north: SITE.north + STANDOFF.lat };
const near = (a, b) => Math.abs(a - b) < 1e-6;

const settle = (page, ms = 3500) => page.waitForTimeout(ms);
/** The map hands its element to `window.kanglaMap` for exactly this. */
const onMap = (page, fn, arg) => page.evaluate(fn, arg);
const SECTION = '[role="region"][aria-label="Interactive Kangla 3D map"]';
const pins = page => page.locator("gmp-marker-3d-interactive").count();

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(45000);
  const errors = [];
  const requests = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => requests.push(request.url()));

  await page.goto(`${base}/explore/kangla`);
  const map = page.getByTestId("kangla-map");
  const mapAlert = page.locator(`${SECTION} [role="alert"]`);
  await map.locator("gmp-map-3d").waitFor();
  await page.waitForFunction(() => window.kanglaMap && document.querySelector('[data-testid="kangla-map"]').dataset.ready === "true");
  await settle(page);

  assert.equal(await map.getAttribute("data-provider"), "google-3d");
  assert.equal(await mapAlert.count(), 0, `the map reported an error: ${await mapAlert.first().innerText().catch(() => "")}`);

  // Opens clean: imagery only, no Google labels; the fort's own landmarks pinned.
  assert.equal(await map.getAttribute("data-labels"), "false");
  assert.equal(await onMap(page, () => window.kanglaMap.mode), "SATELLITE");
  assert.equal(await pins(page), 8, "landmark pins missing");

  // A map of one place: Google's fence is declared for the camera, and the
  // look-at point is clamped to the site box so panning cannot leave Kangla.
  const fence = await onMap(page, bounds => {
    const m = window.kanglaMap;
    const declared = m.bounds.toJSON();
    m.center = { lat: 24.7, lng: 93.8, altitude: 785 };
    return new Promise(resolve =>
      setTimeout(() => {
        const c = m.center;
        resolve({
          declared,
          inside: c.lng >= bounds.site.west - 1e-6 && c.lng <= bounds.site.east + 1e-6 && c.lat >= bounds.site.south - 1e-6 && c.lat <= bounds.site.north + 1e-6,
          maxAltitude: m.maxAltitude,
        });
      }, 800),
    );
  }, { site: SITE });
  for (const side of ["west", "south", "east", "north"]) assert(near(fence.declared[side], BOUNDS[side]), `fence ${side} drifted: ${fence.declared[side]} vs ${BOUNDS[side]}`);
  assert(fence.inside, "the camera escaped the Kangla bounds");
  assert(fence.maxAltitude < 3000, "the camera can climb high enough to see the whole city");

  await page.getByRole("button", { name: "Recenter on the fort" }).click();
  await settle(page, 2000);

  await page.getByRole("button", { name: "2D", exact: true }).click();
  await settle(page, 1500);
  assert.equal(await map.getAttribute("data-view"), "2d");
  assert(await onMap(page, () => window.kanglaMap.tilt < 3), "2D did not flatten the camera");

  await page.getByRole("button", { name: "3D", exact: true }).click();
  await settle(page, 1500);
  assert.equal(await map.getAttribute("data-view"), "3d");
  assert(await onMap(page, () => window.kanglaMap.tilt > 40), "3D did not tilt the camera");

  await page.getByRole("button", { name: "Toggle Google labels" }).click();
  await settle(page, 800);
  assert.equal(await onMap(page, () => window.kanglaMap.mode), "HYBRID", "label overlay did not switch on");
  await page.getByRole("button", { name: "Toggle Google labels" }).click();
  await settle(page, 800);
  assert.equal(await onMap(page, () => window.kanglaMap.mode), "SATELLITE");

  // Trackpad pinch arrives as ctrl+wheel; plain wheel must zoom too (GREEDY),
  // and neither may scroll the page out from under the map.
  const before = await onMap(page, () => window.kanglaMap.range);
  const box = await map.boundingBox();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5);
  await page.keyboard.down("Control");
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -120);
  await page.keyboard.up("Control");
  await settle(page, 1500);
  const pinched = await onMap(page, () => window.kanglaMap.range);
  assert(pinched < before * 0.9, `pinch did not zoom in: ${before} -> ${pinched}`);
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 240);
  await settle(page, 1500);
  assert(await onMap(page, () => window.kanglaMap.range) > pinched * 1.1, "wheel did not zoom out");
  assert.equal(await page.evaluate(() => scrollY), 0, "wheel over the map scrolled the page");

  // Tapping a pin flies in and the panel tells the story with its photo.
  await onMap(page, () => document.querySelector('gmp-marker-3d-interactive[data-place-id="kangla-sha"]').dispatchEvent(new Event("gmp-click")));
  const panel = page.getByRole("complementary", { name: "Kangla landmarks" });
  await panel.getByRole("heading", { name: /Kangla Sha/ }).waitFor();
  await panel.locator("img").waitFor();
  await settle(page, 2500);
  assert(await onMap(page, () => window.kanglaMap.range < 600), "selecting a landmark did not fly the camera in");
  await panel.getByRole("button", { name: "Next", exact: true }).click();
  await panel.getByRole("heading", { name: /Uttra Shanglen/ }).waitFor();
  await panel.getByRole("button", { name: "Back to all landmarks" }).click();
  await panel.getByRole("button", { name: /Kangla Museum/ }).click();
  await panel.getByRole("heading", { name: /Kangla Museum/ }).waitFor();
  await panel.getByRole("button", { name: "Back to all landmarks" }).click();

  // The panel folds to a tab, and choosing a landmark from the map unfolds it again.
  await page.getByRole("button", { name: "Hide the landmark panel" }).click();
  const tab = page.getByRole("button", { name: "Show the landmark panel" });
  await tab.waitFor();
  assert.equal(await panel.count(), 0, "panel stayed open after hiding");
  await onMap(page, () => document.querySelector('gmp-marker-3d-interactive[data-place-id="western-gate"]').dispatchEvent(new Event("gmp-click")));
  await panel.getByRole("heading", { name: /western gateway/ }).waitFor();
  await page.getByRole("button", { name: "Hide the landmark panel" }).click();
  await tab.waitFor();
  assert.match(await tab.innerText(), /western gateway/i, "folded tab does not name the selected landmark");
  await tab.click();
  await panel.getByRole("heading", { name: /western gateway/ }).waitFor();
  await panel.getByRole("button", { name: "Back to all landmarks" }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await settle(page, 1000);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "mobile overflows");

  // Google owns the whole 3D path now; none of the studio's heavy assets and no MapTiler.
  assert(requests.some(url => /maps\.googleapis\.com\/maps\/api\/js/.test(url)), "the Maps JavaScript API was not loaded");
  assert(!requests.some(url => url.includes("api.maptiler.com")), "the map still calls MapTiler");
  assert(!requests.some(url => /\.glb|\.hdr/.test(url)), "the map pulled 3D model assets");
  assert.deepEqual(errors, []);

  // A script that will not load must say so and offer a way back, not hang.
  const offline = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  offline.setDefaultTimeout(45000);
  await offline.route("**/maps.googleapis.com/**", route => route.abort());
  await offline.goto(`${base}/explore/kangla`);
  await offline.locator(`${SECTION} [role="alert"]`).waitFor();
  assert(await offline.getByRole("button", { name: "Retry map" }).isVisible());

  console.log(
    "PASS: Google 3D — satellite-only opening view, 8 landmark pins, camera fenced to Kangla, 2D/3D and label toggles, " +
      "recenter, pinch and wheel zoom without page scroll, pin and panel selection with photo, collapsible panel, mobile sizing, no MapTiler, script-failure alert.",
  );
} finally {
  await browser.close();
}
