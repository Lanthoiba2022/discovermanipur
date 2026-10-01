"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { setHomestayPaused } from "@/app/host/dashboard/actions";
import {
  EmptyRow,
  PlainHeader,
  SortableHeader,
  StatusPill,
  TableScroller,
  sortCompare,
  type SortState,
} from "@/components/admin/table-parts";
import { Button } from "@/components/ui/button";
import { HOST_TYPE_LABEL, type HostDashboardListing } from "@/lib/host/types";
import { formatINR } from "@/lib/utils";

type SortKey = "title" | "kind" | "price" | "rating";

export function HostListingsTable({
  listings,
  emptyTitle,
  emptyBody,
}: {
  listings: HostDashboardListing[];
  emptyTitle: string;
  emptyBody: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic(
    listings,
    (rows, change: { id: string; isActive: boolean }) =>
      rows.map((r) => (r.id === change.id ? { ...r, isActive: change.isActive } : r)),
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "title", direction: "asc" });

  const sorted = useMemo(
    () => [...optimistic].sort((a, b) => sortCompare(a[sort.key], b[sort.key], sort.direction)),
    [optimistic, sort],
  );

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, direction: s.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" },
    );
  }

  function togglePause(row: HostDashboardListing) {
    const paused = row.isActive;
    setPendingId(row.id);
    startTransition(async () => {
      setOptimistic({ id: row.id, isActive: !paused });
      const result = await setHomestayPaused({ listingId: row.id, paused });
      setPendingId(null);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(paused ? `${row.title} paused` : `${row.title} is taking bookings again`, {
        description: paused
          ? "It is hidden from travellers. Bookings already made still stand."
          : "It is back on the public homestay pages.",
      });
    });
  }

  return (
    <TableScroller label="Your listings">
      <table className="w-full min-w-[48rem] border-collapse text-sm">
        <caption className="sr-only">
          Your listings with type, price, rating and whether they are taking bookings
        </caption>
        <thead className="border-b border-border bg-surface-sunken text-left">
          <tr>
            <SortableHeader columnKey="title" sort={sort} onSort={toggleSort}>
              Listing
            </SortableHeader>
            <SortableHeader columnKey="kind" sort={sort} onSort={toggleSort}>
              Type
            </SortableHeader>
            <SortableHeader columnKey="price" sort={sort} onSort={toggleSort} align="right">
              Price
            </SortableHeader>
            <SortableHeader columnKey="rating" sort={sort} onSort={toggleSort} align="right">
              Rating
            </SortableHeader>
            <PlainHeader>Status</PlainHeader>
            <PlainHeader align="right">Action</PlainHeader>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <EmptyRow colSpan={6} title={emptyTitle} body={emptyBody} />
          ) : (
            sorted.map((row) => (
              <tr key={`${row.kind}:${row.id}`} className="border-b border-border/70 last:border-0 hover:bg-muted/50">
                <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                  <span className="flex items-center gap-3">
                    {row.image ? (
                      <Image
                        src={row.image.src}
                        alt={row.image.alt}
                        width={56}
                        height={56}
                        sizes="56px"
                        className="size-12 shrink-0 rounded-[var(--radius-sm)] object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-muted text-muted-foreground"
                      >
                        <ImageOff className="size-4" />
                      </span>
                    )}
                    <span>
                      {row.isActive ? (
                        <Link
                          href={`/${row.kind === "homestay" ? "homestays" : "experiences"}/${row.slug}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {row.title}
                        </Link>
                      ) : (
                        row.title
                      )}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {row.location}
                      </span>
                    </span>
                  </span>
                </th>
                <td className="px-4 py-3 text-muted-foreground">{HOST_TYPE_LABEL[row.kind]}</td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {formatINR(row.price)}
                  <span className="block text-xs">
                    {row.kind === "homestay" ? "per night" : "per person"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {row.reviewCount > 0 ? `${row.rating.toFixed(1)} (${row.reviewCount})` : "No reviews"}
                </td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap items-center gap-2">
                    <StatusPill status={row.isActive ? "live" : "paused"} />
                    {row.featured && (
                      <span className="text-xs text-muted-foreground">Featured</span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {row.canPause ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pendingId === row.id}
                      onClick={() => togglePause(row)}
                      aria-label={
                        row.isActive
                          ? `Pause bookings for ${row.title}`
                          : `Resume bookings for ${row.title}`
                      }
                    >
                      {row.isActive ? "Pause" : "Resume"}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Ask an admin to pause</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </TableScroller>
  );
}
