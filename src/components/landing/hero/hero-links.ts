/**
 * The category rail under the fold.
 *
 * The national board runs a row of pipe-separated word links directly beneath
 * its film: the single densest piece of wayfinding on the page, because it
 * lets a first-time visitor pick a subject before they have read a word of
 * copy. Ours keeps that shape and points it at real routes rather than at
 * marketing labels: every entry below resolves to a page that already exists.
 */
export interface HeroCategory {
  label: string;
  href: string;
}

export const HERO_CATEGORIES: readonly HeroCategory[] = [
  { label: "Places", href: "/hotspots" },
  { label: "Experiences", href: "/experiences" },
  { label: "Festivals", href: "/festivals" },
  { label: "Crafts", href: "/store" },
  { label: "Food", href: "/eateries" },
  { label: "Stays", href: "/homestays" },
  { label: "Tours", href: "/tours" },
  { label: "Kangla in 3D", href: "/explore/kangla" },
] as const;
