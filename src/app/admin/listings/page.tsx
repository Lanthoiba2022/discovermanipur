import type { Metadata } from "next";

import { ListingsTable } from "@/components/admin/listings-table";
import { AdminUnavailable } from "@/components/admin/unavailable";
import { getModerationRows } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/host/role";

export const metadata: Metadata = {
  title: "Listing moderation",
  description:
    "Feature, unfeature, activate or deactivate the homestays and experiences published on Discover Manipur.",
};

export default async function AdminListingsPage() {
  await requireAdmin("/admin/listings");
  const rows = await getModerationRows();

  return (
    <section aria-labelledby="listings-heading">
      <h2 id="listings-heading" className="font-display text-2xl">
        Listings
      </h2>
      <p className="mb-6 mt-2 max-w-2xl text-sm text-muted-foreground">
        Featuring a listing moves it up the default &ldquo;Featured first&rdquo; order on its
        listings page; a featured experience also appears on the home page with an Editor&rsquo;s
        pick badge. Deactivating a homestay hides it from the site without deleting anything the
        host has written. Experiences have no visibility switch.
      </p>
      {rows ? <ListingsTable initial={rows} /> : <AdminUnavailable what="Listings" />}
    </section>
  );
}
