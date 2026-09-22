"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
import { HOST_TYPE_LABEL, type HostListingRecord } from "@/lib/host/types";
import { formatINR } from "@/lib/utils";

type SortKey = "title" | "kind" | "pricePerNight" | "occupancyPct" | "rating";

export function HostListingsTable({ initial }: { initial: HostListingRecord[] }) {
  const [rows, setRows] = useState(initial);
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "occupancyPct", direction: "desc" });

  const sorted = useMemo(
    () => [...rows].sort((a, b) => sortCompare(a[sort.key], b[sort.key], sort.direction)),
    [rows, sort],
  );

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, direction: s.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" },
    );
  }

  function togglePause(id: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = r.status === "live" ? ("paused" as const) : ("live" as const);
        toast.success(
          next === "paused" ? `${r.title} paused` : `${r.title} is taking bookings again`,
          {
            description:
              next === "paused"
                ? "Existing bookings stand; no new ones can be made."
                : "It is back in search results.",
          },
        );
        return { ...r, status: next };
      }),
    );
  }

  return (
    <TableScroller label="Your listings">
      <table className="w-full min-w-[52rem] border-collapse text-sm">
        <caption className="sr-only">
          Your listings with type, price, occupancy, rating and whether they are taking bookings
        </caption>
        <thead className="border-b border-border bg-surface-sunken text-left">
          <tr>
            <SortableHeader columnKey="title" sort={sort} onSort={toggleSort}>
              Listing
            </SortableHeader>
            <SortableHeader columnKey="kind" sort={sort} onSort={toggleSort}>
              Type
            </SortableHeader>
            <SortableHeader columnKey="pricePerNight" sort={sort} onSort={toggleSort} align="right">
              Price
            </SortableHeader>
            <SortableHeader columnKey="occupancyPct" sort={sort} onSort={toggleSort} align="right">
              Occupancy
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
            <EmptyRow
              colSpan={7}
              title="No listings yet"
              body="Once your application is approved, the listings you publish appear here."
            />
          ) : (
            sorted.map((row) => (
              <tr key={row.id} className="border-b border-border/70 last:border-0 hover:bg-muted/50">
                <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                  <span className="flex items-center gap-3">
                    <Image
                      src={row.image}
                      alt={row.imageAlt}
                      width={56}
                      height={56}
                      sizes="56px"
                      className="size-12 shrink-0 rounded-[var(--radius-sm)] object-cover"
                    />
                    <span>
                      {row.title}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {row.location}
                      </span>
                    </span>
                  </span>
                </th>
                <td className="px-4 py-3 text-muted-foreground">{HOST_TYPE_LABEL[row.kind]}</td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {formatINR(row.pricePerNight)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {row.occupancyPct}%
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {row.rating.toFixed(1)} ({row.reviewCount})
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={row.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePause(row.id)}
                    aria-label={
                      row.status === "live"
                        ? `Pause bookings for ${row.title}`
                        : `Resume bookings for ${row.title}`
                    }
                  >
                    {row.status === "live" ? "Pause" : "Resume"}
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </TableScroller>
  );
}
