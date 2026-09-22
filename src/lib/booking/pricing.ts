import { nightsBetween } from "@/lib/utils";

/** Manipur Tourism's platform fee, applied to the stay subtotal. */
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

/** `YYYY-MM-DD` in local time — the shape the bookings table stores. */
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
