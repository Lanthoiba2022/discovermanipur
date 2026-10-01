import {
  CalendarCheck,
  CheckCircle2,
  Hourglass,
  Home,
  Images,
  Inbox,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CHART_SERIES, CHART_STATUS } from "@/components/admin/chart-colors";
import { ColumnChart } from "@/components/admin/column-chart";
import { StatTile } from "@/components/admin/stat-tile";
import { StatusBars } from "@/components/admin/status-bars";
import { AdminUnavailable } from "@/components/admin/unavailable";
import { Button } from "@/components/ui/button";
import { getAdminOverview } from "@/lib/admin/queries";
import { adminCommunityStats } from "@/lib/community/queries";
import { UPVOTES_REQUIRED, VOTING_WINDOW_HOURS } from "@/lib/community/rules";
import { requireAdmin } from "@/lib/host/role";
import { HOST_TYPE_LABEL } from "@/lib/host/types";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin overview",
  description:
    "Discover Manipur operations overview: listings, pending host applications, bookings, travellers and community places across Manipur.",
};

const n = (value: number) => value.toLocaleString("en-IN");
const plural = (value: number, one: string, many: string) => `${n(value)} ${value === 1 ? one : many}`;

/** The community places queue at a glance. Reads its own figures, so it shows even if the rest fails. */
async function CommunityOverview() {
  const stats = await adminCommunityStats();

  return (
    <section
      aria-labelledby="community-overview"
      className="mt-6 rounded-[var(--radius-lg)] border border-border bg-surface p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id="community-overview" className="font-display text-xl">
            Community places
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Places listed by members. {UPVOTES_REQUIRED} upvotes within {VOTING_WINDOW_HOURS} hours
            publish a place; the rest wait here for a decision.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/admin/places">Open the review queue</Link>
        </Button>
      </div>
      {stats ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <StatTile
            label="Needs review"
            value={n(stats.held)}
            hint={stats.held === 0 ? "Nothing waiting for a decision" : "voting closed without enough upvotes, or held"}
            icon={Inbox}
          />
          <StatTile label="Collecting votes" value={n(stats.pending)} hint="voting window still open" icon={Hourglass} />
          <StatTile label="Published" value={n(stats.published)} hint="on the public site" icon={CheckCircle2} />
          <StatTile label="Rejected" value={n(stats.rejected)} hint="hidden, with a reason given" icon={XCircle} />
          <StatTile label="Contributors" value={n(stats.contributors)} hint="people who have listed a place" icon={UserRound} />
          <StatTile label="Photos" value={n(stats.photos)} hint="live photos on places" icon={Images} />
        </div>
      ) : (
        <AdminUnavailable what="Community figures" className="mt-6" />
      )}
    </section>
  );
}

export default async function AdminOverviewPage() {
  await requireAdmin("/admin");
  const overview = await getAdminOverview();

  if (!overview) {
    return (
      <>
        <h2 className="sr-only">Overview</h2>
        <AdminUnavailable what="The overview" />
        <CommunityOverview />
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

      <CommunityOverview />
    </>
  );
}
