"use server";

/**
 * Booking requests in `public.bookings`.
 *
 * These are Server Actions, i.e. public POST endpoints. Each one resolves the
 * traveller from the session cookie and never reads a user id, title, price or
 * status from the caller: the listing is looked up by slug and priced from its
 * database row (`./server`). There is no row-level security behind the
 * queries, so the `user_id` in every WHERE is the only thing keeping one
 * traveller out of another's bookings.
 *
 * With no database or no Neon Auth on the deployment these answer
 * `unavailable`, and `./bookings` keeps requests in the browser instead.
 */

import { and, count, desc, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import { ensureProfile } from "@/lib/auth/dal";
import { isAuthConfigured } from "@/lib/auth/env";
import { getServerUser } from "@/lib/auth/server";
import { getDb, schema } from "@/lib/db";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";

import type { BookingView } from "./links";
import { bookingRequestSchema } from "./schemas";
import { BookingRejected, listingLinks, priceBookingRequest, toBookingView } from "./server";

export type BookingMode = "account" | "browser";

export type BookingFailure = {
  ok: false;
  reason: "unavailable" | "signed-out" | "invalid" | "rate-limited" | "failed";
  error: string;
};

export type RequestBookingResult = { ok: true; booking: BookingView } | BookingFailure;
export type ListBookingsResult = { ok: true; bookings: BookingView[] } | BookingFailure;
export type CancelBookingResult = { ok: true } | BookingFailure;

const CREATE_RATE = { limit: 10, windowMs: 10 * 60_000 };
const CREATE_RATE_DAILY = { limit: 30, windowMs: 24 * 60 * 60_000 };
const CANCEL_RATE = { limit: 20, windowMs: 10 * 60_000 };
const MAX_LISTED = 200;
/**
 * Most requests one account may have waiting for a host at once. The rate
 * limits above are per instance and reset; this is a lifetime cap on open
 * rows, so no account can pile up an unbounded number of them. Real trips
 * come nowhere near it, and cancelling one (or a host answering) frees room.
 */
const MAX_PENDING = 20;

const UNAVAILABLE: BookingFailure = {
  ok: false,
  reason: "unavailable",
  error: "Online booking requests are not available on this site.",
};
const SIGNED_OUT: BookingFailure = {
  ok: false,
  reason: "signed-out",
  error: "Sign in to request a booking.",
};
const RATE_LIMITED: BookingFailure = {
  ok: false,
  reason: "rate-limited",
  error: "You have sent several requests already. Try again later.",
};

function failed(error: string): BookingFailure {
  return { ok: false, reason: "failed", error };
}

/**
 * Log a failed query without its contents. Drizzle's error message embeds the
 * SQL parameters, which here include the traveller's free-text note, so the
 * raw error never reaches the logs: only the scope, the Postgres error code
 * (from the error or its `cause`, where Drizzle puts the driver error) and
 * the error class.
 */
function logFailure(scope: string, err: unknown) {
  let code: string | undefined;
  for (let e = err as { code?: unknown; cause?: unknown } | undefined, depth = 0; e && depth < 5; depth += 1) {
    if (typeof e.code === "string") {
      code = e.code;
      break;
    }
    e = e.cause as typeof e;
  }
  const kind = err instanceof Error ? err.name : typeof err;
  console.error(`[bookings] ${scope} failed`, { pgCode: code ?? null, kind });
}

function online() {
  return isAuthConfigured ? getDb() : null;
}

/**
 * Where this deployment keeps booking requests. Reveals nothing beyond that.
 * Only a client built before `NEXT_PUBLIC_BOOKING_MODE` existed still asks;
 * current builds read the same answer from the bundle (`./bookings`).
 */
export async function getBookingMode(): Promise<BookingMode> {
  return online() ? "account" : "browser";
}

/** Save a booking request for the signed-in traveller, priced on the server, as `pending`. */
export async function requestBooking(input: unknown): Promise<RequestBookingResult> {
  const db = online();
  if (!db) return UNAVAILABLE;

  const user = await getServerUser();
  if (!user) return SIGNED_OUT;

  const ip = clientIp(await headers());
  const limits = [
    rateLimit("booking", ip, CREATE_RATE),
    rateLimit("booking-day", user.id, CREATE_RATE_DAILY),
  ];
  if (limits.some((l) => !l.ok)) return RATE_LIMITED;

  const parsed = bookingRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid",
      error: parsed.error.issues[0]?.message ?? "Some of the details need another look.",
    };
  }

  try {
    const [{ open }] = await db
      .select({ open: count() })
      .from(schema.bookings)
      .where(and(eq(schema.bookings.user_id, user.id), eq(schema.bookings.status, "pending")));
    if (open >= MAX_PENDING) {
      return {
        ok: false,
        reason: "rate-limited",
        error: `You already have ${MAX_PENDING} requests waiting for a reply. Cancel one you no longer need, or wait for a host to answer, then try again.`,
      };
    }

    const priced = await priceBookingRequest(db, parsed.data);
    // `bookings.user_id` references `profiles`, which is created on first read.
    await ensureProfile(user);
    const [row] = await db
      .insert(schema.bookings)
      .values({
        user_id: user.id,
        kind: priced.kind,
        ref_id: priced.refId,
        ref_title: priced.refTitle,
        start_date: priced.startDate,
        end_date: priced.endDate,
        guests: priced.guests,
        total_price: priced.totalPrice,
        status: "pending",
        notes: parsed.data.note || null,
      })
      .returning();
    const links = await listingLinks(db, [row]);
    return { ok: true, booking: toBookingView(row, links.get(row.id)) };
  } catch (err) {
    if (err instanceof BookingRejected) return { ok: false, reason: "invalid", error: err.message };
    logFailure("create", err);
    return failed("We could not save that request. Try again in a moment.");
  }
}

/** The signed-in traveller's bookings, latest trip first. Empty when signed out. */
export async function listMyBookings(): Promise<ListBookingsResult> {
  const db = online();
  if (!db) return UNAVAILABLE;

  const user = await getServerUser();
  if (!user) return { ok: true, bookings: [] };

  try {
    const rows = await db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.user_id, user.id))
      .orderBy(desc(schema.bookings.start_date), desc(schema.bookings.created_at))
      .limit(MAX_LISTED);
    const links = await listingLinks(db, rows);
    return { ok: true, bookings: rows.map((row) => toBookingView(row, links.get(row.id))) };
  } catch (err) {
    logFailure("list", err);
    return failed("We could not load your bookings. Try again in a moment.");
  }
}

const bookingId = z.uuid();

/** Cancel one of the signed-in traveller's own bookings while it is still pending or confirmed. */
export async function cancelMyBooking(id: unknown): Promise<CancelBookingResult> {
  const db = online();
  if (!db) return UNAVAILABLE;

  const user = await getServerUser();
  if (!user) return SIGNED_OUT;

  if (!rateLimit("booking-cancel", clientIp(await headers()), CANCEL_RATE).ok) return RATE_LIMITED;

  const parsed = bookingId.safeParse(id);
  if (!parsed.success) return failed("That booking could not be cancelled.");

  try {
    const [row] = await db
      .update(schema.bookings)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(schema.bookings.id, parsed.data),
          eq(schema.bookings.user_id, user.id),
          inArray(schema.bookings.status, ["pending", "confirmed"]),
        ),
      )
      .returning({ id: schema.bookings.id });
    return row ? { ok: true } : failed("That booking could not be cancelled.");
  } catch (err) {
    logFailure("cancel", err);
    return failed("That booking could not be cancelled. Try again in a moment.");
  }
}
