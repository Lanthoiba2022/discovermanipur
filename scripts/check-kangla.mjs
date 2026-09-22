/**
 * Browser regression checks for the Kangla 3D map.
 *
 * Start Next on port 3000 first. The port matters: the MapTiler key is
 * origin-restricted, so the map only authorises on the origin the key lists.
 * A 403 here usually means the dev server is on a different port, not that the
 * map is broken.
 *
 * Env: PLAYWRIGHT_MODULE, BROWSER_EXECUTABLE, TEST_BASE_URL.
 */
import assert from "node:assert/strict";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({
  ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
  args: ["--enable-unsafe-swiftshader"],
});
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const BOUNDS = [
  [93.9355, 24.8008],
  [93.9492, 24.8148],
];

const settle = (page, ms = 3500) => page.waitForTimeout(ms);
/** The map hands its instance to `window.kanglaMap` for exactly this. */
const onMap = (page, fn, arg) => page.evaluate(fn, arg);

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(30000);
  const errors = [];
  const requests = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => requests.push(request.url()));

  await page.goto(`${base}/explore/kangla`);
  const map = page.getByTestId("kangla-map");
  // Scoped to the map: the site's global toast region also carries an alert role.
  const mapAlert = page.locator('section[aria-label="Interactive Kangla 3D map"] [role="alert"]');
  await map.locator("canvas").waitFor();
  await page.waitForFunction(() => window.kanglaMap && document.querySelector('[data-testid="kangla-map"]').dataset.ready === "true");
  await settle(page);

  assert.equal(await map.getAttribute("data-provider"), "maptiler");
  assert.equal(await mapAlert.count(), 0, `the map reported an error: ${await mapAlert.first().innerText().catch(() => "")}`);

  // The whole point of the page: real extrusions, from our own OSM dataset,
  // with MapTiler's sparse duplicate layer switched off.
  const layers = await onMap(page, () =>
    window.kanglaMap
      .getStyle()
      .layers.filter(layer => layer.type === "fill-extrusion")
      .map(layer => [layer.id, layer.layout?.visibility ?? "visible"]),
  );
  assert.deepEqual(
    Object.fromEntries(layers),
    { "Building 3D": "none", "kangla-buildings-3d": "visible" },
    "extrusion layers are not as expected",
  );
  const drawn = Number(await map.getAttribute("data-building-count"));
  assert(drawn > 10, `only ${drawn} buildings drawn`);
  assert.equal(await map.getAttribute("data-terrain"), "true", "terrain did not attach");

  // Site geometry from the repo's own GeoJSON, which needs the MapLibre worker
  // to have loaded — a silent worker failure leaves these empty.
  const site = await onMap(page, () => ({
    moat: window.kanglaMap.queryRenderedFeatures({ layers: ["kangla-moat"] }).length,
    boundary: window.kanglaMap.queryRenderedFeatures({ layers: ["kangla-boundary"] }).length,
  }));
  assert(site.moat > 0 && site.boundary > 0, `site layers empty: ${JSON.stringify(site)}`);

  // This is a map of one place: the camera must not be able to leave Kangla.
  const clamped = await onMap(page, bounds => {
    const m = window.kanglaMap;
    m.jumpTo({ center: [93.8, 24.7] });
    const c = m.getCenter();
    return {
      inside: c.lng >= bounds[0][0] && c.lng <= bounds[1][0] && c.lat >= bounds[0][1] && c.lat <= bounds[1][1],
      declared: m.getMaxBounds().toArray(),
    };
  }, BOUNDS);
  assert(clamped.inside, "the camera escaped the Kangla bounds");
  assert.deepEqual(clamped.declared, BOUNDS, "map bounds drifted from KANGLA_MAP_BOUNDS");

  await page.getByRole("button", { name: "Recenter" }).click();
  await settle(page, 1500);

  await page.getByRole("button", { name: "2D", exact: true }).click();
  await settle(page, 1200);
  assert.equal(await map.getAttribute("data-view"), "2d");
  assert.equal(await onMap(page, () => Math.round(window.kanglaMap.getPitch())), 0);

  await page.getByRole("button", { name: "3D", exact: true }).click();
  await settle(page, 1200);
  assert.equal(await map.getAttribute("data-view"), "3d");
  assert(await onMap(page, () => window.kanglaMap.getPitch() > 40), "3D did not tilt the camera");

  await page.getByRole("button", { name: "Labels" }).click();
  await settle(page, 800);
  assert.equal(await map.getAttribute("data-labels"), "false");
  assert.equal(
    await onMap(page, () =>
      window.kanglaMap.getStyle().layers.filter(l => l.type === "symbol" && (l.layout?.visibility ?? "visible") === "visible").length,
    ),
    0,
    "labels stayed visible",
  );
  await page.getByRole("button", { name: "Labels" }).click();
  await settle(page, 800);
  assert.equal(await map.getAttribute("data-labels"), "true");

  // Licence terms: MapTiler and OpenStreetMap have to stay readable, and the
  // page's floating concierge button owns the opposite corner.
  const attribution = page.locator(".maplibregl-ctrl-attrib");
  assert(await attribution.isVisible());
  assert.match(await attribution.innerText(), /MapTiler[\s\S]*OpenStreetMap/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="kangla-map"]');
    return Math.abs(el.clientWidth - el.querySelector("canvas").clientWidth) < 2;
  });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "mobile overflows");

  // No Google anywhere in the 3D path, and none of the studio's heavy assets.
  assert(!requests.some(url => /maps\.googleapis\.com|google\.com\/maps\/api/.test(url)), "the map called Google Maps");
  assert(!requests.some(url => /\.glb|\.hdr/.test(url)), "the map pulled 3D model assets");
  assert(requests.some(url => url.includes("api.maptiler.com")), "no MapTiler requests were made");
  assert.deepEqual(errors, []);

  // A style that will not load must say so and offer a way back, not hang on
  // the loading message.
  const offline = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  offline.setDefaultTimeout(30000);
  await offline.route("**/api.maptiler.com/maps/**", route => route.abort());
  await offline.goto(`${base}/explore/kangla`);
  await offline.locator('section[aria-label="Interactive Kangla 3D map"] [role="alert"]').waitFor();
  assert(await offline.getByRole("button", { name: "Retry map" }).isVisible());

  console.log(
    `PASS: MapTiler 3D map — ${drawn} extruded buildings, terrain, site layers, camera clamped to Kangla, ` +
      "2D/3D and label toggles, recenter, attribution, mobile sizing, no Google requests, style-failure alert.",
  );
} finally {
  await browser.close();
}
