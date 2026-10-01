/**
 * Icon registry: the bridge between content and the component tree.
 *
 * Content lives in the database, so an icon choice has to travel as a string.
 * This maps those strings back to components. The registry is explicit rather
 * than a dynamic `lucide[name]` lookup for two reasons: it keeps the bundle to
 * the icons actually used, and an unknown name fails here at the boundary
 * instead of rendering `undefined` somewhere deep in a page.
 *
 * Adding an icon to content means adding it here too. That is the intended
 * trade: content is editable without a deploy, the icon *vocabulary* is not.
 */
import {
  Accessibility,
  BadgeCheck,
  CalendarCheck,
  CalendarRange,
  Camera,
  ClipboardList,
  Compass,
  Handshake,
  Home,
  Landmark,
  Languages,
  Leaf,
  LifeBuoy,
  Mail,
  MapPin,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const ICONS = {
  Accessibility,
  BadgeCheck,
  CalendarCheck,
  CalendarRange,
  Camera,
  ClipboardList,
  Compass,
  Handshake,
  Home,
  Landmark,
  Languages,
  Leaf,
  LifeBuoy,
  Mail,
  MapPin,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Wallet,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

/**
 * Resolve a stored icon name. Falls back to a neutral glyph rather than
 * throwing: a stale icon name in the database should cost a nice icon, not the
 * whole page.
 */
export function iconFor(name: string | null | undefined): LucideIcon {
  return (name && ICONS[name as IconName]) || Sparkles;
}
