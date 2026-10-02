"use client";

/**
 * Booking persistence, for the browser.
 *
 * With a database and Neon Auth on the deployment ("account" mode) requests go
 * through the Server Actions in `./actions` into `public.bookings`, tied to the
 * signed-in account and priced on the server. Without them ("browser" mode, a
 * fresh clone with no env) they stay in this browser's localStorage, as before.
 * Call sites use the same functions either way and read `savedTo` to word
 * their confirmation.
 */

import { useEffect, useState } from "react";

import type { Booking, BookingKind } from "@/types";

import { isAuthConfigured } from "@/lib/auth/env";
import { readJSON, writeJSON } from "@/lib/auth/storage";

import {
  cancelMyBooking,
  getBookingMode,
  listMyBookings,
  requestBooking,
  type BookingFailure,
  type BookingMode,
} from "./actions";
import { bookingHref, type BookingView } from "./links";
import { toISODate } from "./pricing";

export type { BookingMode };

const BOOKINGS_KEY = "mt.bookings.v1";

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeToBookings(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** A refused or failed request. `message` is safe to show the traveller. */
export class BookingError extends Error {
  constructor(
    message: string,
    readonly reason: BookingFailure["reason"],
  ) {
    super(message);
  }
}

/* ----------------------------------- Mode ----------------------------------- */

/**
 * The mode `next.config.ts` fixed for this deployment at build time
 * (`NEXT_PUBLIC_BOOKING_MODE`: "account" with both Neon Auth and a usable
 * database, otherwise "browser"), or `null` on a build that predates the flag.
 * Read through the literal `process.env.NEXT_PUBLIC_BOOKING_MODE` so Next.js
 * inlines it into the bundle; any other value is ignored rather than trusted.
 */
const BUILD_MODE: BookingMode | null = (() => {
  const value = process.env.NEXT_PUBLIC_BOOKING_MODE;
  return value === "account" || value === "browser" ? value : null;
})();

/**
 * The mode as known without asking the server: the build-time flag, or
 * "browser" when this build has no Neon Auth (nothing could be on an
 * account), or `null` when only the server can say.
 */
function knownMode(): BookingMode | null {
  if (!isAuthConfigured) return "browser";
  return BUILD_MODE;
}

let modePromise: Promise<BookingMode> | null = null;

/**
 * Where this deployment keeps requests. Known at build time on current builds,
 * so this resolves without a request; only a build without
 * `NEXT_PUBLIC_BOOKING_MODE` asks the `getBookingMode` Server Action, once per
 * page load.
 */
export function resolveBookingMode(): Promise<BookingMode> {
  if (modePromise) return modePromise;
  const known = knownMode();
  if (known) return Promise.resolve(known);
  modePromise = getBookingMode().catch(() => {
    modePromise = null;
    // Never quietly fall back to the browser on a deployment with sign-in: a
    // request the traveller thinks is on their account would be lost.
    return "account" as const;
  });
  return modePromise;
}

function settleMode(mode: BookingMode) {
  modePromise = Promise.resolve(mode);
}

/**
 * The booking mode, or `null` while it is being looked up. Synchronous (no
 * effect, no request) whenever the build carries the flag, which also means
 * the first render already shows the right copy.
 */
export function useBookingMode(): BookingMode | null {
  const [mode, setMode] = useState<BookingMode | null>(knownMode);
  useEffect(() => {
    if (mode) return;
    let alive = true;
    void resolveBookingMode().then((next) => {
      if (alive) setMode(next);
    });
    return () => {
      alive = false;
    };
  }, [mode]);
  return mode;
}

/* ------------------------------ Browser storage ----------------------------- */

function readAll(): Booking[] {
  return readJSON<Booking[]>(BOOKINGS_KEY, []);
}

function writeAll(rows: Booking[]) {
  writeJSON(BOOKINGS_KEY, rows);
  emit();
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `bk-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

// Browser rows keep the listing slug in `refId`.
const withLink = (b: Booking): BookingView => ({ ...b, href: bookingHref(b.kind, b.refId) });

/* ----------------------------------- API ------------------------------------ */

export interface CreateBookingInput {
  kind: BookingKind;
  /** The listing's slug. */
  slug: string;
  startDate: string;
  endDate?: string;
  guests: number;
  note?: string;
  /**
   * Browser mode only. In account mode the server reads the session, looks the
   * title up and prices the request itself, and ignores these.
   */
  userId: string;
  refTitle: string;
  totalPrice: number;
}

export interface CreatedBooking {
  booking: BookingView;
  savedTo: BookingMode;
}

function createLocal(input: CreateBookingInput): CreatedBooking {
  const booking: Booking = {
    id: newId(),
    kind: input.kind,
    refId: input.slug,
    refTitle: input.refTitle,
    userId: input.userId,
    startDate: input.startDate,
    endDate: input.endDate,
    guests: input.guests,
    totalPrice: input.totalPrice,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  writeAll([booking, ...readAll()]);
  return { booking: withLink(booking), savedTo: "browser" };
}

/** Save a booking request. Throws `BookingError` when it is refused. */
export async function createBooking(input: CreateBookingInput): Promise<CreatedBooking> {
  if ((await resolveBookingMode()) === "browser") return createLocal(input);

  const result = await requestBooking({
    kind: input.kind,
    slug: input.slug,
    startDate: input.startDate,
    endDate: input.endDate,
    guests: input.guests,
    note: input.note?.trim() || undefined,
  });
  if (!result.ok) {
    if (result.reason === "unavailable") {
      settleMode("browser");
      return createLocal(input);
    }
    throw new BookingError(result.error, result.reason);
  }
  emit();
  return { booking: result.booking, savedTo: "account" };
}

/** The traveller's bookings. `userId` is used in browser mode only. */
export async function getBookings(userId: string): Promise<BookingView[]> {
  if ((await resolveBookingMode()) === "account") {
    const result = await listMyBookings();
    if (result.ok) return result.bookings;
    if (result.reason !== "unavailable") throw new BookingError(result.error, result.reason);
    settleMode("browser");
  }

  if (!userId) return [];
  return readAll()
    .filter((b) => b.userId === userId)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .map(withLink);
}

/** Cancel a pending or confirmed booking. Throws `BookingError` when it is refused. */
export async function cancelBooking(id: string): Promise<void> {
  if ((await resolveBookingMode()) === "account") {
    const result = await cancelMyBooking(id);
    if (result.ok) {
      emit();
      return;
    }
    if (result.reason !== "unavailable") throw new BookingError(result.error, result.reason);
    settleMode("browser");
  }

  writeAll(
    readAll().map((b) =>
      b.id === id && (b.status === "pending" || b.status === "confirmed")
        ? { ...b, status: "cancelled" as const }
        : b,
    ),
  );
}

/**
 * Upcoming = not cancelled and ending today or later, by the traveller's own
 * calendar. Booking dates are date-only strings ("2026-10-05"), so they are
 * compared as strings against today's local date in the same format.
 * `new Date("2026-10-05")` would be UTC midnight, which west of UTC is the
 * evening before, and would file a stay ending today under "past".
 */
export function partitionBookings<T extends Booking>(rows: T[]) {
  const today = toISODate(new Date());
  const upcoming: T[] = [];
  const past: T[] = [];

  for (const b of rows) {
    const end = (b.endDate ?? b.startDate).slice(0, 10);
    if (b.status !== "cancelled" && end >= today) upcoming.push(b);
    else past.push(b);
  }

  upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate));
  past.sort((a, b) => b.startDate.localeCompare(a.startDate));
  return { upcoming, past };
}
