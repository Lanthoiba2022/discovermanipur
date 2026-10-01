/**
 * Server-side booking logic: listing lookup, pricing and row mapping for
 * `public.bookings`. Called by the Server Actions in `./actions`.
 *
 * Not a `"use server"` module on purpose — every export of one is a public
 * endpoint, and these take a database handle and trusted arguments.
 */

import { and, eq, inArray } from "drizzle-orm";

import type { BookingKind } from "@/types";

import { schema, type Db } from "@/lib/db";
import { nightsBetween } from "@/lib/utils";

import { bookingHref, type BookingView } from "./links";
import { quoteExperience, quoteStay, quoteTour, quoteTransportByDay } from "./pricing";
import type { BookingRequest } from "./schemas";

/** A request the server refused. The message is written for the traveller and safe to show. */
export class BookingRejected extends Error {}

export interface PricedBooking {
  kind: BookingKind;
  refId: string;
  refTitle: string;
  startDate: string;
  endDate: string | null;
  guests: number;
  totalPrice: number;
}

const DAY_MS = 86_400_000;
const MAX_NIGHTS = 90;
const MAX_HIRE_DAYS = 60;
const MAX_TABLE_GUESTS = 20;
const BOOKING_HORIZON_DAYS = 730;

/** Today's date in Manipur, shifted by `offsetDays`, as `YYYY-MM-DD`. */
function manipurDay(offsetDays = 0) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + offsetDays * DAY_MS));
}

