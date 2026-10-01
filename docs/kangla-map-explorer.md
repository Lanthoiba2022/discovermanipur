# Kangla 3D map

`/explore/kangla` shows Kangla Fort and the streets immediately around it in a tilted 3D
satellite view, using Google's `Map3DElement` (Maps JavaScript API, `maps3d` library). The
fort's eight landmarks are pinned on the map, and three of them have recorded narration in
English, Hindi and Meiteilon.

Code:

- `src/app/explore/kangla/page.tsx`: the route. Reads `GOOGLE_API_KEY` and passes it to the
  client.
- `src/components/explore/kangla-explorer.tsx`: the page UI (landmark panel, list,
  controls, narration).
- `src/components/explore/kangla-google-3d.tsx`: the map itself, loaded only in the
  browser (`ssr: false`).
- `src/lib/google-maps-loader.ts`: loads the Maps JavaScript API once per page.
- `src/lib/immersive/kangla-places.ts`: landmark coordinates (from OpenStreetMap),
  `KANGLA_CENTER` and `KANGLA_MAP_BOUNDS`.
- `src/lib/immersive/narration.ts` and `public/audio/kangla/{en,hi,mni}/`: narration.

## What the visitor sees

Google has no photorealistic 3D building mesh for Imphal yet, so the view is Google's
satellite imagery draped over terrain, not modelled buildings. The page says so; keep UI
wording to "3D satellite view" or "Google 3D imagery" and do not call it photorealistic.

- It opens in `SATELLITE` mode: imagery only, with no road labels, place pins or business
  names. The **Labels** toggle switches to `HYBRID`.
- **2D / 3D** flattens or tilts the camera. On first load the camera makes one slow orbit
  of the fort, which stops on any interaction.
- Gesture handling is `GREEDY`, so scroll and trackpad pinch zoom the map without a
  modifier key. Safari reports pinch as `gesturechange`, which the component handles
  itself.
- Selecting a landmark (pin or list) flies the camera to it and opens its panel.

## Keeping the camera on the fort

This is a map of one place, not a world map that opens over Manipur.

- Google's `bounds` option fences the camera's own position, not the point it looks at. A
  camera tilted 62° at 1.5 km range sits about 1.3 km behind its target, so the fence is
  `KANGLA_MAP_BOUNDS` (about 1.4 x 1.6 km around the moated enclosure) plus a standoff of
  about 1.4 km each way (`CAMERA_STANDOFF`).
- The point the camera looks at is then clamped back inside the site box by
  `clampCenter`, so a visitor can orbit Kangla from outside but cannot pan away from it.
- Camera altitude is capped (about 45 m to 2.1 km above the valley floor), so it cannot
  climb high enough to show the whole city.

## Setup

1. Create a Google Maps Platform key and enable **Maps JavaScript API** and
   **Map Tiles API**.
2. Restrict it by HTTP referrer to every origin you serve from, including
   `http://localhost:3000` for local development.
3. Put it in `.env.local` as `GOOGLE_API_KEY` (see [.env.example](../.env.example)).

Notes:

- The key reaches the browser by design; the protection is the referrer restriction, not
  secrecy. Do not use the same key for Gemini.
- Run the dev server on a port your key allows (3000 by default). On any other origin
  Google refuses the key and the map shows an authorisation message.
- `/explore/kangla` is prerendered, so changing the key needs a rebuild, not just a
  restart.
- The Maps JavaScript API is loaded on the `beta` channel, which is where `maps3d` ships.
  The `alpha` channel puts a "for development purposes only" banner over the map, so it
  is not used.
- Without a key the page still renders the landmark list, descriptions and narration, and
  the map area explains that a key is needed.

## Checks

`scripts/check-kangla.mjs` drives a real browser against a running app and asserts:

- the map loads with the Google 3D provider and no error alert, in `SATELLITE` mode, with
  all eight landmark pins;
- the camera fence matches the bounds above, the camera stays inside it and cannot climb
  too high;
- the 2D/3D and Labels toggles, pinch and wheel zoom (without scrolling the page), and
  landmark selection;
- the landmark panel can be folded and the folded tab names the selected landmark;
- no horizontal overflow at mobile width;
- the Maps JavaScript API is requested, MapTiler is not, and no 3D model assets (`.glb`,
  `.hdr`) are downloaded;
- no page errors, and a working **Retry map** button when the map cannot load.

Run it with the dev server on port 3000 and Playwright available:

```sh
# Terminal 1
npm run dev
# Terminal 2
node scripts/check-kangla.mjs
```

It accepts `PLAYWRIGHT_MODULE` (path to an installed Playwright entry, default
`playwright`), `BROWSER_EXECUTABLE` (a Chromium binary) and `TEST_BASE_URL` (default
`http://localhost:3000`). It needs a working `GOOGLE_API_KEY`, so it does not run in CI.

## History and related code

- The map was first built on MapTiler vector tiles with MapLibre GL and OpenStreetMap
  building extrusions. It moved to Google's 3D view because the vector labels were
  cluttered. `scripts/fetch-kangla-buildings.py`, `scripts/enrich-kangla-osm.py`,
  `public/models/kangla/` and `src/lib/immersive/kangla-buildings.generated.ts` come from
  that version.
- `/immersive/kangla-fort` currently redirects here. The Three.js landmark studies it
  used are still in `src/components/immersive/`; see
  [kangla-immersive.md](kangla-immersive.md).
