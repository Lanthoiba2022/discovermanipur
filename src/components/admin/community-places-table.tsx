"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import {
  CommunityStatusPill,
  RelationshipFlag,
  formatDate,
  n,
} from "@/components/admin/community-parts";
import {
  EmptyRow,
  PlainHeader,
  SortableHeader,
  TableScroller,
  sortCompare,
  type SortState,
} from "@/components/admin/table-parts";
import { IntentLink } from "@/components/shared/intent-link";
import { UPVOTES_REQUIRED, hoursLeft } from "@/lib/community/rules";
import { CATEGORY_SHORT_LABELS } from "@/lib/community/taxonomy";
import type { AdminPlaceRow } from "@/lib/community/types";

type SortKey = "name" | "category" | "district" | "upvotes" | "photoCount" | "createdAt";

/**
 * The review queue's rows. Filtering by status, submitter and name happens on
 * the server through the URL; this only sorts what it was given. `now` comes
 * from the server so the hours left match between the two renders.
 */
export function CommunityPlacesTable({
  rows,
  now,
  emptyTitle,
  emptyBody,
}: {
  rows: AdminPlaceRow[];
  now: string;
  emptyTitle: string;
  emptyBody: string;
}) {
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "createdAt", direction: "desc" });

  const sorted = useMemo(
    () => [...rows].sort((a, b) => sortCompare(a[sort.key], b[sort.key], sort.direction)),
    [rows, sort],
  );

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, direction: s.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" },
    );
  }

  const nowDate = new Date(now);

  return (
    <TableScroller label="Community places">
      <table className="w-full min-w-[78rem] border-collapse text-sm">
        <caption className="sr-only">
          Community places with category, district, status, votes, who listed them, photo count,
          listing date and the latest admin decision
        </caption>
        <thead className="border-b border-border bg-surface-sunken text-left">
          <tr>
            <PlainHeader srOnly>Cover photo</PlainHeader>
            <SortableHeader columnKey="name" sort={sort} onSort={toggleSort}>
              Place
            </SortableHeader>
            <SortableHeader columnKey="category" sort={sort} onSort={toggleSort}>
              Category
            </SortableHeader>
            <SortableHeader columnKey="district" sort={sort} onSort={toggleSort}>
              District
            </SortableHeader>
            <PlainHeader>Status</PlainHeader>
            <SortableHeader columnKey="upvotes" sort={sort} onSort={toggleSort} align="right">
              Upvotes
            </SortableHeader>
            <PlainHeader>Listed by</PlainHeader>
            <SortableHeader columnKey="photoCount" sort={sort} onSort={toggleSort} align="right">
              Photos
            </SortableHeader>
            <SortableHeader columnKey="createdAt" sort={sort} onSort={toggleSort}>
              Listed
            </SortableHeader>
            <PlainHeader>Decided</PlainHeader>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <EmptyRow colSpan={10} title={emptyTitle} body={emptyBody} />
          ) : (
            sorted.map((row) => {
              const left = row.status === "pending" ? hoursLeft(new Date(row.votingEndsAt), nowDate) : null;
              return (
                <tr key={row.id} className="border-b border-border/70 align-top last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3">
                    {row.cover ? (
                      <Image
                        src={row.cover.thumbSrc}
                        alt=""
                        width={row.cover.width}
                        height={row.cover.height}
                        unoptimized
                        className="size-14 rounded-[var(--radius-sm)] object-cover"
                      />
                    ) : (
                      <span className="flex size-14 items-center justify-center rounded-[var(--radius-sm)] bg-muted text-muted-foreground">
                        <ImageOff className="size-4" aria-hidden="true" />
                        <span className="sr-only">No photo</span>
                      </span>
                    )}
                  </td>
                  <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                    <IntentLink href={`/admin/places/${row.id}`} className="hover:underline">
                      {row.name}
                    </IntentLink>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {row.location}
                    </span>
                  </th>
                  <td className="px-4 py-3 text-muted-foreground">{CATEGORY_SHORT_LABELS[row.category]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.district}</td>
                  <td className="px-4 py-3">
                    <CommunityStatusPill status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    <span className="whitespace-nowrap text-foreground">
                      {n(row.upvotes)} / {UPVOTES_REQUIRED}
                    </span>
                    {left !== null && (
                      <span className="block whitespace-nowrap text-xs">
                        {left === 1 ? "1 hour left" : `${left} hours left`}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.submitter ? (
                      <>
                        <span className="block text-foreground">{row.submitter.name}</span>
                        <span className="block break-all text-xs">{row.submitter.email}</span>
                      </>
                    ) : (
                      <span className="block">Account deleted</span>
                    )}
                    <span className="mt-1.5 block">
                      <RelationshipFlag relationship={row.relationship} />
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {n(row.photoCount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.decidedAt ? (
                      <>
                        <span className="block text-foreground">
                          {row.decidedBy?.name ?? "Former admin"}
                        </span>
                        <span className="block whitespace-nowrap text-xs tabular-nums">
                          {formatDate(row.decidedAt)}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs">
                        {row.status === "published" ? "By community vote" : "Not yet"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </TableScroller>
  );
}
