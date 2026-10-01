import type { Metadata } from "next";

import { BookingsTable } from "@/components/admin/bookings-table";
import { AdminUnavailable } from "@/components/admin/unavailable";
import { ADMIN_BOOKINGS_LIMIT, getAdminBookings } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/host/role";

export const metadata: Metadata = {
  title: "Bookings",
  description:
    "The Discover Manipur booking ledger: homestays, experiences, tours, transport and table reservations across Manipur.",
};

export default async function AdminBookingsPage() {
  await requireAdmin("/admin/bookings");
  const bookings = await getAdminBookings();

  return (
    <section aria-labelledby="bookings-heading">
      <h2 id="bookings-heading" className="font-display text-2xl">
        Bookings
      </h2>
      <p className="mb-6 mt-2 max-w-2xl text-sm text-muted-foreground">
        Every booking made through Discover Manipur, newest travel dates first. Cancelled bookings
        are kept on the ledger but excluded from booked value.
        {bookings && bookings.length >= ADMIN_BOOKINGS_LIMIT && (
          <> Showing the {ADMIN_BOOKINGS_LIMIT.toLocaleString("en-IN")} latest travel dates.</>
        )}
      </p>
      {bookings ? <BookingsTable initial={bookings} /> : <AdminUnavailable what="Bookings" />}
    </section>
  );
}
