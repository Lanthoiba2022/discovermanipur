import type { Metadata } from "next";
import { KanglaExplorer } from "@/components/explore/kangla-explorer";

export const metadata: Metadata = {
  title: "Kangla 3D Map",
  description: "Explore a MapTiler 3D map of Kangla and its immediate surroundings, with building footprints and terrain.",
  alternates: { canonical: "/explore/kangla" },
};
export default function KanglaMapPage() { return <KanglaExplorer mapTilerKey={process.env.MAP_TILER_API_KEY?.trim() || ""} />; }
