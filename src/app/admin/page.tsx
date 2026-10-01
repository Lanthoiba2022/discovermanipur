import { CalendarCheck, Home, Inbox, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CHART_SERIES, CHART_STATUS } from "@/components/admin/chart-colors";
import { ColumnChart } from "@/components/admin/column-chart";
import { StatTile } from "@/components/admin/stat-tile";
import { StatusBars } from "@/components/admin/status-bars";
import { AdminUnavailable } from "@/components/admin/unavailable";
import { Button } from "@/components/ui/button";
import { getAdminOverview } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/host/role";
import { HOST_TYPE_LABEL } from "@/lib/host/types";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin overview",
  description:
    "Discover Manipur operations overview: listings, pending host applications, bookings and travellers across Manipur.",
};

const n = (value: number) => value.toLocaleString("en-IN");
const plural = (value: number, one: string, many: string) => `${n(value)} ${value === 1 ? one : many}`;

export default async function AdminOverviewPage() {
  await requireAdmin("/admin");
  const overview = await getAdminOverview();

  if (!overview) {
    return (
      <>
        <h2 className="sr-only">Overview</h2>
        <AdminUnavailable what="The overview" />
      </>
    );
  }

  const { listings, applications, bookings, accounts, windowLabel } = overview;
  const published = listings.activeHomestays + listings.experiences;
  const pending = applications.byStatus.pending;

  const byHostType = (Object.keys(HOST_TYPE_LABEL) as (keyof typeof HOST_TYPE_LABEL)[]).map(
    (type, i) => ({
      label: HOST_TYPE_LABEL[type],
      value: applications.byHostType[type],
      color: CHART_SERIES[i % CHART_SERIES.length],
    }),
  );

  return (
    <>
      <h2 className="sr-only">Overview</h2>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Published listings"
          value={n(published)}
          hint={[
            `${plural(listings.activeHomestays, "homestay", "homestays")} · ${plural(listings.experiences, "experience", "experiences")}`,
            listings.inactiveHomestays > 0 ? `${n(listings.inactiveHomestays)} deactivated` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
          icon={Home}
        />
        <StatTile
          label="Pending applications"
          value={n(pending)}
          hint={pending === 0 ? "Nothing waiting for a decision" : "awaiting a decision"}
          icon={Inbox}
        />
        <StatTile
          label="Bookings on the ledger"
          value={n(bookings.total)}
          hint={`${formatINR(bookings.bookedValue)} booked value, excluding cancellations`}
          icon={CalendarCheck}
        />
        <StatTile
          label="Registered accounts"
          value={n(accounts.total)}
          hint={`${plural(accounts.byRole.user, "traveller", "travellers")} · ${plural(accounts.byRole.host, "host", "hosts")} · ${plural(accounts.byRole.admin, "admin", "admins")} · ${n(accounts.joinedThisMonth)} joined this month`}
          icon={Users}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section
          aria-labelledby="chart-bookings"
          className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 lg:col-span-3"
        >
          <h3 id="chart-bookings" className="font-display text-xl">
            Bookings made per month
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            By the month the booking was placed, {windowLabel}. Cancelled bookings are left out.
          </p>
          <ColumnChart
            className="mt-6"
            data={bookings.byMonth}
            caption={`Bookings placed per month, ${windowLabel}, across homestays, experiences, tours, transport and tables.`}
            valueLabel="Bookings"
            emptyMessage="No bookings have been made in the last twelve months."
          />
        </section>

        <section
          aria-labelledby="chart-applications"
          className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 lg:col-span-2"
        >
          <h3 id="chart-applications" className="font-display text-xl">
            Application queue
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {applications.total === 0
              ? "No host applications have been received yet."
              : `Where the ${plural(applications.total, "application", "applications")} received so far stand.`}
          </p>
          <StatusBars
            className="mt-6"
            caption="Applications by decision status."
            emptyMessage="No applications to break down yet."
            rows={[
              { label: "Pending review", value: pending, color: CHART_STATUS.warning },
              { label: "Approved", value: applications.byStatus.approved, color: CHART_STATUS.good },
              { label: "Rejected", value: applications.byStatus.rejected, color: CHART_STATUS.critical },
            ]}
          />
          <hr className="my-6 border-border" />
          <StatusBars
            caption="Applications by host type."
            emptyMessage="No applications to break down yet."
            rows={byHostType}
          />
          <Button asChild variant="outline" size="sm" className="mt-6">
            <Link href="/admin/applications">Open the queue</Link>
          </Button>
        </section>
      </div>

      <section
        aria-labelledby="chart-intake"
        className="mt-6 rounded-[var(--radius-lg)] border border-border bg-surface p-6"
      >
        <h3 id="chart-intake" className="font-display text-xl">
          Host applications received
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          New applications by the month they were submitted, {windowLabel}.
        </p>
        <ColumnChart
          className="mt-6"
          data={applications.byMonth}
          caption={`New host applications received per month, ${windowLabel}.`}
          valueLabel="Applications"
          emptyMessage="No host applications have arrived in the last twelve months."
        />
      </section>
    </>
  );
}
