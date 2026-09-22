import type { SearchResult } from "@/lib/data";

export type SearchKind = SearchResult["kind"];

export const SEARCH_KINDS: { value: SearchKind; label: string; plural: string }[] = [
  { value: "hotspot", label: "Place", plural: "Places" },
  { value: "homestay", label: "Stay", plural: "Stays" },
  { value: "experience", label: "Experience", plural: "Experiences" },
  { value: "eatery", label: "Eatery", plural: "Eateries" },
  { value: "tour", label: "Tour", plural: "Tours" },
  { value: "craft", label: "Craft", plural: "Crafts" },
];

const byValue = new Map(SEARCH_KINDS.map((k) => [k.value, k]));

export function kindLabel(kind: SearchKind) {
  return byValue.get(kind)?.label ?? kind;
}

export function kindPlural(kind: SearchKind) {
  return byValue.get(kind)?.plural ?? kind;
}

export function isSearchKind(value: string | undefined): value is SearchKind {
  return Boolean(value) && byValue.has(value as SearchKind);
}
