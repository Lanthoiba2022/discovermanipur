# Kangla immersive experience

> **Status:** `/immersive/kangla-fort` currently redirects to the [Kangla 3D map](./kangla-map-explorer.md). The Three.js landmark studies described here are still in the tree (`src/components/immersive/`, `public/models/kangla/`) but no route renders them. Bringing them back as an optional landmark studio, opened from a landmark on the map, is listed in [GOOD_FIRST_ISSUES.md](./GOOD_FIRST_ISSUES.md). The accuracy notes below apply whenever they are shown.

Route: `/immersive/kangla-fort` (redirected for now). Main component: `src/components/immersive/kangla-experience.tsx`.

Three separately explorable exterior studies: Kangla Sha / Uttra pavilion, western gateway, and Pakhangba Laishang. The viewer loads Three.js only after **Enter 3D experience**. Photographs and stories work without WebGL or XR.

## Reference and accuracy

The existing archive photographs were visually inspected:

- `public/file-uploads/11.jpg`: Kangla Sha pair and the Uttra pavilion.
- `public/file-uploads/112.jpg`: western gateway (the existing general catalogue caption is inaccurate).
- `public/file-uploads/113.jpg`: Pakhangba temple (the existing general catalogue caption is nonspecific).

Google Maps was opened in a browser and inspected for site context, including the inner moat, Imphal River and Pakhangba location: https://www.google.com/maps/search/?api=1&query=Kangla+Fort+Imphal

Online visual research also used the conservation-plan collection and site drawing:

- https://architexturez.net/doc/az-cf-21173
- https://architexturez.net/file/kfap-cdp-vol-i-charter-dwg-04-png

The 2003 conservation plan predates subsequent reconstructions. It is not a current survey. Google Maps remains an external reference link. The satellite map and Three.js site overview stream Esri World Imagery with attribution. Landmark scenes use Blender exports, scanned CC0 materials and a separately repaired photo-derived Kangla Sha asset.

**This is an approximate, photo-referenced architectural reconstruction, not a scanned digital twin.** Visible colours, general silhouettes and landmark compositions follow the photographs. Scale, depth, ornament, rear elevations and trees are interpreted. Three separate scenes deliberately avoid inventing a geographically accurate route between the landmarks. The reference photographs are ordinary photos, not spherical panoramas. Public UI discloses these limitations and exposes the references.

Higher accuracy requires a licensed photogrammetry / LiDAR model, measured drawings, or an authorised capture campaign with sufficient overlapping images of all sides. The viewer loads compressed Blender GLBs; future measured or scanned assets can replace them without changing the viewer UI or XR lifecycle.

## Desktop and mobile

- Drag to orbit, wheel/pinch or labelled buttons to zoom; reset restores the landmark viewpoint.
- Auto orbit is opt-in, including for reduced-motion users.
- Daylight/golden lighting, fullscreen, photo comparison, text descriptions and optional browser speech narration.
- Three.js resources, generated textures, observers and event listeners are disposed on unmount / scene replacement.
- Canvas rendering pauses for reference photos and background tabs. Pixel ratio is capped.
- Graphics creation failure, context loss, scene-load failure, unsupported XR and denied permissions have usable fallbacks.
- The Three.js bundle is not imported by the homepage teaser.

## XR

Requires HTTPS or localhost and a WebXR-capable browser/device. Capability detection gates both buttons. The renderer and session are only created from explicit user actions.

- **VR:** `immersive-vr`, `local-floor`. Exterior is placed ahead of the viewer at illustrative life scale. Seated / standing look-around; no teleportation or controller locomotion. Exit using the headset system menu or the DOM-overlay exit button where supported.
- **AR:** `immersive-ar`, `local` and `hit-test`; optional `dom-overlay`. Slowly scan a flat surface until the gold ring appears, then tap to place a miniature. Surface hit testing supplies position; the model stays upright. Restart AR to reposition. No camera image is uploaded by this feature.
- End, denial, unsupported surface detection, navigation and unmount clean up the session and restore desktop state.

## Verification

From the project root:

```sh
npm run lint
npx next typegen && npm run typecheck
npm run build
```

`scripts/check-kangla.mjs` now tests the Google 3D map, not these scenes (see [kangla-map-explorer.md](./kangla-map-explorer.md#checks)). When the studies are wired back to a route, they need their own browser checks covering lazy loading, landmark switching, controls, reference photos, 375px overflow, the no-WebGL fallback and AR/VR permission denial. **Physical headset rendering and phone surface placement require on-device testing; browser tests do not establish hardware compatibility.**

## September 22 site viewer update

Whole site is a fourth Three.js scene, sharing native WebXR AR hit-testing and VR session lifecycle. It uses local metre coordinates, mapped building footprints and moats, and 63 additional OSM path/river ways from the September 22 API snapshot. Satellite tiles load on demand with an eight-second timeout; vector geometry survives imagery failures. Source and ODbL attribution are included in the GeoJSON.

Overview heights (6 m), path widths (2/5 m) and river centreline width (24 m) are illustrative. This is geographic context, not detailed architecture or a surveyed terrain model. Detailed landmark scenes remain independent Blender studies. In VR the site is a miniature; AR places a smaller version on a detected surface. Desktop zoom/reset interpolate over 650 ms and honor reduced motion. Native headset/phone testing is still required.
