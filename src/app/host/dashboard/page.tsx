import { CalendarDays, Home, IndianRupee, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ColumnChart } from "@/components/admin/column-chart";
import { StatTile } from "@/components/admin/stat-tile";
import { StatusPill, TableScroller } from "@/components/admin/table-parts";
import { HostListingsTable } from "@/components/host/host-listings-table";
import { Button } from "@/components/ui/button";
import { getHostDashboard } from "@/lib/host/dashboard";
import { requireHost } from "@/lib/host/role";
import { HOST_TYPE_LABEL, type HostDashboardData } from "@/lib/host/types";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Host dashboard",
  description:
    "Your Discover Manipur listings, the bookings on them, and the status of your host application.",
};

const DISCORD_URL = "https://discord.gg/hgGfm6UpU";

/** `start_date` is a calendar date; reading it as UTC keeps it from shifting a day. */
function formatDay(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatTimestamp(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

const APPLICATION_COPY = {
  pending: "Waiting for review. You can follow progress on the community Discord.",
  approved:
    "Approved. An admin links your homestays and experiences to this account, and they appear below once linked.",
  rejected: "Not approved this time. You are welcome to apply again.",
} as const;

function DashboardNotice({ data }: { data: HostDashboardData }) {
  let title: string;
  let body: string;
  if (data.state === "no-database") {
    title = "No database is connected";
    body =
      "This deployment has no database, so there are no listings or bookings to show. The figures below stay at zero.";
  } else if (data.state === "error") {
    title = "Your dashboard could not be loaded";
    body = "Something went wrong reading your listings and bookings. Refresh the page in a moment.";
  } else if (data.listings.length === 0) {
    title = "No listings are linked to your account yet";
    body =
      "Listings are linked to hosts by a Discover Manipur admin, usually after your application is approved. Until then this dashboard stays empty. Ask on the community Discord if you are waiting on one.";
  } else {
    return null;
  }

  return (
    <div
      role={data.state === "error" ? "alert" : "status"}
      className="mb-8 rounded-[var(--radius-lg)] border border-border bg-surface-sunken p-5"
    >
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{body}</p>
      {data.state === "ok" && (
        <Button asChild variant="outline" size="sm" className="mt-4">
          <a href={DISCORD_URL} rel="noreferrer noopener" target="_blank">
            Ask on Discord
          </a>
        </Button>
      )}
    </div>
  );
}

export default async function HostDashboardPage() {
  // Hosts and admins only; anyone else is redirected before any data is read.
  const user = await requireHost("/host/dashboard");
  // Scoped to the session user's id, never one from the request.
  const data = await getHostDashboard(user.id);
  const { stats, application, upcoming, byMonth, listings } = data;

  const delta = stats.bookedLastMonth
    ? Math.round(((stats.bookedThisMonth - stats.bookedLastMonth) / stats.bookedLastMonth) * 100)
    : null;
  const hasBookingValue = byMonth.some((m) => m.value > 0);

  return (
    <div className="shell pb-24 pt-28 md:pt-32">
      <header className="mb-10">
        <p className="eyebrow mb-3 text-muted-foreground">Host dashboard</p>
        <h1 className="text-headline">Khurumjari, {user.name.split(" ")[0]}</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Your listings, the guests on their way, and what their bookings are worth. Guests pay you
          directly: Discover Manipur takes no fee and no money moves through the site.
        </p>
      </header>

      <DashboardNotice data={data} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Booked this month"
          value={formatINR(stats.bookedThisMonth)}
          delta={delta === null ? undefined : `${delta >= 0 ? "+" : ""}${delta}%`}
          deltaIsGood={delta === null || delta >= 0}
          hint={delta === null ? "arrivals this month, confirmed or completed" : "vs last month"}
          icon={IndianRupee}
        />
        <StatTile
          label="Live listings"
          value={stats.liveListings.toLocaleString("en-IN")}
          hint={
            stats.totalListings
              ? `of ${stats.totalListings} linked to your account`
              : "none linked to your account yet"
          }
          icon={Home}
        />
        <StatTile
          label="Upcoming bookings"
          value={stats.upcomingCount.toLocaleString("en-IN")}
          hint={`${stats.guestsExpected.toLocaleString("en-IN")} ${stats.guestsExpected === 1 ? "guest" : "guests"} expected`}
          icon={CalendarDays}
        />
        <StatTile
          label="Guest rating"
          value={stats.rating === null ? "—" : stats.rating.toFixed(2)}
          hint={
            stats.rating === null
              ? "no reviews yet"
              : `from ${stats.reviewCount.toLocaleString("en-IN")} ${stats.reviewCount === 1 ? "review" : "reviews"}`
          }
          icon={Star}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section
          aria-labelledby="value-heading"
          className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 lg:col-span-2"
        >
          <h2 id="value-heading" className="font-display text-2xl">
            Booking value
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The totals on confirmed and completed bookings, by arrival month. Guests settle with you
            directly, so this is what bookings were worth, not a record of payments.
          </p>
          {hasBookingValue ? (
            <ColumnChart
              className="mt-6"
              data={byMonth}
              caption="Value of confirmed and completed bookings by arrival month"
              valueLabel="Booking value"
              format="inr-compact"
            />
          ) : (
            <div className="mt-6 rounded-[var(--radius)] border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No confirmed bookings in the last {byMonth.length} months.
              </p>
            </div>
          )}
        </section>

        <section
          aria-labelledby="application-heading"
          className="rounded-[var(--radius-lg)] border border-border bg-surface p-6"
        >
          <h2 id="application-heading" className="font-display text-2xl">
            Your application
          </h2>
          {application ? (
            <>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">Submitted</dt>
                  <dd className="mt-1 text-foreground">{formatTimestamp(application.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                    {HOST_TYPE_LABEL[application.hostType]} · {application.district}
                  </dt>
                  <dd className="mt-1 text-foreground">{application.propertyName}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">Status</dt>
                  <dd className="mt-1.5">
                    <StatusPill status={application.status} />
                  </dd>
                </div>
              </dl>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                {APPLICATION_COPY[application.status]}
              </p>
              {application.adminNotes && (
                <p className="mt-3 rounded-[var(--radius)] bg-surface-sunken p-4 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Note from Discover Manipur: </span>
                  {application.adminNotes}
                </p>
              )}
            </>
          ) : (
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {data.state === "ok"
                ? "There is no host application on file for this account."
                : "Your application status is not available right now."}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            {data.state === "ok" && (!application || application.status === "rejected") && (
              <Button asChild size="sm">
                <Link href="/host/apply">Apply to host</Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href="/host/guidelines">Hosting standards</Link>
            </Button>
          </div>
        </section>
      </div>

      <section aria-labelledby="listings-heading" className="mt-12">
        <h2 id="listings-heading" className="font-display text-2xl">
          Your listings
        </h2>
        <p className="mb-5 mt-2 text-sm text-muted-foreground">
          Pausing a homestay hides it from travellers until you resume it. Bookings already made
          stay as they are.
        </p>
        <HostListingsTable
          listings={listings}
          emptyTitle="No listings linked yet"
          emptyBody="An admin links homestays and experiences to your account. Once linked, they appear here."
        />
      </section>

      <section aria-labelledby="bookings-heading" className="mt-12">
        <h2 id="bookings-heading" className="font-display text-2xl">
          Guests on their way
        </h2>
        <p className="mb-5 mt-2 text-sm text-muted-foreground">
          Pending and confirmed bookings on your listings, soonest first. Only each guest&apos;s
          first name is shown.
        </p>
        <TableScroller label="Upcoming bookings">
          <table className="w-full min-w-[48rem] border-collapse text-sm">
            <caption className="sr-only">
              Upcoming bookings with guest, listing, dates, guest count, value and status
            </caption>
            <thead className="border-b border-border bg-surface-sunken text-left">
              <tr>
                <th scope="col" className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Guest
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Listing
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Arrives
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Nights
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Guests
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Value
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {upcoming.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <p className="font-display text-lg text-foreground">No upcoming bookings</p>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                      {listings.length
                        ? "New bookings on your listings will appear here."
                        : "Bookings appear here once a listing is linked to your account."}
                    </p>
                  </td>
                </tr>
              ) : (
                upcoming.map((b) => (
                  <tr key={b.id} className="border-b border-border/70 last:border-0 hover:bg-muted/50">
                    <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                      {b.guestFirstName ?? "Guest"}
                    </th>
                    <td className="px-4 py-3 text-muted-foreground">
                      {b.listingTitle}
                      <span className="block text-xs">{HOST_TYPE_LABEL[b.kind]}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {formatDay(b.startDate)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {b.nights ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {b.guests}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {formatINR(b.totalPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={b.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableScroller>
      </section>
    </div>
  );
}
