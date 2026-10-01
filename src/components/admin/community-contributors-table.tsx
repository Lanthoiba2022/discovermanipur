"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { formatDate, n } from "@/components/admin/community-parts";
import {
  EmptyRow,
  PlainHeader,
  SortableHeader,
  TableScroller,
  sortCompare,
  type SortState,
} from "@/components/admin/table-parts";
import type { ContributorRow } from "@/lib/community/types";
import { cn } from "@/lib/utils";

type SortKey =
  | "name"
  | "joinedAt"
  | "submitted"
  | "published"
  | "pending"
  | "held"
  | "rejected"
  | "photos"
  | "votesCast"
  | "lastSubmittedAt";

const ROLE_LABEL: Record<ContributorRow["role"], string> = {
  user: "Traveller",
  host: "Host",
  admin: "Admin",
};

function Flag({ children, tone }: { children: string; tone: "good" | "bad" | "muted" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        tone === "good" && "bg-success/12 text-success",
        tone === "bad" && "bg-destructive/12 text-destructive",
        tone === "muted" && "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

const COUNT_COLUMNS: { key: Exclude<SortKey, "name" | "joinedAt" | "lastSubmittedAt">; label: string }[] = [
  { key: "submitted", label: "Listed" },
  { key: "published", label: "Published" },
  { key: "pending", label: "Voting" },
  { key: "held", label: "Held" },
  { key: "rejected", label: "Rejected" },
  { key: "photos", label: "Photos" },
  { key: "votesCast", label: "Votes cast" },
];

/** Everyone who has listed a place or uploaded a photo, sortable. */
export function CommunityContributorsTable({ rows }: { rows: ContributorRow[] }) {
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "submitted", direction: "desc" });

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) =>
        sortCompare(a[sort.key] ?? "", b[sort.key] ?? "", sort.direction),
      ),
    [rows, sort],
  );

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key
        ? { key, direction: s.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "name" ? "asc" : "desc" },
    );
  }

  return (
    <TableScroller label="Community contributors">
      <table className="w-full min-w-[76rem] border-collapse text-sm">
        <caption className="sr-only">
          People who have listed community places or uploaded photos, with their account status and
          how many places, photos and votes they have contributed
        </caption>
        <thead className="border-b border-border bg-surface-sunken text-left">
          <tr>
            <SortableHeader columnKey="name" sort={sort} onSort={toggleSort}>
              Contributor
            </SortableHeader>
            <PlainHeader>Account</PlainHeader>
            <SortableHeader columnKey="joinedAt" sort={sort} onSort={toggleSort}>
              Joined
            </SortableHeader>
            {COUNT_COLUMNS.map((col) => (
              <SortableHeader key={col.key} columnKey={col.key} sort={sort} onSort={toggleSort} align="right">
                {col.label}
              </SortableHeader>
            ))}
            <SortableHeader columnKey="lastSubmittedAt" sort={sort} onSort={toggleSort}>
              Last listed
            </SortableHeader>
            <PlainHeader>Review</PlainHeader>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <EmptyRow
              colSpan={COUNT_COLUMNS.length + 5}
              title="No contributors yet"
              body="People appear here once they list a place or upload a photo."
            />
          ) : (
            sorted.map((row) => (
              <tr key={row.id} className="border-b border-border/70 align-top last:border-0 hover:bg-muted/50">
                <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                  {row.name}
                  <span className="block break-all text-xs font-normal text-muted-foreground">{row.email}</span>
                </th>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap gap-1.5">
                    <Flag tone="muted">{ROLE_LABEL[row.role]}</Flag>
                    {row.emailVerified ? <Flag tone="good">Verified</Flag> : <Flag tone="muted">Not verified</Flag>}
                    {row.banned && <Flag tone="bad">Banned</Flag>}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                  {formatDate(row.joinedAt)}
                </td>
                {COUNT_COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-right tabular-nums",
                      row[col.key] > 0 ? "text-foreground" : "text-muted-foreground",
                      col.key === "held" && row.held > 0 && "font-medium text-warning",
                    )}
                  >
                    {n(row[col.key])}
                  </td>
                ))}
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                  {row.lastSubmittedAt ? formatDate(row.lastSubmittedAt) : "Never"}
                </td>
                <td className="px-4 py-3">
                  <span className="flex flex-col gap-1 whitespace-nowrap">
                    <Link
                      href={`/admin/places?submitter=${row.id}&status=all`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Places<span className="sr-only"> listed by {row.name}</span>
                    </Link>
                    <Link
                      href={`/admin/photos?uploader=${row.id}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Photos<span className="sr-only"> uploaded by {row.name}</span>
                    </Link>
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </TableScroller>
  );
}
