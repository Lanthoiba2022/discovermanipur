import type {
  Booking,
  District,
  HostApplication,
  HostType,
} from "@/types";

/**
 * An application row as operations sees it: the domain `HostApplication`
 * contract plus the contact detail the review queue needs. The extra fields
 * live only in this slice so `@/types` stays the shared contract.
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
