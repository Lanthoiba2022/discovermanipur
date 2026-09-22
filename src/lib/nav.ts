export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Discover",
    items: [
      { label: "Places", href: "/hotspots", description: "Lakes, hills, forts and floating islands" },
      { label: "Experiences", href: "/experiences", description: "Weave, cook, paddle, celebrate" },
      { label: "Eat", href: "/eateries", description: "Eromba, singju and chak-hao" },
      { label: "Festivals", href: "/festivals", description: "The year in colour and drum" },
      { label: "Crafts", href: "/store", description: "Buy direct from the maker" },
    ],
  },
  {
    label: "Plan",
    items: [
      { label: "Stays", href: "/homestays", description: "Live with a Manipuri family" },
      { label: "Tours", href: "/tours", description: "Curated multi-day routes" },
      { label: "Getting around", href: "/transport", description: "Cabs, sumos and bikes" },
      { label: "AI Concierge", href: "/plan", description: "Build an itinerary in seconds" },
    ],
  },
];

export const flatNav: NavItem[] = navGroups.flatMap((g) => g.items);

export const footerNav = [
  {
    label: "Discover",
    items: [
      { label: "Places", href: "/hotspots" },
      { label: "Experiences", href: "/experiences" },
      { label: "Eateries", href: "/eateries" },
      { label: "Festivals", href: "/festivals" },
      { label: "Crafts", href: "/store" },
    ],
  },
  {
    label: "Plan",
    items: [
      { label: "Homestays", href: "/homestays" },
      { label: "Tours", href: "/tours" },
      { label: "Transport", href: "/transport" },
      { label: "AI Concierge", href: "/plan" },
    ],
  },
  {
    label: "Community",
    items: [
      { label: "Become a host", href: "/host" },
      { label: "Responsible travel", href: "/responsible-travel" },
      { label: "About Manipur Tourism", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    label: "Support",
    items: [
      { label: "FAQ", href: "/faq" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
];
