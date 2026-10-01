import type { Metadata } from "next";

import { ListingsTable, type ModerationRow } from "@/components/admin/listings-table";
import { getExperiences, getHomestays } from "@/lib/data";
import { requireAdmin } from "@/lib/host/role";

export const metadata: Metadata = {
  title: "Listing moderation",
  description:
    "Feature, unfeature, activate or deactivate the homestays and experiences published on Discover Manipur.",
};

export default async function AdminListingsPage() {
  await requireAdmin("/admin/listings");
  const [homestays, experiences] = await Promise.all([getHomestays(), getExperiences()]);

  const rows: ModerationRow[] = [
    ...homestays.map((h) => ({
      id: h.id,
      title: h.title,
      kind: "Homestay" as const,
      district: h.district,
      location: h.location,
      price: h.pricePerNight,
      rating: h.rating,
      featured: h.featured,
      isActive: h.isActive,
    })),
    ...experiences.map((e) => ({
      id: e.id,
      title: e.title,
      kind: "Experience" as const,
      district: e.district,
      location: e.location,
      price: e.pricePerPerson,
      rating: e.rating,
      featured: e.featured,
      isActive: true,
    })),
  ];

  return (
    <section aria-labelledby="listings-heading">
      <h2 id="listings-heading" className="font-display text-2xl">
        Listings
      </h2>
      <p className="mb-6 mt-2 max-w-2xl text-sm text-muted-foreground">
        Featuring puts a listing on the home page and at the top of search. Deactivating hides it
        from travellers without deleting anything the host has written.
      </p>
      <ListingsTable initial={rows} />
    </section>
  );
}
