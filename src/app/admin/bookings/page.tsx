import type { Metadata } from "next";

import { BookingsTable } from "@/components/admin/bookings-table";
import { adminBookings } from "@/lib/host/mock-data";

export const metadata: Metadata = {
  title: "Bookings",
  description:
    "The Manipur Tourism booking ledger: homestays, experiences, tours, transport and table reservations across Manipur.",
};

export default function AdminBookingsPage() {
  return (
    <section aria-labelledby="bookings-heading">
      <h2 id="bookings-heading" className="font-display text-2xl">
        Bookings
      </h2>
      <p className="mb-6 mt-2 max-w-2xl text-sm text-muted-foreground">
        Every booking made through Manipur Tourism, newest travel dates first. Cancelled bookings are kept on
        the ledger but excluded from booked value.
      </p>
      <BookingsTable initial={adminBookings} />
    </section>
  );
}
