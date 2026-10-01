import type { Metadata } from "next";

import { BookingsTable } from "@/components/admin/bookings-table";
import { adminBookings } from "@/lib/host/mock-data";
import { requireAdmin } from "@/lib/host/role";

export const metadata: Metadata = {
  title: "Bookings",
  description:
    "The Discover Manipur booking ledger: homestays, experiences, tours, transport and table reservations across Manipur.",
};

export default async function AdminBookingsPage() {
  await requireAdmin("/admin/bookings");
  return (
    <section aria-labelledby="bookings-heading">
      <h2 id="bookings-heading" className="font-display text-2xl">
        Bookings
      </h2>
      <p className="mb-6 mt-2 max-w-2xl text-sm text-muted-foreground">
        Every booking made through Discover Manipur, newest travel dates first. Cancelled bookings are kept on
        the ledger but excluded from booked value.
      </p>
      <BookingsTable initial={adminBookings} />
    </section>
  );
}
