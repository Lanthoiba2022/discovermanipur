"use client";

import { useMemo, useState } from "react";

import {
  EmptyRow,
  PlainHeader,
  SortableHeader,
  StatusPill,
  TableScroller,
  sortCompare,
  type SortState,
} from "@/components/admin/table-parts";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminBookingRow } from "@/lib/admin/types";
import { formatINR } from "@/lib/utils";

type SortKey = "guestName" | "title" | "kind" | "startDate" | "totalPrice" | "status";

const ALL = "all";

const KIND_LABEL: Record<AdminBookingRow["kind"], string> = {
  homestay: "Homestay",
  experience: "Experience",
  tour: "Tour",
  transport: "Transport",
  table: "Table",
};

/**
 * `start_date` is a calendar date. Parsed as UTC midnight and formatted in
 * UTC, it reads the same on the server and in every browser time zone.
 */
function formatDate(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Read-only: no booking status can be changed from here. */
export function BookingsTable({ initial }: { initial: AdminBookingRow[] }) {
  const [status, setStatus] = useState<string>(ALL);
  const [kind, setKind] = useState<string>(ALL);
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "startDate", direction: "desc" });

  const filtered = useMemo(() => {
    const out = initial.filter(
      (b) => (status === ALL || b.status === status) && (kind === ALL || b.kind === kind),
    );
    return out.sort((a, b) => sortCompare(a[sort.key], b[sort.key], sort.direction));
  }, [initial, status, kind, sort]);

  const revenue = filtered
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, direction: s.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" },
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="sm:w-44">
          <Label htmlFor="booking-status" className="mb-1.5 block text-xs text-muted-foreground">
            Status
          </Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="booking-status" aria-label="Filter bookings by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:w-44">
          <Label htmlFor="booking-kind" className="mb-1.5 block text-xs text-muted-foreground">
            Booking type
          </Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger id="booking-kind" aria-label="Filter bookings by type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {Object.entries(KIND_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground sm:ml-auto sm:pb-3" aria-live="polite">
          {filtered.length} bookings · {formatINR(revenue)} booked value
        </p>
      </div>

      <TableScroller label="Bookings">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <caption className="sr-only">
            Platform bookings with guest, listing, travel date, value and status
          </caption>
          <thead className="border-b border-border bg-surface-sunken text-left">
            <tr>
              <SortableHeader columnKey="guestName" sort={sort} onSort={toggleSort}>
                Guest
              </SortableHeader>
              <SortableHeader columnKey="title" sort={sort} onSort={toggleSort}>
                Booking
              </SortableHeader>
              <SortableHeader columnKey="kind" sort={sort} onSort={toggleSort}>
                Type
              </SortableHeader>
              <SortableHeader columnKey="startDate" sort={sort} onSort={toggleSort}>
                Starts
              </SortableHeader>
              <PlainHeader align="right">Guests</PlainHeader>
              <SortableHeader columnKey="totalPrice" sort={sort} onSort={toggleSort} align="right">
                Value
              </SortableHeader>
              <SortableHeader columnKey="status" sort={sort} onSort={toggleSort}>
                Status
              </SortableHeader>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              initial.length === 0 ? (
                <EmptyRow
                  colSpan={7}
                  title="No bookings yet"
                  body="Bookings made through Discover Manipur will be listed here as they come in."
                />
              ) : (
                <EmptyRow
                  colSpan={7}
                  title="No bookings match these filters"
                  body="Try another status or booking type."
                />
              )
            ) : (
              filtered.map((b) => (
                <tr key={b.id} className="border-b border-border/70 last:border-0 hover:bg-muted/50">
                  <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                    {b.guestName}
                    {b.guestEmail && (
                      <span className="block text-xs font-normal text-muted-foreground">
                        {b.guestEmail}
                      </span>
                    )}
                  </th>
                  <td className="px-4 py-3 text-muted-foreground">
                    {b.title}
                    {b.listingMissing && (
                      <span className="block text-xs">Listing no longer in the catalogue</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{KIND_LABEL[b.kind]}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {formatDate(b.startDate)}
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
    </>
  );
}
