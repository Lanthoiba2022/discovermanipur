"use client";

import { Star, StarOff } from "lucide-react";
import { useMemo, useOptimistic, useState, useTransition } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setHomestayActive, setListingFeatured } from "@/lib/admin/listing-actions";
import type { ModerationKind, ModerationResult, ModerationRow } from "@/lib/admin/types";
import { formatINR } from "@/lib/utils";

type SortKey = "title" | "kind" | "district" | "price" | "rating";

type Change = { id: string; kind: ModerationKind; patch: Partial<Pick<ModerationRow, "featured" | "isActive">> };

const ALL = "all";

const KIND_LABEL: Record<ModerationKind, string> = {
  homestay: "Homestay",
  experience: "Experience",
};

const rowKey = (r: { kind: ModerationKind; id: string }) => `${r.kind}:${r.id}`;

/**
 * `initial` is the server's view. A toggle shows its new value at once
 * through `useOptimistic`; the action's response re-renders the page with the
 * saved rows, and on failure the optimistic value simply lapses, which is the
 * rollback.
 */
export function ListingsTable({ initial }: { initial: ModerationRow[] }) {
  const [rows, applyChange] = useOptimistic(initial, (current: ModerationRow[], change: Change) =>
    current.map((r) => (rowKey(r) === rowKey(change) ? { ...r, ...change.patch } : r)),
  );
  const [, startTransition] = useTransition();
  const [kind, setKind] = useState<string>(ALL);
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "title", direction: "asc" });

  const filtered = useMemo(() => {
    const out = rows.filter((r) => kind === ALL || r.kind === kind);
    return out.sort((a, b) => sortCompare(a[sort.key], b[sort.key], sort.direction));
  }, [rows, kind, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, direction: s.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" },
    );
  }

  function save(change: Change, run: () => Promise<ModerationResult>, onSaved: () => void) {
    startTransition(async () => {
      applyChange(change);
      let result: ModerationResult;
      try {
        result = await run();
      } catch {
        result = { ok: false, error: "That change could not be saved. Check your connection and try again." };
      }
      if (result.ok) onSaved();
      else toast.error(result.error);
    });
  }

  function toggleFeatured(row: ModerationRow) {
    const featured = !row.featured;
    save(
      { id: row.id, kind: row.kind, patch: { featured } },
      () => setListingFeatured({ kind: row.kind, id: row.id, featured }),
      () => toast.success(featured ? `${row.title} featured` : `${row.title} unfeatured`),
    );
  }

  function toggleActive(row: ModerationRow) {
    if (!row.canToggleActive) return;
    const isActive = !row.isActive;
    save(
      { id: row.id, kind: row.kind, patch: { isActive } },
      () => setHomestayActive({ id: row.id, isActive }),
      () =>
        toast.success(isActive ? `${row.title} back online` : `${row.title} deactivated`, {
          description: isActive
            ? "Travellers can find and book it again."
            : "It is hidden from the site and no longer bookable.",
        }),
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-48">
          <Label htmlFor="filter-kind" className="mb-1.5 block text-xs text-muted-foreground">
            Listing type
          </Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger id="filter-kind" aria-label="Filter by listing type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All listings</SelectItem>
              <SelectItem value="homestay">Homestays</SelectItem>
              <SelectItem value="experience">Experiences</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground sm:ml-auto sm:pb-3" aria-live="polite">
          {filtered.length} of {rows.length} listings ·{" "}
          {rows.filter((r) => r.featured).length} featured
        </p>
      </div>

      <TableScroller label="Listing moderation">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <caption className="sr-only">
            Homestays and experiences with their feature and visibility state
          </caption>
          <thead className="border-b border-border bg-surface-sunken text-left">
            <tr>
              <SortableHeader columnKey="title" sort={sort} onSort={toggleSort}>
                Listing
              </SortableHeader>
              <SortableHeader columnKey="kind" sort={sort} onSort={toggleSort}>
                Type
              </SortableHeader>
              <SortableHeader columnKey="district" sort={sort} onSort={toggleSort}>
                District
              </SortableHeader>
              <SortableHeader columnKey="price" sort={sort} onSort={toggleSort} align="right">
                Price
              </SortableHeader>
              <SortableHeader columnKey="rating" sort={sort} onSort={toggleSort} align="right">
                Rating
              </SortableHeader>
              <PlainHeader>Visibility</PlainHeader>
              <PlainHeader align="right">Moderation</PlainHeader>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <EmptyRow
                colSpan={7}
                title={rows.length === 0 ? "No listings in the database" : "Nothing matches this filter"}
                body={
                  rows.length === 0
                    ? "The homestays and experiences tables are empty, so there is nothing to moderate yet."
                    : "Switch the listing type filter back to all listings."
                }
              />
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-b border-border/70 last:border-0 hover:bg-muted/50">
                  <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                    {row.title}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {row.location}
                    </span>
                  </th>
                  <td className="px-4 py-3 text-muted-foreground">{KIND_LABEL[row.kind]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.district}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {formatINR(row.price)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {row.rating.toFixed(1)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={row.isActive ? "live" : "paused"} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant={row.featured ? "accent" : "outline"}
                        size="sm"
                        aria-pressed={row.featured}
                        onClick={() => toggleFeatured(row)}
                        aria-label={
                          row.featured ? `Unfeature ${row.title}` : `Feature ${row.title}`
                        }
                      >
                        {row.featured ? (
                          <Star className="size-4" aria-hidden="true" />
                        ) : (
                          <StarOff className="size-4" aria-hidden="true" />
                        )}
                        {row.featured ? "Featured" : "Feature"}
                      </Button>
                      {row.canToggleActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(row)}
                          aria-label={
                            row.isActive ? `Deactivate ${row.title}` : `Activate ${row.title}`
                          }
                        >
                          {row.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      ) : (
                        <span className="self-center px-2 text-xs text-muted-foreground">
                          Always live
                        </span>
                      )}
                    </div>
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
