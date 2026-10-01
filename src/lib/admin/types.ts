import type { BookingKind, BookingStatus, UserRole } from "@/types";

import type { MonthPoint } from "@/lib/host/types";

export interface AdminOverview {
  listings: { activeHomestays: number; inactiveHomestays: number; experiences: number };
  bookings: { total: number; bookedValue: number; byMonth: MonthPoint[] };
  accounts: { total: number; byRole: Record<UserRole, number>; joinedThisMonth: number };
  /** The months the charts cover, e.g. "Nov 2025 to Oct 2026". */
  windowLabel: string;
}

export interface AdminBookingRow {
  id: string;
  kind: BookingKind;
  /** The listing's current title, or the title stored on the booking if the listing is gone. */
  title: string;
  listingMissing: boolean;
  guestName: string;
  guestEmail: string;
  /** `YYYY-MM-DD`, a calendar date with no time zone. */
  startDate: string;
  endDate: string | null;
  guests: number;
  totalPrice: number;
  status: BookingStatus;
}

export type ModerationKind = "homestay" | "experience";

export interface ModerationRow {
  id: string;
  kind: ModerationKind;
  title: string;
  district: string;
  location: string;
  price: number;
  rating: number;
  featured: boolean;
  isActive: boolean;
  /** Only homestays have an `is_active` column; experiences are always live. */
  canToggleActive: boolean;
}

export type ModerationResult = { ok: true } | { ok: false; error: string };
