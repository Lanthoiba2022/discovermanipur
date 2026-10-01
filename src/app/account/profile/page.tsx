import type { Metadata } from "next";

import { ProfilePanel } from "../_components/profile-panel";

export const metadata: Metadata = {
  title: "Profile",
  description: "Edit your name, phone number and avatar on Discover Manipur.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ProfilePanel />;
}
