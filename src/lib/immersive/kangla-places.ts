import type { LandmarkId } from "./kangla";

/**
 * The places inside Kangla, with real coordinates.
 *
 * Every coordinate here comes from OpenStreetMap, checked against Esri World
 * Imagery at zoom 17–19 — not estimated from a photograph. `source` records
 * which OSM feature each one came from so a wrong pin can be traced and fixed.
 *
 * A place with `model` set has a detailed reconstruction behind it and opens
 * the 3D / VR view. The rest are map stops: real, located, described, but not
 * modelled. That distinction is shown in the UI rather than blurred.
 */
export interface KanglaPlace {
  id: string;
  name: string;
  meiteiName?: string;
  /** Drives the pin colour and the grouping label. */
  kind: "guardian" | "temple" | "gate" | "hall" | "museum" | "water";
  /** [longitude, latitude] — GeoJSON order, as MapLibre expects. */
  coord: [number, number];
  summary: string;
  /** Set when a photo-referenced 3D model exists for this place. */
  model?: LandmarkId;
  image?: string;
  /** Which OpenStreetMap feature the coordinate is taken from. */
  source: string;
  /** Map camera when this place is selected. */
  view: { zoom: number; pitch: number; bearing: number };
}

export const KANGLA_CENTER: [number, number] = [93.94202, 24.80894];

/**
 * The only ground the 3D map lets a visitor reach: roughly 1.4 x 1.6 km, the
 * moated enclosure plus the city edge that frames it. The camera is clamped to
 * this box, and `scripts/fetch-kangla-buildings.py` pulls its OpenStreetMap
 * footprints from exactly these numbers — change one and re-run the other.
 */
export const KANGLA_MAP_BOUNDS: [[number, number], [number, number]] = [
  [93.9355, 24.8008],
  [93.9492, 24.8148],
];

/** OSM building footprints inside those bounds, with per-building height provenance. */
export const KANGLA_BUILDINGS_GEOJSON = "/models/kangla/kangla-buildings.geojson";

/** The whole enclosure, for the opening shot and the "show everything" reset. */
export const KANGLA_OVERVIEW = { center: KANGLA_CENTER, zoom: 15.1, pitch: 55, bearing: -22 };

export const kanglaPlaces: KanglaPlace[] = [
  {
    id: "kangla-sha",
    name: "The Kangla Sha",
    meiteiName: "ꯀꯪꯂꯥ ꯁꯥ",
    kind: "guardian",
    coord: [93.94265, 24.80751],
    summary:
      "The paired white guardians — a dragon-lion with a single swept-back horn, a beaded collar and an open jaw — standing before the coronation hall. They are the most recognised image of Manipur.",
    model: "guardians",
    image: "/file-uploads/11.jpg",
    source: "OSM node, tourism=artwork “Kangla Dragon” (the northern of the pair)",
    view: { zoom: 18.4, pitch: 62, bearing: -100 },
  },
  {
    id: "uttra-shanglen",
    name: "Uttra Shanglen",
    meiteiName: "ꯎꯠꯔꯥ ꯁꯪꯂꯦꯟ",
    kind: "hall",
    coord: [93.94287, 24.80747],
    summary:
      "The coronation hall the guardians face, twenty-two metres behind them. Manipur's kings were crowned on this ground; the present blue-grey pavilion is a later rebuilding on the historic site.",
    image: "/file-uploads/11.jpg",
    source: "OSM building footprint 22 m east of the Kangla Sha pair (232 m²); unnamed in OSM",
    view: { zoom: 18.2, pitch: 60, bearing: -80 },
  },
  {
    id: "pakhangba-laishang",
    name: "Ibudhou Pakhangba Laishang",
    meiteiName: "ꯏꯕꯨꯙꯧ ꯄꯥꯈꯪꯕꯥ",
    kind: "temple",
    coord: [93.94195, 24.80815],
    summary:
      "A living Sanamahi shrine to Pakhangba, the dragon deity of the Meitei. White walls, a tiered spire and golden finials above an open approach. Worship continues here.",
    model: "pakhangba",
    image: "/file-uploads/113.jpg",
    source: "OSM node, amenity=place_of_worship religion=sanamahi; building footprint tagged historic=monument",
    view: { zoom: 18.2, pitch: 58, bearing: -30 },
  },
  {
    id: "western-gate",
    name: "The western gateway",
    kind: "gate",
    coord: [93.939, 24.80749],
    summary:
      "The public entrance from Imphal, on the western moat. A tall central arch between blue timber facades, balconies either side and crossed finials on the roof.",
    model: "western-gate",
    image: "/file-uploads/112.jpg",
    source: "OSM building, historic=city_gate — the westernmost gate structure",
    view: { zoom: 18.3, pitch: 62, bearing: 75 },
  },
  {
    id: "kangla-museum",
    name: "Kangla Museum",
    kind: "museum",
    coord: [93.94152, 24.80346],
    summary:
      "Near the southern end of the enclosure. A replica Kangla Sha stands outside it — the sculpture most visitors photograph up close, since the colossal pair sit behind a rail.",
    source: "OSM node, tourism=museum",
    view: { zoom: 18, pitch: 55, bearing: -10 },
  },
  {
    id: "archaeological-museum",
    name: "Archaeological Museum",
    kind: "museum",
    coord: [93.94231, 24.81157],
    summary:
      "In the northern half of the fort, holding material excavated from the Kangla grounds themselves.",
    source: "OSM node, tourism=museum",
    view: { zoom: 18, pitch: 55, bearing: -10 },
  },
  {
    id: "bir-tikendrajit-temple",
    name: "Bir Tikendrajit Temple",
    kind: "temple",
    coord: [93.94237, 24.81201],
    summary:
      "At the northern end, named for the prince who led Manipuri forces in the Anglo-Manipur War of 1891.",
    source: "OSM node, amenity=place_of_worship",
    view: { zoom: 18, pitch: 55, bearing: -10 },
  },
  {
    id: "the-moats",
    name: "The moats",
    kind: "water",
    coord: [93.9397, 24.80554],
    summary:
      "Kangla is a moated island. The outer moat runs the western and southern edges, the Imphal river curls around the east, and a rectangular inner moat encloses the citadel — all visible from the air.",
    source: "OSM water polygons inside the fort boundary (7 features)",
    view: { zoom: 16.2, pitch: 58, bearing: -22 },
  },
];

export const kanglaPlaceById = (id: string) => kanglaPlaces.find((p) => p.id === id);

/** Places that open the detailed 3D / VR viewer. */
export const modelledPlaces = kanglaPlaces.filter((p) => p.model);

export const KANGLA_SITE_GEOJSON = "/models/kangla/kangla-site.geojson";

export const kanglaMapAttribution =
  'Site features &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors · Imagery &copy; <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a>, Maxar, Earthstar Geographics';
