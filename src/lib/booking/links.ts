import type { Booking, BookingKind } from "@/types";

/** A booking as the account pages show it: the row plus a link to its listing, when it still has one. */
export type BookingView = Booking & { href?: string };

const ROUTE: Record<BookingKind, string> = {
  homestay: "/homestays",
  experience: "/experiences",
  tour: "/tours",
  transport: "/transport",
  table: "/eateries",
};

export function bookingHref(kind: BookingKind, slug: string): string {
  return `${ROUTE[kind]}/${encodeURIComponent(slug)}`;
}
