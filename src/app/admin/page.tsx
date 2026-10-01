import { CalendarCheck, Home, Inbox, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CHART_SERIES, CHART_STATUS } from "@/components/admin/chart-colors";
import { ColumnChart } from "@/components/admin/column-chart";
import { StatTile } from "@/components/admin/stat-tile";
import { StatusBars } from "@/components/admin/status-bars";
import { Button } from "@/components/ui/button";
import { getExperiences, getHomestays } from "@/lib/data";
import { adminBookings, applicationsByMonth, bookingsByMonth, hostApplications } from "@/lib/host/mock-data";
import { requireAdmin } from "@/lib/host/role";
import { HOST_TYPE_LABEL } from "@/lib/host/types";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin overview",
  description:
    "Discover Manipur operations overview: listings, pending host applications, bookings and travellers across Manipur.",
};

export default async function AdminOverviewPage() {
  await requireAdmin("/admin");
  const [homestays, experiences] = await Promise.all([getHomestays(), getExperiences()]);

  const listingCount = homestays.length + experiences.length;
  const pending = hostApplications.filter((a) => a.status === "pending").length;
  const approved = hostApplications.filter((a) => a.status === "approved").length;
  const rejected = hostApplications.filter((a) => a.status === "rejected").length;
  const bookedValue = adminBookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const byHostType = (Object.keys(HOST_TYPE_LABEL) as (keyof typeof HOST_TYPE_LABEL)[]).map(
    (type, i) => ({
      label: HOST_TYPE_LABEL[type],
      value: hostApplications.filter((a) => a.hostType === type).length,
      color: CHART_SERIES[i % CHART_SERIES.length],
    }),
  );

  return (
    <>
      <h2 className="sr-only">Overview</h2>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Published listings"
          value={listingCount.toLocaleString("en-IN")}
          hint={
            listingCount === 0
              ? "Catalogue is still loading in"
              : `${homestays.length} homestays · ${experiences.length} experiences`
          }
          icon={Home}
        />
        <StatTile
          label="Pending applications"
          value={pending.toLocaleString("en-IN")}
          hint="awaiting a decision"
          delta={pending > 4 ? "Above target" : "Within target"}
          deltaIsGood={pending <= 4}
          icon={Inbox}
        />
        <StatTile
          label="Bookings on the ledger"
          value={adminBookings.length.toLocaleString("en-IN")}
          hint={`${formatINR(bookedValue)} booked value`}
          icon={CalendarCheck}
        />
        <StatTile
          label="Registered travellers"
          value="1,284"
          delta="+112"
          hint="vs last month"
          icon={Users}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section
          aria-labelledby="chart-bookings"
          className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 lg:col-span-3"
        >
          <h3 id="chart-bookings" className="font-display text-xl">
            Bookings confirmed per month
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The Sangai Festival in November is the year&rsquo;s peak; the monsoon dip runs June to
            July.
          </p>
          <ColumnChart
            className="mt-6"
            data={bookingsByMonth}
            caption="Confirmed bookings per month across homestays, experiences, tours and transport."
            valueLabel="Bookings"
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
            Where the {hostApplications.length} applications received so far stand.
          </p>
          <StatusBars
            className="mt-6"
            caption="Applications by decision status."
            rows={[
              { label: "Pending review", value: pending, color: CHART_STATUS.warning },
              { label: "Approved", value: approved, color: CHART_STATUS.good },
              { label: "Rejected", value: rejected, color: CHART_STATUS.critical },
            ]}
          />
          <hr className="my-6 border-border" />
          <StatusBars caption="Applications by host type." rows={byHostType} />
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
          Intake has tripled since the district outreach camps began in April.
        </p>
        <ColumnChart
          className="mt-6"
          data={applicationsByMonth}
          caption="New host applications received per month."
          valueLabel="Applications"
        />
      </section>
    </>
  );
}
