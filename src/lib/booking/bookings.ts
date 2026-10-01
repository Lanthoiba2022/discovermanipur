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

let modePromise: Promise<BookingMode> | null = null;

/** Where this deployment keeps requests. Asked of the server once per page load. */
export function resolveBookingMode(): Promise<BookingMode> {
  if (!isAuthConfigured) return Promise.resolve("browser");
  modePromise ??= getBookingMode().catch(() => {
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

/** The booking mode, or `null` while it is being looked up. */
export function useBookingMode(): BookingMode | null {
  const [mode, setMode] = useState<BookingMode | null>(isAuthConfigured ? null : "browser");
  useEffect(() => {
    let alive = true;
    void resolveBookingMode().then((next) => {
      if (alive) setMode(next);
    });
    return () => {
      alive = false;
    };
  }, []);
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

/** Upcoming = not cancelled and ending today or later. */
export function partitionBookings<T extends Booking>(rows: T[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming: T[] = [];
  const past: T[] = [];

  for (const b of rows) {
    const end = new Date(b.endDate ?? b.startDate);
    end.setHours(0, 0, 0, 0);
    if (b.status !== "cancelled" && end.getTime() >= today.getTime()) upcoming.push(b);
    else past.push(b);
  }

  upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate));
  past.sort((a, b) => b.startDate.localeCompare(a.startDate));
  return { upcoming, past };
}
