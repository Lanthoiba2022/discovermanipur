import type { Metadata } from "next";

import { ApplicationsTable } from "@/components/admin/applications-table";
import { listApplications, type ApplicationQueueRow } from "@/lib/host/applications";
import { requireAdmin } from "@/lib/host/role";

export const metadata: Metadata = {
  title: "Host applications",
  description:
    "Review, approve or reject applications from Manipuri homestay hosts, cooks, guides and experience makers.",
};

export default async function AdminApplicationsPage() {
  await requireAdmin("/admin/applications");

  let rows: ApplicationQueueRow[] = [];
  let failed = false;
  try {
    rows = await listApplications();
  } catch (err) {
    console.error("[admin] applications read failed:", (err as Error).message);
    failed = true;
  }

  return (
    <section aria-labelledby="applications-heading">
      <h2 id="applications-heading" className="font-display text-2xl">
        Applications queue
      </h2>
      <p className="mb-6 mt-2 max-w-2xl text-sm text-muted-foreground">
        Approve only once the address and any permit or hygiene certificate check out — photos are
        not uploaded with applications yet, so ask the applicant for them. Approving gives a
        traveller account the host role. A rejection needs a reason: the applicant sees it on their
        application page.
      </p>
      {failed ? (
        <p role="alert" className="rounded-[var(--radius)] bg-destructive/10 p-4 text-sm text-destructive">
          The applications could not be loaded. Refresh to try again.
        </p>
      ) : (
        <ApplicationsTable rows={rows} />
      )}
    </section>
  );
}
