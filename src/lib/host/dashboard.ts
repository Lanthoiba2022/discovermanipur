/**
 * Reads for the host dashboard: the signed-in host's own listings, the bookings
 * on them and their latest application.
 *
 * Not a `"use server"` module: every export of one is a public endpoint, and
 * these take a host id. Callers pass the id from `requireHost`, never one from
 * the browser. There is no row-level security behind these queries, so the
 * `host_id` / `user_id` filters below are the only thing keeping one host out
 * of another's rows.
 */

import { and, asc, desc, eq, gte, inArray, or, type SQL } from "drizzle-orm";

import type { MediaImage } from "@/types";

import { getDb, schema } from "@/lib/db";

import type {
  HostDashboardApplication,
  HostDashboardBooking,
  HostDashboardData,
  HostDashboardListing,
  HostDashboardStats,
  HostListingKind,
  MonthPoint,
} from "./types";

/** Months shown in the booking-value chart, the current one included. */
export const CHART_MONTHS = 6;
const UPCOMING_LIMIT = 50;

/** Statuses that still bring a guest. */
const ACTIVE_STATUSES = ["pending", "confirmed"] as const;
/** Statuses that count towards booking value: agreed, not merely requested. */
const VALUE_STATUSES = new Set(["confirmed", "completed"]);

/* ---------------------------------------------------------- pure helpers -- */

/** `YYYY-MM-DD` for `now` in India, where every listing and host is. */
export function todayInIndia(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** The last `count` months ending with the one `today` falls in, oldest first. */
export function monthWindow(today: string, count = CHART_MONTHS): { key: string; label: string }[] {
  const [year, month] = today.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1 - (count - 1 - i), 1));
    return {
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
    };
  });
}

export function nightsBetween(start: string, end: string | null): number | null {
  if (!end) return null;
  const ms = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  const nights = Math.round(ms / 86_400_000);
  return Number.isFinite(nights) && nights > 0 ? nights : null;
}

/**
 * Only files under `/file-uploads/` without a query: `next/image` throws on any
 * local path outside `images.localPatterns`, and Places photos would need a
 * credit overlay a 48px thumbnail has no room for.
 */
function firstSelfHostedImage(images: unknown, title: string): HostDashboardListing["image"] {
  if (!Array.isArray(images)) return null;
  const image = (images as Partial<MediaImage>[]).find(
    (i) => typeof i?.src === "string" && i.src.startsWith("/file-uploads/") && !i.src.includes("?"),
  );
  return image?.src ? { src: image.src, alt: image.alt || title } : null;
}

interface BookingFact {
  startDate: string;
  totalPrice: number;
  status: string;
}

/** Booking value per arrival month, for confirmed and completed bookings. */
export function bookingValueByMonth(bookings: BookingFact[], today: string): MonthPoint[] {
  const months = monthWindow(today);
  const totals = new Map(months.map((m) => [m.key, 0]));
  for (const b of bookings) {
    if (!VALUE_STATUSES.has(b.status)) continue;
    const key = b.startDate.slice(0, 7);
    if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + b.totalPrice);
  }
  return months.map((m) => ({ label: m.label, value: totals.get(m.key) ?? 0 }));
}

export function computeStats(
  listings: HostDashboardListing[],
  upcoming: HostDashboardBooking[],
  byMonth: MonthPoint[],
): HostDashboardStats {
  const reviewCount = listings.reduce((s, l) => s + l.reviewCount, 0);
  const weighted = listings.reduce((s, l) => s + l.rating * l.reviewCount, 0);
  return {
    upcomingCount: upcoming.length,
    guestsExpected: upcoming.reduce((s, b) => s + b.guests, 0),
    liveListings: listings.filter((l) => l.isActive).length,
    totalListings: listings.length,
    rating: reviewCount > 0 ? weighted / reviewCount : null,
    reviewCount,
    bookedThisMonth: byMonth.at(-1)?.value ?? 0,
    bookedLastMonth: byMonth.at(-2)?.value ?? 0,
  };
}

export function emptyDashboard(state: HostDashboardData["state"]): HostDashboardData {
  const byMonth = bookingValueByMonth([], todayInIndia());
  return {
    state,
    listings: [],
    upcoming: [],
    byMonth,
    stats: computeStats([], [], byMonth),
    application: null,
  };
}

/* --------------------------------------------------------------- queries -- */

/**
 * The dashboard for `hostId`, which must be the session user's id. Never
 * throws: a missing database or a failed read comes back as `state`.
 */
