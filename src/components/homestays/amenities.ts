import {
  AirVent,
  BatteryCharging,
  Car,
  Croissant,
  Flame,
  Map,
  Mountain,
  PawPrint,
  ShowerHead,
  UtensilsCrossed,
  Waves,
  Wifi,
  type LucideIcon,
} from "lucide-react";

import type { HomestayAmenity } from "@/types";

export const AMENITY_META: Record<HomestayAmenity, { label: string; icon: LucideIcon }> = {
  wifi: { label: "Wi-Fi", icon: Wifi },
  parking: { label: "Free parking", icon: Car },
  breakfast: { label: "Breakfast included", icon: Croissant },
  "hot-water": { label: "Hot water", icon: ShowerHead },
  bonfire: { label: "Bonfire", icon: Flame },
  "pet-friendly": { label: "Pet friendly", icon: PawPrint },
  "guided-tours": { label: "Guided tours", icon: Map },
  "local-cuisine": { label: "Home-cooked meals", icon: UtensilsCrossed },
  "lake-view": { label: "Lake view", icon: Waves },
  "hill-view": { label: "Hill view", icon: Mountain },
  "power-backup": { label: "Power backup", icon: BatteryCharging },
  ac: { label: "Air conditioning", icon: AirVent },
};

/** Stable display order for filter chips and amenity grids. */
export const AMENITY_ORDER: HomestayAmenity[] = [
  "wifi",
  "breakfast",
  "hot-water",
  "local-cuisine",
  "parking",
  "power-backup",
  "lake-view",
  "hill-view",
  "bonfire",
  "guided-tours",
  "pet-friendly",
  "ac",
];

export function amenityLabel(a: HomestayAmenity) {
  return AMENITY_META[a]?.label ?? a;
}