function addDays(isoDate: string, days: number) {
  return new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

function checkStart(startDate: string) {
  // One day of slack: a traveller west of India can still be on "yesterday"
  // when Imphal has already turned over.
  if (startDate < manipurDay(-1)) throw new BookingRejected("Pick a date in the future.");
  if (startDate > manipurDay(BOOKING_HORIZON_DAYS)) {
    throw new BookingRejected("Requests can be made up to two years ahead.");
  }
}

function checkParty(guests: number, max: number, unit: string) {
  if (guests > max) throw new BookingRejected(`This ${unit} takes up to ${max} guests.`);
}

const first = <T,>(rows: T[]) => rows[0];

/**
 * Look the listing up and price the request from the database row. Throws
 * `BookingRejected` when the listing is unknown or hidden, or the dates or
 * party size do not fit it.
 */
export async function priceBookingRequest(db: Db, request: BookingRequest): Promise<PricedBooking> {
  const { kind, slug, startDate, guests } = request;
  checkStart(startDate);

  if (kind === "homestay") {
    const stay = first(
      await db
        .select({
          id: schema.homestays.id,
          title: schema.homestays.title,
          price: schema.homestays.price_per_night,
          maxGuests: schema.homestays.max_guests,
        })
        .from(schema.homestays)
        .where(and(eq(schema.homestays.slug, slug), eq(schema.homestays.is_active, true)))
        .limit(1),
    );
    if (!stay) throw new BookingRejected("This stay is not taking requests.");
    const endDate = request.endDate;
    if (!endDate || endDate <= startDate) throw new BookingRejected("Pick a check-out date after check-in.");
    if (nightsBetween(startDate, endDate) > MAX_NIGHTS) {
      throw new BookingRejected(`Stays can be requested for up to ${MAX_NIGHTS} nights.`);
    }
    checkParty(guests, stay.maxGuests, "stay");
    const { total } = quoteStay({ pricePerNight: stay.price, from: startDate, to: endDate });
    return { kind, refId: stay.id, refTitle: stay.title, startDate, endDate, guests, totalPrice: total };
  }

  if (kind === "experience") {
    const experience = first(
      await db
        .select({
          id: schema.experiences.id,
          title: schema.experiences.title,
          price: schema.experiences.price_per_person,
          max: schema.experiences.group_size_max,
        })
        .from(schema.experiences)
        .where(eq(schema.experiences.slug, slug))
        .limit(1),
    );
    if (!experience) throw new BookingRejected("This experience is not taking requests.");
    checkParty(guests, experience.max, "experience");
    const { total } = quoteExperience({ pricePerPerson: experience.price, guests });
    return {
      kind,
      refId: experience.id,
      refTitle: experience.title,
      startDate,
      endDate: null,
      guests,
      totalPrice: total,
    };
  }

  if (kind === "tour") {
    const tour = first(
      await db
        .select({
          id: schema.tours.id,
          title: schema.tours.title,
          price: schema.tours.price_per_person,
          max: schema.tours.group_size_max,
          days: schema.tours.duration_days,
        })
        .from(schema.tours)
        .where(eq(schema.tours.slug, slug))
        .limit(1),
    );
    if (!tour) throw new BookingRejected("This tour is not taking requests.");
    checkParty(guests, tour.max, "tour");
    const { total } = quoteTour({ pricePerPerson: tour.price, guests });
    return {
      kind,
      refId: tour.id,
      refTitle: tour.title,
      startDate,
      endDate: tour.days > 1 ? addDays(startDate, tour.days - 1) : null,
      guests,
      totalPrice: total,
    };
  }

  if (kind === "transport") {
    const transport = first(
      await db
        .select({
          id: schema.transport_options.id,
          name: schema.transport_options.name,
          perDay: schema.transport_options.price_per_day,
          seats: schema.transport_options.seats,
        })
        .from(schema.transport_options)
        .where(eq(schema.transport_options.slug, slug))
        .limit(1),
    );
    if (!transport) throw new BookingRejected("This transport option is not taking requests.");
    if (!transport.perDay) {
      throw new BookingRejected("This option is priced per kilometre. Contact the operator for a rate.");
    }
    checkParty(guests, transport.seats, "vehicle");
    const endDate = request.endDate && request.endDate > startDate ? request.endDate : null;
    const { days, total } = quoteTransportByDay({ pricePerDay: transport.perDay, startDate, endDate });
    if (days > MAX_HIRE_DAYS) {
      throw new BookingRejected(`Transport can be requested for up to ${MAX_HIRE_DAYS} days.`);
    }
    return {
      kind,
      refId: transport.id,
      refTitle: transport.name,
      startDate,
      endDate,
      guests,
      totalPrice: total,
    };
  }

  const eatery = first(
    await db
      .select({ id: schema.eateries.id, name: schema.eateries.name })
      .from(schema.eateries)
      .where(eq(schema.eateries.slug, slug))
      .limit(1),
  );
  if (!eatery) throw new BookingRejected("This eatery is not taking requests.");
  checkParty(guests, MAX_TABLE_GUESTS, "table request");
  return {
    kind,
    refId: eatery.id,
    refTitle: eatery.name,
    startDate,
    endDate: null,
    guests,
    totalPrice: 0,
  };
}

type BookingRow = typeof schema.bookings.$inferSelect;

export function toBookingView(row: BookingRow, href?: string): BookingView {
  return {
    id: row.id,
    kind: row.kind,
    refId: row.ref_id,
    refTitle: row.ref_title,
    userId: row.user_id,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    guests: row.guests,
    totalPrice: row.total_price,
    status: row.status,
    createdAt: row.created_at,
    href,
  };
}

const SLUG_TABLES = {
  homestay: schema.homestays,
  experience: schema.experiences,
  tour: schema.tours,
  transport: schema.transport_options,
  table: schema.eateries,
} as const;

/**
 * Listing links for a set of bookings, keyed by booking id. A booking whose
 * listing was deleted, or a homestay that is no longer active, gets none.
 */
export async function listingLinks(db: Db, rows: BookingRow[]): Promise<Map<string, string>> {
  const links = new Map<string, string>();
  const kinds = [...new Set(rows.map((r) => r.kind))];

  await Promise.all(
    kinds.map(async (kind) => {
      const ids = [...new Set(rows.filter((r) => r.kind === kind).map((r) => r.ref_id))];
      const table = SLUG_TABLES[kind];
      const where =
        kind === "homestay"
          ? and(inArray(schema.homestays.id, ids), eq(schema.homestays.is_active, true))
          : inArray(table.id, ids);
      const found = await db.select({ id: table.id, slug: table.slug }).from(table).where(where);
      const slugById = new Map(found.map((f) => [f.id, f.slug]));
      for (const row of rows) {
        const slug = row.kind === kind ? slugById.get(row.ref_id) : undefined;
        if (slug) links.set(row.id, bookingHref(kind, slug));
      }
    }),
  );

  return links;
}
