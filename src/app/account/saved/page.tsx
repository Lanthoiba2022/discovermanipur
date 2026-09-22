import type { Metadata } from "next";

import { SavedPanel } from "../_components/saved-panel";

export const metadata: Metadata = {
  title: "Saved",
  description: "Homestays and places you have saved on Manipur Tourism.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SavedPanel />;
}
