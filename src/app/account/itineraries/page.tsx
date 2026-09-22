import type { Metadata } from "next";

import { ItinerariesPanel } from "@/components/itineraries/itineraries-panel";

export const metadata: Metadata = {
  title: "Itineraries",
  description: "The Manipur trip plans you saved from the Manipur Tourism concierge.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ItinerariesPanel />;
}
