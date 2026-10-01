import type { Metadata } from "next";

import { ApplicationsTable } from "@/components/admin/applications-table";
import { hostApplications } from "@/lib/host/mock-data";
import { requireAdmin } from "@/lib/host/role";

export const metadata: Metadata = {
  title: "Host applications",
  description:
    "Review, approve or reject applications from Manipuri homestay hosts, cooks, guides and experience makers.",
};

export default async function AdminApplicationsPage() {
  await requireAdmin("/admin/applications");
  return (
    <section aria-labelledby="applications-heading">
      <h2 id="applications-heading" className="font-display text-2xl">
        Applications queue
      </h2>
      <p className="mb-6 mt-2 max-w-2xl text-sm text-muted-foreground">
        Every application is read by a person. Approve only once the address, photos and any permit
        or hygiene certificate check out; a rejection must carry a reason the applicant can act on.
      </p>
      <ApplicationsTable initial={hostApplications} />
    </section>
  );
}
