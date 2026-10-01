/**
 * The fold's picture reel.
 *
 * Five frames, chosen to move through the state rather than repeat one mood:
 * water, hills, a cultivated valley, a dance, a flower. Every file here was
 * opened and looked at before it was listed. The inherited photo library
 * contains mis-filed stock (a Dutch road map, a European loom, Western resort
 * interiors), and generic or wrong imagery is the single most damaging thing a
 * destination site can put on its fold.
 *
 * Deliberately excluded after review: `manipuri-raas-group.webp` (a posed
 * group snapshot against a plastic tent backdrop), `kangla-kanglasha.webp`
 * (two thirds empty tarmac at full bleed; it works as the small nav feature
 * card it already is) and `senapati-green-hills.webp` (a greyer duplicate of
 * the ridgeline below).
 *
 * `caption` carries only what is actually known about the frame. There are no
 * coordinates, because they are not recorded for every frame in this repo and
 * inventing them would be worse than omitting them.
 */
export interface HeroSlide {
  src: string;
  alt: string;
  caption: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    src: "/file-uploads/loktakComplete.png",
    alt:
      "Aerial view of Loktak Lake at dawn, its floating phumdi islands forming a honeycomb of green rings across still water.",
    caption: "Loktak Lake · Bishnupur",
  },
  {
    src: "/file-uploads/senapati-ridgeline.webp",
    alt:
      "A ridgeline of deep green hills folding away ridge behind ridge into low cloud in Senapati district.",
    caption: "Senapati ridgeline",
  },
  {
    src: "/file-uploads/terraced-valley-dusk.webp",
    alt:
      "A terraced valley in the Manipur hills at dusk, paddy steps cut into the slope under a bank of cloud.",
    caption: "Terraced valley · the hills",
  },
  {
    src: "/file-uploads/manipuri-dancer-solo.webp",
    alt:
      "A Manipuri classical dancer mid-gesture in an orange and gold costume, lit against a black stage.",
    caption: "Manipuri Raas · classical dance",
  },
  {
    src: "/file-uploads/dzukou-lily-valley.webp",
    alt:
      "A single pink lily in flower above the grass of Dzukou Valley, with mist lying along the ridge behind.",
    caption: "Dzukou Valley",
  },
];
