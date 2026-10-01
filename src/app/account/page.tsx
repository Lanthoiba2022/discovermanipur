import type { Metadata } from "next";

import { OverviewPanel } from "./_components/overview-panel";

export const metadata: Metadata = {
  title: "Account overview",
  description: "Your Discover Manipur dashboard — upcoming trips, saved places and profile at a glance.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <OverviewPanel />;
}
