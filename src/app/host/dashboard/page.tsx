import { CalendarDays, IndianRupee, PercentCircle, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ColumnChart } from "@/components/admin/column-chart";
import { StatTile } from "@/components/admin/stat-tile";
import { StatusPill, TableScroller } from "@/components/admin/table-parts";
import { HostListingsTable } from "@/components/host/host-listings-table";
import { Button } from "@/components/ui/button";
import {
  hostBookings,
  hostEarningsByMonth,
  hostListings,
  myApplication,
} from "@/lib/host/mock-data";
import { HOST_TYPE_LABEL } from "@/lib/host/types";
import { getSessionUser } from "@/lib/host/role";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Host dashboard",
  description:
    "Your Manipur Tourism listings, upcoming bookings, occupancy and payouts, and the status of your host application.",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const APPLICATION_COPY = {
  pending: "A coordinator from your district will call within three working days.",
  approved: "You are cleared to publish. Add photos and open your calendar.",
  rejected: "See the note below, put it right and reapply — most hosts do.",
} as const;

export default async function HostDashboardPage() {
  // Role comes from the adapter in src/lib/host/role.ts.
  const user = await getSessionUser();

  const liveListings = hostListings.filter((l) => l.status === "live");
  const avgOccupancy = liveListings.length
    ? Math.round(liveListings.reduce((s, l) => s + l.occupancyPct, 0) / liveListings.length)
    : 0;
  const thisMonth = hostEarningsByMonth.at(-1)?.value ?? 0;
  const lastMonth = hostEarningsByMonth.at(-2)?.value ?? 0;
  const delta = lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;
  const upcoming = [...hostBookings].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const guestsExpected = upcoming
    .filter((b) => b.status !== "cancelled")
    .reduce((s, b) => s + b.guests, 0);
  const rated = hostListings.filter((l) => l.reviewCount > 0);
  const avgRating = rated.length
    ? rated.reduce((s, l) => s + l.rating * l.reviewCount, 0) /
      rated.reduce((s, l) => s + l.reviewCount, 0)
    : 0;

  return (
    <div className="shell pb-24 pt-28 md:pt-32">
      <header className="mb-10">
        <p className="eyebrow mb-3 text-muted-foreground">Host dashboard</p>
        <h1 className="text-headline">
          Khurumjari{user ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Your listings, the guests on their way, and what Manipur Tourism owes you. Figures update as
          bookings are confirmed.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Payout this month"
          value={formatINR(thisMonth)}
          delta={`${delta >= 0 ? "+" : ""}${delta}%`}
          deltaIsGood={delta >= 0}
          hint="vs last month"
          icon={IndianRupee}
        />
        <StatTile
          label="Average occupancy"
          value={`${avgOccupancy}%`}
          hint={`across ${liveListings.length} live ${liveListings.length === 1 ? "listing" : "listings"}`}
          icon={PercentCircle}
        />
        <StatTile
          label="Upcoming bookings"
          value={upcoming.length.toLocaleString("en-IN")}
          hint={`${guestsExpected} guests expected`}
          icon={CalendarDays}
        />
        <StatTile
          label="Guest rating"
          value={avgRating ? avgRating.toFixed(2) : "—"}
          hint={avgRating ? "weighted across your listings" : "no reviews yet"}
          icon={Star}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section
          aria-labelledby="earnings-heading"
          className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 lg:col-span-2"
        >
          <h2 id="earnings-heading" className="font-display text-2xl">
            Your payouts
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            After Manipur Tourism&rsquo;s 10% fee, released within five working days of each checkout.
          </p>
          <ColumnChart
            className="mt-6"
            data={hostEarningsByMonth}
            caption="Payouts released to you each month, after fees."
            valueLabel="Payout"
            format="inr-compact"
          />
        </section>

        <section
          aria-labelledby="application-heading"
          className="rounded-[var(--radius-lg)] border border-border bg-surface p-6"
        >
          <h2 id="application-heading" className="font-display text-2xl">
            Your application
          </h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Reference</dt>
              <dd className="mt-1 font-mono text-foreground">{myApplication.reference}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Submitted</dt>
              <dd className="mt-1 text-foreground">{formatDate(myApplication.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                {HOST_TYPE_LABEL[myApplication.hostType]} · {myApplication.district}
              </dt>
              <dd className="mt-1 text-foreground">{myApplication.propertyName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Status</dt>
              <dd className="mt-1.5">
                <StatusPill status={myApplication.status} />
              </dd>
            </div>
          </dl>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            {APPLICATION_COPY[myApplication.status]}
          </p>
          {myApplication.adminNotes && (
            <p className="mt-3 rounded-[var(--radius)] bg-surface-sunken p-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Note from Manipur Tourism: </span>
              {myApplication.adminNotes}
            </p>
          )}
          <Button asChild variant="outline" size="sm" className="mt-6">
            <Link href="/host/guidelines">Hosting standards</Link>
          </Button>
        </section>
      </div>

      <section aria-labelledby="listings-heading" className="mt-12">
        <h2 id="listings-heading" className="font-display text-2xl">
          Your listings
        </h2>
        <p className="mb-5 mt-2 text-sm text-muted-foreground">
          Pausing keeps existing bookings and stops new ones. It never affects your ranking.
        </p>
        <HostListingsTable initial={hostListings} />
      </section>

      <section aria-labelledby="bookings-heading" className="mt-12">
        <h2 id="bookings-heading" className="font-display text-2xl">
          Guests on their way
        </h2>
        <p className="mb-5 mt-2 text-sm text-muted-foreground">
          Confirm a pending request within 24 hours or it lapses back to the traveller.
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
                    <p className="font-display text-lg text-foreground">No bookings yet</p>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                      New requests land here. Listings with six or more photos get booked roughly
                      twice as often.
                    </p>
                  </td>
                </tr>
              ) : (
                upcoming.map((b) => (
                  <tr key={b.id} className="border-b border-border/70 last:border-0 hover:bg-muted/50">
                    <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                      {b.guestName}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {b.guestOrigin}
                      </span>
                    </th>
                    <td className="px-4 py-3 text-muted-foreground">{b.refTitle}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {formatDate(b.startDate)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {b.nights}
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
