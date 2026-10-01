import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { UUID, n } from "@/components/admin/community-parts";
import { CommunityPlacesTable } from "@/components/admin/community-places-table";
import { AdminUnavailable } from "@/components/admin/unavailable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminCountPlaces, adminGetPerson, adminListPlaces, type AdminStatusFilter } from "@/lib/community/queries";
import { UPVOTES_REQUIRED, VOTING_WINDOW_HOURS } from "@/lib/community/rules";
import { requireAdmin } from "@/lib/host/role";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Community places",
  description:
    "Review the places listed by the Discover Manipur community: publish, hold or reject them, and see who listed what.",
};

const TABS: { status: AdminStatusFilter; label: string }[] = [
  { status: "held", label: "Needs review" },
  { status: "pending", label: "Collecting votes" },
  { status: "published", label: "Published" },
  { status: "rejected", label: "Rejected" },
  { status: "all", label: "All" },
];

const STATUSES = new Set<string>(TABS.map((t) => t.status));

const EMPTY: Record<AdminStatusFilter, { title: string; body: string }> = {
  held: {
    title: "Nothing needs review",
    body: "Places land here when their voting window closes before they reach enough upvotes, or when an admin holds them.",
  },
  pending: {
    title: "Nothing is collecting votes",
    body: "Newly listed places appear here while signed-in, verified members vote on them.",
  },
  published: {
    title: "Nothing published yet",
    body: "Places appear here once the community votes them through or an admin publishes them.",
  },
  rejected: {
    title: "Nothing rejected",
    body: "Places an admin has turned down appear here, with the reason the person who listed them was given.",
  },
  all: {
    title: "No community places yet",
    body: "Places listed through the community form appear here the moment they are submitted.",
  },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

function queueHref(params: { status: AdminStatusFilter; submitter?: string; q?: string }) {
  const search = new URLSearchParams();
  if (params.status !== "held") search.set("status", params.status);
  if (params.submitter) search.set("submitter", params.submitter);
  if (params.q) search.set("q", params.q);
  const query = search.toString();
  return query ? `/admin/places?${query}` : "/admin/places";
}

export default async function AdminCommunityPlacesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin("/admin/places");

  const params = await searchParams;
  const rawStatus = one(params.status);
  const status: AdminStatusFilter = rawStatus && STATUSES.has(rawStatus) ? (rawStatus as AdminStatusFilter) : "held";
  const rawSubmitter = one(params.submitter);
  const submitter = rawSubmitter && UUID.test(rawSubmitter) ? rawSubmitter : undefined;
  const q = one(params.q)?.trim().slice(0, 100) || undefined;
  const filtered = Boolean(submitter || q);

  // Tab counts use the same submitter and name filter as the table.
  const [rows, counts, person] = await Promise.all([
    adminListPlaces({ status, submitterId: submitter, q }),
    adminCountPlaces({ submitterId: submitter, q }),
    submitter ? adminGetPerson(submitter) : Promise.resolve(null),
  ]);

  const submitterName = submitter ? (person?.name ?? "an account that no longer exists") : null;

  return (
    <section aria-labelledby="places-heading">
      <h2 id="places-heading" className="font-display text-2xl">
        Community places
      </h2>
      <p className="mb-6 mt-2 max-w-3xl text-sm text-muted-foreground">
        A place is published by itself once it has {UPVOTES_REQUIRED} upvotes from verified members
        within {VOTING_WINDOW_HOURS} hours of being listed. If the window closes first, it waits here
        for a decision. Check the photos and any connection the person who listed it has disclosed
        before publishing. A rejection needs a reason, which they will see.
      </p>

      <nav aria-label="Filter by status" className="mb-5">
        <ul className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const active = tab.status === status;
            return (
              <li key={tab.status}>
                <Link
                  href={queueHref({ status: tab.status, submitter, q })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
                    active
                      ? "border-primary bg-primary font-medium text-primary-foreground"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                  {counts && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs tabular-nums",
                        active ? "bg-primary-foreground/20" : "bg-muted",
                      )}
                    >
                      {n(counts[tab.status])}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <form action="/admin/places" method="get" role="search" className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        {status !== "held" && <input type="hidden" name="status" value={status} />}
        {submitter && <input type="hidden" name="submitter" value={submitter} />}
        <div className="sm:w-80">
          <Label htmlFor="places-q" className="mb-1.5 block text-xs text-muted-foreground">
            Search by place name
          </Label>
          <Input id="places-q" name="q" type="search" defaultValue={q ?? ""} maxLength={100} />
        </div>
        <Button type="submit" variant="outline">
          <Search aria-hidden="true" />
          Search
        </Button>
        {q && (
          <Link
            href={queueHref({ status, submitter })}
            className="text-sm text-primary underline-offset-4 hover:underline sm:pb-3"
          >
            Clear search
          </Link>
        )}
        {rows && (
          <p className="text-sm text-muted-foreground sm:ml-auto sm:pb-3" aria-live="polite">
            {rows.length === 1 ? "1 place" : `${n(rows.length)} places`}
            {rows.length >= 500 && ", the 500 most recently listed"}
          </p>
        )}
      </form>

      {submitterName && (
        <p className="mb-5 rounded-[var(--radius)] bg-muted px-4 py-3 text-sm text-foreground">
          Showing places listed by <strong className="font-medium">{submitterName}</strong> ·{" "}
          <Link href={queueHref({ status, q })} className="text-primary underline-offset-4 hover:underline">
            clear
          </Link>
          <span className="sr-only"> the contributor filter</span>
        </p>
      )}

      {rows ? (
        <CommunityPlacesTable
          rows={rows}
          now={new Date().toISOString()}
          emptyTitle={filtered ? "No places match" : EMPTY[status].title}
          emptyBody={
            filtered
              ? "Clear the search or the contributor filter, or pick another status, to see more."
              : EMPTY[status].body
          }
        />
      ) : (
        <AdminUnavailable what="Community places" />
      )}
    </section>
  );
}
