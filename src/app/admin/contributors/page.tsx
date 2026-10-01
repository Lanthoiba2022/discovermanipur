import type { Metadata } from "next";

import { CommunityContributorsTable } from "@/components/admin/community-contributors-table";
import { AdminUnavailable } from "@/components/admin/unavailable";
import { adminListContributors } from "@/lib/community/queries";
import { requireAdmin } from "@/lib/host/role";

export const metadata: Metadata = {
  title: "Community contributors",
  description:
    "Everyone who has listed a community place or uploaded a photo to Discover Manipur, with what they contributed.",
};

export default async function AdminContributorsPage() {
  await requireAdmin("/admin/contributors");
  const rows = await adminListContributors();

  return (
    <section aria-labelledby="contributors-heading">
      <h2 id="contributors-heading" className="font-display text-2xl">
        Contributors
      </h2>
      <p className="mb-6 mt-2 max-w-3xl text-sm text-muted-foreground">
        Everyone who has listed a community place or uploaded a photo, most active first. Only
        accounts with a verified email address that are not banned can list places or vote. Photo
        counts leave out photos an admin has removed. Open a person&rsquo;s places or photos to
        review everything they have added.
      </p>
      {rows ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {rows.length === 1 ? "1 contributor" : `${rows.length.toLocaleString("en-IN")} contributors`}
            {rows.length >= 1000 && ", the 1,000 most active"}
          </p>
          <CommunityContributorsTable rows={rows} />
        </>
      ) : (
        <AdminUnavailable what="Contributors" />
      )}
    </section>
  );
}
