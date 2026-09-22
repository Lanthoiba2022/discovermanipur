/**
 * Manipur Tourism domain types.
 *
 * These are the contract between the data layer (src/lib/data/*) and every
 * feature route. Phase 0 backs the data layer with typed seed modules; Phase 7
 * swaps the function bodies to Supabase queries without changing these shapes.
 */

export type District =
  | "Imphal East"
  | "Imphal West"
  | "Bishnupur"
  | "Thoubal"
  | "Kakching"
  | "Churachandpur"
  | "Ukhrul"
  | "Senapati"
  | "Tamenglong"
  | "Chandel"
  | "Jiribam"
  | "Kamjong"
  | "Noney"
  | "Pherzawl"
  | "Tengnoupal"
  | "Kangpokpi";

export type Season = "spring" | "summer" | "monsoon" | "autumn" | "winter";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface MediaImage {
  src: string;
  alt: string;
  credit?: string;
  blurDataURL?: string;
}

/* ---------------------------------- Hotspots --------------------------------- */

export type HotspotCategory =
  | "lake"
  | "hill"
  | "heritage"
  | "wildlife"
  | "waterfall"
  | "temple"
  | "museum"
  | "market"
  | "village"
  | "memorial"
  | "cave"
  | "park";

export interface Hotspot {
  id: string;
  slug: string;
  name: string;
  meiteiName?: string;
  tagline: string;
  description: string;
  history?: string;
  category: HotspotCategory;
  district: District;
  location: string;
  coordinates: GeoPoint;
  images: MediaImage[];
  bestTimeToVisit: string;
  bestSeasons: Season[];
  entryFee: string;
  timings: string;
  howToReach: string;
  distanceFromImphalKm: number;
  durationHours: number;
  tips: string[];
  accessibility: {
    wheelchairAccessible: boolean;
    notes: string;
  };
  tags: string[];
  featured: boolean;
  /** Optional 360°/3D asset used by the Phase 8 AR/VR tour. */
  panoramaUrl?: string;
}

/* --------------------------------- Homestays --------------------------------- */

export type HomestayAmenity =
  | "wifi"
  | "parking"
  | "breakfast"
  | "hot-water"
  | "bonfire"
  | "pet-friendly"
  | "guided-tours"
  | "local-cuisine"
  | "lake-view"
  | "hill-view"
  | "power-backup"
  | "ac";

export interface Homestay {
  id: string;
  slug: string;
  title: string;
  description: string;
  hostName: string;
  hostStory?: string;
  hostAvatar?: string;
  location: string;
  district: District;
  coordinates: GeoPoint;
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: HomestayAmenity[];
  images: MediaImage[];
  rating: number;
  reviewCount: number;
  houseRules: string[];
  cancellationPolicy: string;
  featured: boolean;
  isActive: boolean;
}

/* -------------------------------- Experiences -------------------------------- */

export type ExperienceCategory =
  | "craft"
  | "cuisine"
  | "festival"
  | "adventure"
  | "wellness"
  | "music"
  | "textile"
  | "agriculture"
  | "wildlife";

export interface Experience {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: ExperienceCategory;
  host: string;
  location: string;
  district: District;
  durationHours: number;
  pricePerPerson: number;
  groupSizeMax: number;
  languages: string[];
  includes: string[];
  images: MediaImage[];
  rating: number;
  reviewCount: number;
  featured: boolean;
}

/* --------------------------------- Eateries ---------------------------------- */

export type CuisineType =
  | "manipuri"
  | "naga"
  | "kuki"
  | "north-indian"
  | "chinese"
  | "cafe"
  | "street-food"
  | "vegan";

export interface MenuItem {
  name: string;
  meiteiName?: string;
  description: string;
  price: number;
  isVegetarian: boolean;
  isSignature: boolean;
}

export interface Eatery {
  id: string;
  slug: string;
  name: string;
  description: string;
  cuisines: CuisineType[];
  location: string;
  district: District;
  coordinates: GeoPoint;
  priceRange: 1 | 2 | 3;
  timings: string;
  phone?: string;
  images: MediaImage[];
  rating: number;
  reviewCount: number;
  signatureDishes: MenuItem[];
  acceptsReservations: boolean;
  featured: boolean;
}