export async function getHostDashboard(hostId: string): Promise<HostDashboardData> {
  const db = getDb();
  if (!db) return emptyDashboard("no-database");

  try {
    const [homestays, experiences, applications] = await Promise.all([
      db
        .select({
          id: schema.homestays.id,
          slug: schema.homestays.slug,
          title: schema.homestays.title,
          location: schema.homestays.location,
          district: schema.homestays.district,
          price: schema.homestays.price_per_night,
          isActive: schema.homestays.is_active,
          featured: schema.homestays.featured,
          rating: schema.homestays.rating,
          reviewCount: schema.homestays.review_count,
          images: schema.homestays.images,
        })
        .from(schema.homestays)
        .where(eq(schema.homestays.host_id, hostId))
        .orderBy(asc(schema.homestays.title)),
      db
        .select({
          id: schema.experiences.id,
          slug: schema.experiences.slug,
          title: schema.experiences.title,
          location: schema.experiences.location,
          district: schema.experiences.district,
          price: schema.experiences.price_per_person,
          featured: schema.experiences.featured,
          rating: schema.experiences.rating,
          reviewCount: schema.experiences.review_count,
          images: schema.experiences.images,
        })
        .from(schema.experiences)
        .where(eq(schema.experiences.host_id, hostId))
        .orderBy(asc(schema.experiences.title)),
      db
        .select({
          id: schema.host_applications.id,
          hostType: schema.host_applications.host_type,
          propertyName: schema.host_applications.property_name,
          district: schema.host_applications.district,
          status: schema.host_applications.status,
          adminNotes: schema.host_applications.admin_notes,
          createdAt: schema.host_applications.created_at,
        })
        .from(schema.host_applications)
        .where(eq(schema.host_applications.user_id, hostId))
        .orderBy(desc(schema.host_applications.created_at))
        .limit(1),
    ]);

    const listings: HostDashboardListing[] = [
      ...homestays.map((h) => ({
        id: h.id,
        kind: "homestay" as const,
        slug: h.slug,
        title: h.title,
        location: h.location,
        district: h.district,
        price: h.price,
        isActive: h.isActive,
        featured: h.featured,
        canPause: true,
        rating: Number(h.rating),
        reviewCount: h.reviewCount,
        image: firstSelfHostedImage(h.images, h.title),
      })),
      ...experiences.map((e) => ({
        id: e.id,
        kind: "experience" as const,
        slug: e.slug,
        title: e.title,
        location: e.location,
        district: e.district,
        price: e.price,
        isActive: true,
        featured: e.featured,
        canPause: false,
        rating: Number(e.rating),
        reviewCount: e.reviewCount,
        image: firstSelfHostedImage(e.images, e.title),
      })),
    ];

    const today = todayInIndia();
    const { upcoming, byMonth } = await loadBookings(db, listings, today);
    const application: HostDashboardApplication | null = applications[0]
      ? { ...applications[0], adminNotes: applications[0].adminNotes ?? null }
      : null;

    return {
      state: "ok",
      listings,
      upcoming,
      byMonth,
      stats: computeStats(listings, upcoming, byMonth),
      application,
    };
  } catch (err) {
    console.error("[host-dashboard] read failed:", err);
    return emptyDashboard("error");
  }
}

/**
 * Bookings point at a listing by `kind` + `ref_id` (no foreign key), so they
 * are matched against the ids of listings already filtered to this host.
 */
async function loadBookings(
  db: NonNullable<ReturnType<typeof getDb>>,
  listings: HostDashboardListing[],
  today: string,
): Promise<{ upcoming: HostDashboardBooking[]; byMonth: MonthPoint[] }> {
  const idsOf = (kind: HostListingKind) => listings.filter((l) => l.kind === kind).map((l) => l.id);
  const owned: SQL[] = [];
  for (const kind of ["homestay", "experience"] as const) {
    const ids = idsOf(kind);
    if (ids.length) owned.push(and(eq(schema.bookings.kind, kind), inArray(schema.bookings.ref_id, ids))!);
  }
  if (owned.length === 0) return { upcoming: [], byMonth: bookingValueByMonth([], today) };

  const windowStart = `${monthWindow(today)[0].key}-01`;
  const b = schema.bookings;
  const rows = await db
    .select({
      id: b.id,
      kind: b.kind,
      refId: b.ref_id,
      refTitle: b.ref_title,
      startDate: b.start_date,
      endDate: b.end_date,
      guests: b.guests,
      totalPrice: b.total_price,
      status: b.status,
      guestFirstName: schema.profiles.first_name,
    })
    .from(b)
    .leftJoin(schema.profiles, eq(schema.profiles.id, b.user_id))
    .where(and(or(...owned), gte(b.start_date, windowStart)))
    .orderBy(asc(b.start_date));

  const titles = new Map(listings.map((l) => [`${l.kind}:${l.id}`, l.title]));
  const upcoming: HostDashboardBooking[] = rows
    .filter(
      (r) =>
        r.startDate >= today &&
        (ACTIVE_STATUSES as readonly string[]).includes(r.status),
    )
    .slice(0, UPCOMING_LIMIT)
    .map((r) => ({
      id: r.id,
      kind: r.kind as HostListingKind,
      listingTitle: titles.get(`${r.kind}:${r.refId}`) ?? r.refTitle,
      guestFirstName: r.guestFirstName?.trim() || null,
      startDate: r.startDate,
      endDate: r.endDate,
      nights: r.kind === "homestay" ? nightsBetween(r.startDate, r.endDate) : null,
      guests: r.guests,
      totalPrice: r.totalPrice,
      status: r.status,
    }));

  return { upcoming, byMonth: bookingValueByMonth(rows, today) };
}
