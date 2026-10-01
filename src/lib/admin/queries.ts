/**
 * Reads for the admin pages. Server-only: it imports the database client.
 *
 * Unlike the public catalogue loaders, nothing here falls back to seed data:
 * an operations view showing invented rows is worse than one saying it has
 * none. Each function returns `null` when there is no database or the query
 * fails, and the page shows that state.
 *
 * The connection is the table owner, so these see every row, including
 * deactivated homestays. They must only ever be called behind `requireAdmin`.
 */

import { and, asc, count, desc, eq, sql, type SQLWrapper } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

import type { BookingKind, HostType, UserRole } from "@/types";

import { getDb, schema } from "@/lib/db";

import { ADMIN_TIME_ZONE, fillMonths, recentMonths, windowLabel } from "./months";
import type { AdminBookingRow, AdminOverview, ApplicationStatus, ModerationRow } from "./types";

const { bookings, eateries, experiences, homestays, host_applications, profiles, tours, transport_options } = schema;

// The zone is inlined, not bound: Postgres matches a GROUP BY expression to
// the SELECT list textually, and two `$n` parameters never count as equal.
const ZONE = sql.raw(`'${ADMIN_TIME_ZONE}'`);
const monthOf = (column: SQLWrapper) => sql<string>`to_char(${column} at time zone ${ZONE}, 'YYYY-MM')`;

function tally<K extends string>(keys: readonly K[], rows: { key: K; value: number }[]) {
  const out = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
  for (const row of rows) out[row.key] += row.value;
  return out;
}

const APPLICATION_STATUSES = ["pending", "approved", "rejected"] as const satisfies readonly ApplicationStatus[];
const HOST_TYPES = ["homestay", "eatery", "guide", "experience"] as const satisfies readonly HostType[];
const ROLES = ["user", "host", "admin"] as const satisfies readonly UserRole[];

export async function getAdminOverview(now = new Date()): Promise<AdminOverview | null> {
  const db = getDb();
  if (!db) return null;

  const months = recentMonths(now);
  const firstMonth = months[0].key;
  const thisMonth = months[months.length - 1].key;

  try {
    const [homestayRows, [experienceRow], applicationRows, applicationMonths, [bookingRow], bookingMonths, roleRows, [joinedRow]] =
      await Promise.all([
        db
          .select({ isActive: homestays.is_active, value: count() })
          .from(homestays)
          .groupBy(homestays.is_active),
        db.select({ value: count() }).from(experiences),
        db
          .select({ status: host_applications.status, hostType: host_applications.host_type, value: count() })
          .from(host_applications)
          .groupBy(host_applications.status, host_applications.host_type),
        db
          .select({ month: monthOf(host_applications.created_at), value: count() })
          .from(host_applications)
          .where(sql`${monthOf(host_applications.created_at)} >= ${firstMonth}`)
          .groupBy(monthOf(host_applications.created_at)),
        db
          .select({
            value: count(),
            bookedValue: sql<number>`coalesce(sum(${bookings.total_price}) filter (where ${bookings.status} <> 'cancelled'), 0)`.mapWith(Number),
          })
          .from(bookings),
        db
          .select({ month: monthOf(bookings.created_at), value: count() })
          .from(bookings)
          .where(and(sql`${bookings.status} <> 'cancelled'`, sql`${monthOf(bookings.created_at)} >= ${firstMonth}`))
          .groupBy(monthOf(bookings.created_at)),
        db.select({ role: profiles.role, value: count() }).from(profiles).groupBy(profiles.role),
        db
          .select({ value: count() })
          .from(profiles)
          .where(sql`${monthOf(profiles.created_at)} = ${thisMonth}`),
      ]);

    const byStatus = tally(
      APPLICATION_STATUSES,
      applicationRows.map((r) => ({ key: r.status, value: r.value })),
    );
    const byRole = tally(ROLES, roleRows.map((r) => ({ key: r.role, value: r.value })));

    return {
      listings: {
        activeHomestays: homestayRows.find((r) => r.isActive)?.value ?? 0,
        inactiveHomestays: homestayRows.find((r) => !r.isActive)?.value ?? 0,
        experiences: experienceRow?.value ?? 0,
      },
      applications: {
        total: APPLICATION_STATUSES.reduce((sum, s) => sum + byStatus[s], 0),
        byStatus,
        byHostType: tally(HOST_TYPES, applicationRows.map((r) => ({ key: r.hostType, value: r.value }))),
        byMonth: fillMonths(months, applicationMonths),
      },
      bookings: {
        total: bookingRow?.value ?? 0,
        bookedValue: bookingRow?.bookedValue ?? 0,
        byMonth: fillMonths(months, bookingMonths),
      },
      accounts: {
        total: ROLES.reduce((sum, r) => sum + byRole[r], 0),
        byRole,
        joinedThisMonth: joinedRow?.value ?? 0,
      },
      windowLabel: windowLabel(months),
    };
  } catch (err) {
    console.error("[admin] overview query failed:", err);
    return null;
  }
}

