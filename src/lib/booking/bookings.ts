"use client";

/**
 * Booking persistence.
 *
 * Mock-backed today (localStorage), with async signatures ready for the
 * database. Moving to `public.bookings` means Server Actions that resolve the
 * user from the session (see `src/lib/auth/profile.ts`) — nothing at the call
 * sites changes.
 */

import type { Booking, BookingKind, BookingStatus } from "@/types";

import { readJSON, writeJSON } from "@/lib/auth/storage";

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

export interface CreateBookingInput {
  kind: BookingKind;
  refId: string;
  refTitle: string;
  userId: string;
  startDate: string;
  endDate?: string;
  guests: number;
  totalPrice: number;
}

export async function getBookings(userId: string): Promise<Booking[]> {
  if (!userId) return [];
  return readAll()
    .filter((b) => b.userId === userId)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const booking: Booking = {
    ...input,
    id: newId(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  writeAll([booking, ...readAll()]);
  return booking;
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
): Promise<Booking | null> {
  const rows = readAll();
  const next = rows.map((b) => (b.id === id ? { ...b, status } : b));
  writeAll(next);
  return next.find((b) => b.id === id) ?? null;
}

export async function cancelBooking(id: string): Promise<Booking | null> {
  return updateBookingStatus(id, "cancelled");
}

/** Upcoming = not cancelled and ending today or later. */
export function partitionBookings(rows: Booking[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming: Booking[] = [];
  const past: Booking[] = [];

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
