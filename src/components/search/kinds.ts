import {
  Bus,
  House,
  MapPin,
  Palette,
  PartyPopper,
  Route,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { createElement } from "react";

import { SEARCH_KIND_VALUES, type SearchKind } from "@/lib/data/search-match";

export type { SearchKind };

/**
 * Display names per search kind. A `Record` over the union from
 * `search-match.ts`, so a kind added there without a label here is a type
 * error, and the matcher, the static index and the `/search` page cannot
 * drift apart.
 */
const NAMES: Record<SearchKind, { label: string; plural: string }> = {
  hotspot: { label: "Place", plural: "Places" },
  homestay: { label: "Stay", plural: "Stays" },
  experience: { label: "Experience", plural: "Experiences" },
  eatery: { label: "Eatery", plural: "Eateries" },
  tour: { label: "Tour", plural: "Tours" },
  craft: { label: "Craft", plural: "Crafts" },
  festival: { label: "Festival", plural: "Festivals" },
  transport: { label: "Transport", plural: "Transport" },
};

/**
 * A glyph per kind, for a result tile that has no photo to show. The
 * typeahead's index deliberately carries no Places photos (see
 * src/app/search-index.json/route.ts), so in production this is what most
 * hotspot and eatery suggestions show: the kind at a glance rather than an
 * empty grey square. Also a `Record`, so a new kind without an icon is a type
 * error. (`iconFor` in src/lib/icons.ts is the registry for icon names stored
 * in content; these are fixed per kind, so they live here.)
 */
const ICONS: Record<SearchKind, LucideIcon> = {
  hotspot: MapPin,
  homestay: House,
  experience: Sparkles,
  eatery: UtensilsCrossed,
  tour: Route,
  craft: Palette,
  festival: PartyPopper,
  transport: Bus,
};

/** Every kind with its names, in the order the `/search` page groups and filters them. */
export const SEARCH_KINDS: { value: SearchKind; label: string; plural: string }[] =
  SEARCH_KIND_VALUES.map((value) => ({ value, ...NAMES[value] }));

export function kindLabel(kind: SearchKind) {
  return NAMES[kind]?.label ?? kind;
}

export function kindPlural(kind: SearchKind) {
  return NAMES[kind]?.plural ?? kind;
}

/** The kind's glyph; an unknown kind (an index from a newer deployment) gets the pin. */
export function kindIcon(kind: SearchKind): LucideIcon {
  return ICONS[kind] ?? MapPin;
}

/**
 * The kind's glyph as an element, always decorative (`aria-hidden`): every
 * tile that shows it also shows the kind's label as text.
 *
 * Rendered with `createElement` rather than `const Icon = kindIcon(kind)`
 * plus JSX, which the React Compiler lint reads as a component created
 * during render. The icons are module constants, so nothing is remounted.
 */
export function KindIcon({ kind, className }: { kind: SearchKind; className?: string }) {
  return createElement(kindIcon(kind), { className, "aria-hidden": true });
}

export function isSearchKind(value: string | undefined): value is SearchKind {
  return Boolean(value) && Object.hasOwn(NAMES, value as string);
}
