"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Bookmark, CalendarDays, User } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import {
  getBookings,
  partitionBookings,
  subscribeToBookings,
  useSavedItems,
} from "@/lib/booking";

function StatCard({
  href,
  label,
  value,
  hint,
  icon: Icon,
}: {
  href: string;
  label: string;
  value: string;
  hint: string;
  icon: typeof CalendarDays;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-6 transition-shadow hover:shadow-[var(--shadow-md)]"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-5 font-display text-3xl leading-none">{value}</p>
      <p className="mt-2 font-medium">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary">
        Open
        <ArrowRight
          className="size-3.5 transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

export function OverviewPanel() {
  const { user, displayName } = useAuth();
  const saved = useSavedItems();
  const [upcoming, setUpcoming] = useState<number | null>(null);

  const userId = user?.id ?? "";

  useEffect(() => {
    if (!userId) return;
    let alive = true;

    const run = async () => {
      try {
        const rows = await getBookings(userId);
        if (alive) setUpcoming(partitionBookings(rows).upcoming.length);
      } catch {
        // The bookings page shows the error; the count just stays a placeholder.
      }
    };

    void run();
    const unsubscribe = subscribeToBookings(run);

    return () => {
      alive = false;
      unsubscribe();
    };
  }, [userId]);

  return (
    <section aria-labelledby="overview-heading">
      <h2 id="overview-heading" className="font-display text-2xl">
        Hello, {displayName.split(" ")[0]}
      </h2>
      <p className="mt-2 text-muted-foreground">
        Everything you have planned and everything you have bookmarked, in one place.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {upcoming === null ? (
          <Skeleton className="h-52 w-full rounded-[var(--radius-lg)]" />
        ) : (
          <StatCard
            href="/account/bookings"
            icon={CalendarDays}
            value={String(upcoming)}
            label={upcoming === 1 ? "Upcoming trip" : "Upcoming trips"}
            hint="Requests and confirmed stays ahead of you"
          />
        )}

        <StatCard
          href="/account/saved"
          icon={Bookmark}
          value={String(saved.length)}
          label={saved.length === 1 ? "Saved place" : "Saved places"}
          hint="Homestays on your shortlist"
        />

        <StatCard
          href="/account/profile"
          icon={User}
          value={user?.phone ? "Complete" : "Partial"}
          label="Profile"
          hint={user?.phone ? "Hosts can reach you" : "Add a phone number for your hosts"}
        />
      </div>
    </section>
  );
}
