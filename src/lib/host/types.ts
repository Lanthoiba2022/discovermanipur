import type {
  Booking,
  District,
  HostApplication,
  HostType,
} from "@/types";

/**
 * An application row as operations sees it: the domain `HostApplication`
 * contract plus the contact detail the review queue needs. The extra fields
 * live only here so `@/types` stays the shared contract.
 */
export interface HostApplicationRecord extends HostApplication {
  reference: string;
  applicantName: string;
  email: string;
  phone: string;
  capacity: number;
  photoCount: number;
}

export type HostListingStatus = "live" | "paused" | "draft";

export interface HostListingRecord {
  id: string;
  title: string;
  kind: HostType;
  district: District;
  location: string;
  pricePerNight: number;
  status: HostListingStatus;
  occupancyPct: number;
  rating: number;
  reviewCount: number;
  image: string;
  imageAlt: string;
}

export interface HostBookingRecord extends Booking {
  guestName: string;
  guestOrigin: string;
  nights: number;
}

export interface MonthPoint {
  label: string;
  value: number;
}

/* ------------------------------------------------- host dashboard (live) -- */

/** The listing kinds a host can own today: the only tables with `host_id`. */
export type HostListingKind = "homestay" | "experience";

/** One of the signed-in host's own listings, as the dashboard shows it. */
export interface HostDashboardListing {
  id: string;
  kind: HostListingKind;
  slug: string;
  title: string;
  location: string;
  district: string;
  /** Per night for a homestay, per person for an experience. */
  price: number;
  /** `false` only for a paused homestay; experiences have no pause switch. */
  isActive: boolean;
  featured: boolean;
  /** Experiences have no `is_active` column, so only homestays can be paused. */
  canPause: boolean;
  rating: number;
  reviewCount: number;
  /** A self-hosted photo, or `null`. Places photos are skipped: they need a credit overlay. */
  image: { src: string; alt: string } | null;
}

/** A booking on one of the host's listings. Only the guest's first name leaves the server. */
export interface HostDashboardBooking {
  id: string;
  kind: HostListingKind;
  listingTitle: string;
  guestFirstName: string | null;
  startDate: string;
  endDate: string | null;
  /** Nights for a stay with an end date; `null` for experiences and open-ended rows. */
  nights: number | null;
  guests: number;
  totalPrice: number;
  status: Booking["status"];
}

/** The host's most recent application, read-only. */
export interface HostDashboardApplication {
  id: string;
  hostType: HostType;
  propertyName: string;
  district: string;
  status: HostApplication["status"];
  adminNotes: string | null;
  createdAt: string;
}

export interface HostDashboardStats {
  upcomingCount: number;
  guestsExpected: number;
  liveListings: number;
  totalListings: number;
  /** Weighted by review count; `null` when no listing has a review. */
  rating: number | null;
  reviewCount: number;
  bookedThisMonth: number;
  bookedLastMonth: number;
}

/**
 * Everything the dashboard renders. `state` says whether the numbers are real:
 * `no-database` on a deployment without one, `error` when the read failed —
 * both render an honest notice instead of figures.
 */
export interface HostDashboardData {
  state: "ok" | "no-database" | "error";
  listings: HostDashboardListing[];
  upcoming: HostDashboardBooking[];
  byMonth: MonthPoint[];
  stats: HostDashboardStats;
  application: HostDashboardApplication | null;
}

export const HOST_TYPE_LABEL: Record<HostType, string> = {
  homestay: "Homestay",
  eatery: "Eatery",
  guide: "Local guide",
  experience: "Experience",
};

export const DISTRICTS = [
  "Imphal East",
  "Imphal West",
  "Bishnupur",
  "Thoubal",
  "Kakching",
  "Churachandpur",
  "Ukhrul",
  "Senapati",
  "Tamenglong",
  "Chandel",
  "Jiribam",
  "Kamjong",
  "Noney",
  "Pherzawl",
  "Tengnoupal",
  "Kangpokpi",
] as const satisfies readonly District[];
