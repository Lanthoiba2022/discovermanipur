import type { Metadata } from "next";
import { KanglaExplorer } from "@/components/explore/kangla-explorer";

export const metadata: Metadata = {
  title: "Kangla 3D Map",
  description: "Explore Kangla Fort and its immediate surroundings in a tilted 3D satellite view from Google Maps, with the fort's landmarks pinned.",
  alternates: { canonical: "/explore/kangla" },
};
// The key is a browser-restricted Maps key: it is meant to ship to the client,
// and Google enforces it by HTTP referrer, so passing it as a prop is the
// intended use rather than a leak.
export default function KanglaMapPage() { return <KanglaExplorer googleKey={process.env.GOOGLE_API_KEY?.trim() || ""} />; }