/* ----------------------------------- Tours ----------------------------------- */

export interface TourDay {
  day: number;
  title: string;
  summary: string;
  stops: string[];
  meals: string[];
  stay?: string;
}

export interface Tour {
  id: string;
  slug: string;
  title: string;
  description: string;
  durationDays: number;
  pricePerPerson: number;
  groupSizeMax: number;
  difficulty: "easy" | "moderate" | "challenging";
  themes: string[];
  districtsCovered: District[];
  itinerary: TourDay[];
  includes: string[];
  excludes: string[];
  images: MediaImage[];
  departureDates: string[];
  rating: number;
  reviewCount: number;
  featured: boolean;
}

/* --------------------------------- Transport --------------------------------- */

export type TransportMode = "cab" | "suv" | "tempo" | "bike" | "shared-sumo" | "bus";

export interface TransportOption {
  id: string;
  slug: string;
  name: string;
  mode: TransportMode;
  operator: string;
  description: string;
  seats: number;
  pricePerDay?: number;
  pricePerKm?: number;
  routes: string[];
  includes: string[];
  images: MediaImage[];
  rating: number;
  featured: boolean;
}

/* --------------------------------- Festivals --------------------------------- */

export interface Festival {
  id: string;
  slug: string;
  name: string;
  meiteiName?: string;
  description: string;
  month: string;
  typicalDates: string;
  location: string;
  district: District;
  significance: string;
  images: MediaImage[];
  featured: boolean;
}

/* ----------------------------- Bookings & accounts --------------------------- */

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type BookingKind = "homestay" | "experience" | "tour" | "transport" | "table";

export interface Booking {
  id: string;
  kind: BookingKind;
  refId: string;
  refTitle: string;
  userId: string;
  startDate: string;
  endDate?: string;
  guests: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
}

export type UserRole = "user" | "host" | "admin";

export interface Profile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
}

export type HostType = "homestay" | "eatery" | "guide" | "experience";
export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface HostApplication {
  id: string;
  userId: string;
  hostType: HostType;
  propertyName: string;
  propertyAddress: string;
  district: District;
  description: string;
  status: ApplicationStatus;
  adminNotes?: string;
  createdAt: string;
}

/* ----------------------------------- Crafts ---------------------------------- */

export type CraftCategory =
  | "handloom"
  | "pottery"
  | "bamboo"
  | "jewellery"
  | "sculpture"
  | "food-produce"
  | "instrument";

/**
 * A craft listed by a Manipuri maker. Manipur Tourism does not process payments — a
 * listing carries the artisan's own contact details and an enquiry goes
 * straight to them, so the money and the relationship stay local.
 */
export interface Craft {
  id: string;
  slug: string;
  name: string;
  meiteiName?: string;
  description: string;
  story?: string;
  category: CraftCategory;
  price: number;
  priceNote?: string;
  maker: string;
  makerStory?: string;
  location: string;
  district: District;
  phone?: string;
  website?: string;
  images: MediaImage[];
  materials: string[];
  madeToOrder: boolean;
  leadTimeDays?: number;
  giTagged: boolean;
  featured: boolean;
}

/* ------------------------------ Saved itineraries ---------------------------- */

export interface SavedItineraryStop {
  title: string;
  slug?: string;
  href?: string;
  note?: string;
}

export interface SavedItineraryDay {
  day: number;
  title: string;
  summary: string;
  stops: SavedItineraryStop[];
  meals: string[];
  stay?: string;
}

export interface SavedItinerary {
  id: string;
  userId: string;
  title: string;
  days: SavedItineraryDay[];
  travelMonth?: string;
  estimatedCostInr?: number;
  notes?: string;
  createdAt: string;
}

/* --------------------------------- Testimonials ------------------------------ */

export interface Testimonial {
  id: string;
  name: string;
  origin: string;
  avatar?: string;
  quote: string;
  rating: number;
  tripType: string;
}

/* ------------------------------ Query primitives ----------------------------- */

export interface ListQuery {
  search?: string;
  district?: District;
  featured?: boolean;
  limit?: number;
  offset?: number;
  sort?: "featured" | "price-asc" | "price-desc" | "rating";
}
