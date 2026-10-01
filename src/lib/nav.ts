import type { IconName } from "@/lib/icons";

/**
 * Site navigation — the single source of truth for the header, the mega
 * menu, the mobile drawer and the footer.
 *
 * The rule this file exists to enforce: **if a route is a feature, it is
 * reachable from the chrome.** That includes the 3D Kangla explorer, the host
 * funnel, sign-in and the search page. Anything genuinely role-gated
 * (`/admin/*`) or reached from a card (`/[slug]` details) stays out by design.
 */

export interface NavItem {
  label: string;
  href: string;
  description?: string;
  /** Rendered in the mega menu. Resolved through `@/lib/icons`. */
  icon?: IconName;
  /** Short flag — "New", "Beta", "3D". Kept to one word. */
  badge?: string;
}

export interface NavGroup {
  label: string;
  /** Standfirst for the mega-menu panel. */
  blurb: string;
  items: NavItem[];
  /** The one item promoted to a picture card inside the panel. */
  feature?: {
    href: string;
    eyebrow: string;
    title: string;
    body: string;
    image: string;
    alt: string;
  };
}

export const navGroups: NavGroup[] = [
  {
    label: "Discover",
    blurb: "The valley, the hills and everything people cross the country for.",
    items: [
      {
        label: "Places",
        href: "/hotspots",
        description: "Lakes, hills, forts and floating islands",
        icon: "MapPin",
      },
      {
        label: "Experiences",
        href: "/experiences",
        description: "Weave, cook, paddle, celebrate",
        icon: "Sparkles",
      },
      {
        label: "Food & eateries",
        href: "/eateries",
        description: "Eromba, singju and chak-hao",
        icon: "Leaf",
      },
      {
        label: "Festivals",
        href: "/festivals",
        description: "The year in colour and drum",
        icon: "CalendarRange",
      },
      {
        label: "Crafts & makers",
        href: "/store",
        description: "Buy direct from the maker",
        icon: "Handshake",
      },
      {
        label: "Kangla Fort in 3D",
        href: "/explore/kangla",
        description: "Fly the fort from above",
        icon: "Landmark",
        badge: "3D",
      },
    ],
    feature: {
      href: "/explore/kangla",
      eyebrow: "Immersive",
      title: "Walk Kangla without leaving your chair",
      body: "The seat of Manipuri kings, rendered in photorealistic 3D with every landmark pinned.",
      image: "/file-uploads/kangla-kanglasha.webp",
      alt: "The pair of white Kanglasha dragon-lion guardian statues standing on the brick plaza inside Kangla Fort, Imphal.",
    },
  },
  {
    label: "Plan",
    blurb: "From a blank week to a booked itinerary.",
    items: [
      {
        label: "AI Concierge",
        href: "/plan",
        description: "Build an itinerary in seconds",
        icon: "Compass",
        badge: "AI",
      },
      {
        label: "Tours",
        href: "/tours",
        description: "Curated multi-day routes",
        icon: "CalendarCheck",
      },
      {
        label: "Homestays",
        href: "/homestays",
        description: "Live with a Manipuri family",
        icon: "Home",
      },
      {
        label: "Getting around",
        href: "/transport",
        description: "Cabs, sumos and bikes",
        icon: "Smartphone",
      },
      {
        label: "Search everything",
        href: "/search",
        description: "One box across the whole site",
        icon: "Compass",
      },
      {
        label: "Responsible travel",
        href: "/responsible-travel",
        description: "Permits, etiquette and the pledge",
        icon: "ShieldCheck",
      },
    ],
    feature: {
      href: "/plan",
      eyebrow: "Concierge",
      title: "Tell it how long you have",
      body: "Days, month, pace and budget in — a day-by-day Manipur itinerary out, with real stays and hosts attached.",
      image: "/file-uploads/loktak-phumdi-hut.webp",
      alt: "A stilted tin-roofed fishing hut on a floating phumdi island, with the ring-shaped phumdis of Loktak Lake stretching to the hills behind.",
    },
  },
  {
    label: "Host",
    blurb: "Open your home, your kitchen or your craft to travellers.",
    items: [
      {
        label: "Become a host",
        href: "/host",
        description: "Why hosts join, and what they earn",
        icon: "Handshake",
      },
      {
        label: "Start an application",
        href: "/host/apply",
        description: "Four steps, saved as you go",
        icon: "ClipboardList",
      },
      {
        label: "Hosting standards",
        href: "/host/guidelines",
        description: "What we ask of every host",
        icon: "BadgeCheck",
      },
      {
        label: "Host dashboard",
        href: "/host/dashboard",
        description: "Listings, bookings and earnings",
        icon: "Wallet",
      },
    ],
  },
  {
    label: "About",
    blurb: "Who built this, and how to reach a person.",
    items: [
      {
        label: "About Discover Manipur",
        href: "/about",
        description: "The place, and our part in it",
        icon: "Megaphone",
      },
      {
        label: "FAQ",
        href: "/faq",
        description: "Permits, safety, seasons, money",
        icon: "LifeBuoy",
      },
      {
        label: "Contact",
        href: "/contact",
        description: "Talk to the team",
        icon: "Mail",
      },
      {
        label: "Accessibility",
        href: "/accessibility",
        description: "Our WCAG 2.1 AA commitment",
        icon: "Accessibility",
      },
    ],
  },
];

export const flatNav: NavItem[] = navGroups.flatMap((g) => g.items);

/**
 * Account entries. Split out of `navGroups` because the header renders them
 * in the utility cluster rather than the mega menu, and because which of
 * these is correct depends on whether anyone is signed in.
 */
export const accountNav: NavItem[] = [
  { label: "Sign in", href: "/auth", description: "Or create an account", icon: "BadgeCheck" },
  { label: "My trips", href: "/account/bookings", description: "Upcoming and past bookings" },
  { label: "Saved", href: "/account/saved", description: "Your wishlist" },
  { label: "Saved itineraries", href: "/account/itineraries", description: "Plans from the concierge" },
  { label: "Profile", href: "/account/profile", description: "Your details" },
];

export const footerNav = [
  {
    label: "Discover",
    items: [
      { label: "Places", href: "/hotspots" },
      { label: "Experiences", href: "/experiences" },
      { label: "Eateries", href: "/eateries" },
      { label: "Festivals", href: "/festivals" },
      { label: "Crafts", href: "/store" },
      { label: "Kangla in 3D", href: "/explore/kangla" },
    ],
  },
  {
    label: "Plan",
    items: [
      { label: "AI Concierge", href: "/plan" },
      { label: "Tours", href: "/tours" },
      { label: "Homestays", href: "/homestays" },
      { label: "Transport", href: "/transport" },
      { label: "Search", href: "/search" },
      { label: "Responsible travel", href: "/responsible-travel" },
    ],
  },
  {
    label: "Host",
    items: [
      { label: "Become a host", href: "/host" },
      { label: "Start an application", href: "/host/apply" },
      { label: "Hosting standards", href: "/host/guidelines" },
      { label: "Host dashboard", href: "/host/dashboard" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Sign in", href: "/auth" },
      { label: "My trips", href: "/account/bookings" },
      { label: "Saved", href: "/account/saved" },
      { label: "Saved itineraries", href: "/account/itineraries" },
    ],
  },
  {
    label: "About",
    items: [
      { label: "About Discover Manipur", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
      { label: "Accessibility", href: "/accessibility" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];
