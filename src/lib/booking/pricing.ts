import { nightsBetween } from "@/lib/utils";

/** Discover Manipur's platform fee, applied to the stay subtotal. */
export const SERVICE_FEE_RATE = 0.08;

export interface StayQuote {
  nights: number;
  rate: number;
  subtotal: number;
  serviceFee: number;
  total: number;
}

export function quoteStay(input: {
  pricePerNight: number;
  from?: Date | string | null;
  to?: Date | string | null;
}): StayQuote {
  const nights = input.from && input.to ? nightsBetween(input.from, input.to) : 0;
  const subtotal = nights * input.pricePerNight;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  return {
    nights,
    rate: input.pricePerNight,
    subtotal,
    serviceFee,
    total: subtotal + serviceFee,
  };
}

/** Experiences carry a smaller fee than stays. */
export const EXPERIENCE_FEE_RATE = 0.05;

/** Tours are discounted for groups of this size or more. */
export const TOUR_GROUP_MIN = 4;
export const TOUR_GROUP_DISCOUNT_RATE = 0.05;

export interface PerPersonQuote {
  people: number;
  rate: number;
  subtotal: number;
  /** Positive for a fee, negative for a discount. */
  adjustment: number;
  total: number;
}

export function quoteExperience(input: { pricePerPerson: number; guests: number }): PerPersonQuote {
  const subtotal = input.pricePerPerson * input.guests;
  const fee = Math.round(subtotal * EXPERIENCE_FEE_RATE);
  return {
    people: input.guests,
    rate: input.pricePerPerson,
    subtotal,
    adjustment: fee,
    total: subtotal + fee,
  };
}

export function quoteTour(input: { pricePerPerson: number; guests: number }): PerPersonQuote {
  const subtotal = input.pricePerPerson * input.guests;
  const discount = input.guests >= TOUR_GROUP_MIN ? Math.round(subtotal * TOUR_GROUP_DISCOUNT_RATE) : 0;
  return {
    people: input.guests,
    rate: input.pricePerPerson,
    subtotal,
    // `-0` when there is no discount would format as "-₹0" (Intl keeps the
    // sign of negative zero), so a zero discount is a plain 0.
    adjustment: discount === 0 ? 0 : -discount,
    total: subtotal - discount,
  };
}

/** Day hire counts both ends: 3 → 5 October is three days. No return date is one day. */
export function transportDays(startDate: string, endDate?: string | null): number {
  return endDate ? Math.max(1, nightsBetween(startDate, endDate) + 1) : 1;
}

export function quoteTransportByDay(input: {
  pricePerDay: number;
  startDate: string;
  endDate?: string | null;
}): { days: number; total: number } {
  const days = transportDays(input.startDate, input.endDate);
  return { days, total: days * input.pricePerDay };
}

/** `YYYY-MM-DD` in local time, the shape the bookings table stores. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}
