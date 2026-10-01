import type { Metadata } from "next";

import { BookingsPanel } from "../_components/bookings-panel";

export const metadata: Metadata = {
  title: "Bookings",
  description: "Your upcoming and past Manipur stays booked through Discover Manipur.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <BookingsPanel />;
}