/** Generous for the ledger's size today; the page says when it is reached. */
export const ADMIN_BOOKINGS_LIMIT = 1000;

const refIs = (kind: BookingKind, id: AnyPgColumn) =>
  and(eq(bookings.kind, kind), eq(id, bookings.ref_id));

export async function getAdminBookings(): Promise<AdminBookingRow[] | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const rows = await db
      .select({
        id: bookings.id,
        kind: bookings.kind,
        storedTitle: bookings.ref_title,
        // The booking keeps a copy of the title at booking time; prefer the
        // listing's current one, which is what the admin will search for.
        liveTitle: sql<string | null>`coalesce(${homestays.title}, ${experiences.title}, ${tours.title}, ${transport_options.name}, ${eateries.name})`,
        firstName: profiles.first_name,
        lastName: profiles.last_name,
        email: profiles.email,
        startDate: bookings.start_date,
        endDate: bookings.end_date,
        guests: bookings.guests,
        totalPrice: bookings.total_price,
        status: bookings.status,
      })
      .from(bookings)
      .leftJoin(profiles, eq(profiles.id, bookings.user_id))
      .leftJoin(homestays, refIs("homestay", homestays.id))
      .leftJoin(experiences, refIs("experience", experiences.id))
      .leftJoin(tours, refIs("tour", tours.id))
      .leftJoin(transport_options, refIs("transport", transport_options.id))
      .leftJoin(eateries, refIs("table", eateries.id))
      .orderBy(desc(bookings.start_date), desc(bookings.created_at))
      .limit(ADMIN_BOOKINGS_LIMIT);

    return rows.map((r) => {
      const email = r.email ?? "";
      const name = [r.firstName, r.lastName].filter(Boolean).join(" ");
      return {
        id: r.id,
        kind: r.kind,
        title: r.liveTitle ?? r.storedTitle,
        listingMissing: r.liveTitle == null,
        guestName: name || email.split("@")[0] || "Unknown traveller",
        guestEmail: email,
        startDate: r.startDate,
        endDate: r.endDate,
        guests: r.guests,
        totalPrice: r.totalPrice,
        status: r.status,
      };
    });
  } catch (err) {
    console.error("[admin] bookings query failed:", err);
    return null;
  }
}

/** Every homestay and experience, including deactivated homestays. */
export async function getModerationRows(): Promise<ModerationRow[] | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const [homestayRows, experienceRows] = await Promise.all([
      db
        .select({
          id: homestays.id,
          title: homestays.title,
          district: homestays.district,
          location: homestays.location,
          price: homestays.price_per_night,
          rating: homestays.rating,
          featured: homestays.featured,
          isActive: homestays.is_active,
        })
        .from(homestays)
        .orderBy(asc(homestays.title)),
      db
        .select({
          id: experiences.id,
          title: experiences.title,
          district: experiences.district,
          location: experiences.location,
          price: experiences.price_per_person,
          rating: experiences.rating,
          featured: experiences.featured,
        })
        .from(experiences)
        .orderBy(asc(experiences.title)),
    ]);

    return [
      ...homestayRows.map((r) => ({ ...r, kind: "homestay" as const, canToggleActive: true })),
      ...experienceRows.map((r) => ({ ...r, kind: "experience" as const, isActive: true, canToggleActive: false })),
    ].map((r) => ({ ...r, rating: Number(r.rating) }));
  } catch (err) {
    console.error("[admin] listings query failed:", err);
    return null;
  }
}
