import { kanglaNarration } from "./narration";

export type LandmarkId = "guardians" | "western-gate" | "pakhangba";

const stops = [
  {
    id: "guardians" as const,
    name: "The Kangla Sha",
    shortName: "Kangla Sha",
    subtitle: "Guardians of the royal seat",
    image: "/file-uploads/11.jpg",
    alt: "Two white Kangla Sha sculptures flank brick steps leading to a blue-grey arched pavilion at Kangla.",
    description: "The paired white guardians stand before the Uttra at Kangla. Their upright bodies, open jaws and long tails make them one of Manipur’s most recognisable cultural symbols.",
    lookFor: "Look for the pair of guardians, the central brick staircase and the arched pavilion behind them.",
    reconstruction: "The silhouette, paired arrangement and pavilion colours follow the photograph. Sculptural ornament, dimensions and unseen surfaces are interpretive.",
    camera: [6, 2.2, 24] as [number, number, number],
    target: [0, 3, 0] as [number, number, number],
  },
  {
    id: "western-gate" as const,
    name: "The western gateway",
    shortName: "Western gate",
    subtitle: "A threshold into Kangla",
    image: "/file-uploads/112.jpg",
    alt: "The blue western gate at Kangla has a tall central arch, pale columns, flanking balconies and crossed golden roof finials.",
    description: "The western gateway brings together a tall open arch, blue timber-like facades and pale columns. Notice the roof’s crossed finials, a distinctive feature in the architectural vocabulary of Kangla.",
    lookFor: "Compare the central arch, two side balconies, steep gabled roof and crossed roof ornaments with the photograph.",
    reconstruction: "Facade proportions and roof forms are estimated from the photograph. The rear elevation and surrounding planting are illustrative.",
    camera: [7, 2.4, 28] as [number, number, number],
    target: [0, 5, 0] as [number, number, number],
  },
  {
    id: "pakhangba" as const,
    name: "Pakhangba Laishang",
    shortName: "Pakhangba temple",
    subtitle: "A sacred place, held in white",
    image: "/file-uploads/113.jpg",
    alt: "White Pakhangba temple with a tiered spire and golden finials, raised above steps and lawns, with a pool in the foreground.",
    description: "Pakhangba Laishang is a place of worship within Kangla. The white shrine, layered roof and raised approach sit within an open green setting. Explore its exterior with respect for its living religious significance.",
    lookFor: "Follow the central approach from the foreground pool to the steps, white shrine and layered spire.",
    reconstruction: "The exterior composition follows the reference photo; dimensions, fine religious ornament and garden layout are approximate. No sacred interior is reconstructed.",
    camera: [8, 2.4, 29] as [number, number, number],
    target: [0, 4, 0] as [number, number, number],
  },
];

/** Stops carry their recorded narration, looked up by id. */
export const kanglaStops = stops.map((stop) => ({ ...stop, narration: kanglaNarration[stop.id] }));


export const kanglaMapUrl = "https://www.google.com/maps/search/?api=1&query=Kangla+Fort+Imphal";
export const kanglaSources = [
  { title: "Poly Haven · CC0 scanned materials", href: "https://polyhaven.com/license", note: "Brick, plaster and ground surfaces; HDRI used for lighting, not as a photograph of Kangla." },
  { title: "Kangla Sha · CC0 photograph of the museum replica", href: "https://commons.wikimedia.org/wiki/Category:Statues_of_Kanglasha", note: "The sculpture in the guardians scene is reconstructed from this photograph by image-to-3D and then repaired by hand. CC0, so the derived model is unencumbered." },
  { title: "OpenStreetMap · Kangla Palace and its features", href: "https://www.openstreetmap.org/way/120515792", note: "Every coordinate on the site map (the enclosure, the moats, the building footprints and each landmark pin) is taken from OSM, not estimated. ODbL." },
  { title: "Esri World Imagery", href: "https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9", note: "Satellite basemap under the site map. Real imagery runs to zoom 18 over Imphal; closer views are the z18 tile enlarged." },
  { title: "Google Maps · Kangla Fort", href: kanglaMapUrl, note: "Cross-check for the site layout and a link out for visitors; no map imagery is copied into the models." },
  { title: "Kangla conservation plan · 2003", href: "https://architexturez.net/doc/az-cf-21173", note: "Historic site context. This predates later reconstructions." },
  { title: "Kangla site drawing · 2003", href: "https://architexturez.net/file/kfap-cdp-vol-i-charter-dwg-04-png", note: "Moats, citadel and spatial context; not a current measured survey." },
];
