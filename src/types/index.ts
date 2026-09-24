/**
 * Manipur Tourism domain types.
 *
 * These are the contract between the data layer (src/lib/data/*) and every
 * feature route. Phase 0 backs the data layer with typed seed modules; Phase 7
 * swapped the function bodies to database queries without changing these shapes.
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

/**
 * A photo we are licensed to display but not to store.
 *
 * Google Places photos are fetched per request through `/api/place-photo`;
 * their bytes must not be cached, which is why they are kept apart from
 * `MediaImage` (files we host ourselves in `public/file-uploads`).
 *
 * `attribution` is a condition of the Maps Platform terms — render it wherever
 * the photo appears.
 */
export interface PhotoRef {
  provider: "google-places";
  /** `places/<place_id>/photos/<photo_id>` — pass to /api/place-photo?ref= */
  ref: string;
  width?: number;
  height?: number;
  attribution: { name?: string; uri?: string }[];
}

/**
 * How well attested a catalogue row is. `phone-verified` may only be set by a
 * human who actually rang the business — never by an importer.
 */
export type SourceVerification =
  | "official"
  | "corroborated"
  | "single-source"
  | "phone-verified"
  | "unverified";

/**
 * Display cohort. Higher sorts first, ahead of `featured`.
 * 0 = original 2025 seed, 100 = verified 2026 research pass.
 */
export type SortWeight = number;

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
  /** Externally-hosted photos resolved at request time. See PhotoRef. */
  photoRefs?: PhotoRef[];
  /** Display cohort — higher sorts first. */
  sortWeight?: SortWeight;
  verification?: SourceVerification;
  sources?: string[];
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
  photoRefs?: PhotoRef[];
  sortWeight?: SortWeight;
  verification?: SourceVerification;
  sources?: string[];
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
  photoRefs?: PhotoRef[];
  sortWeight?: SortWeight;
  verification?: SourceVerification;
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
