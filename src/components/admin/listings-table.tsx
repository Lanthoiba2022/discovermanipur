"use client";

import { Star, StarOff } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR } from "@/lib/utils";

export interface ModerationRow {
  id: string;
  title: string;
  kind: "Homestay" | "Experience";
  district: string;
  location: string;
  price: number;
  rating: number;
  featured: boolean;
  isActive: boolean;
}

type SortKey = "title" | "kind" | "district" | "price" | "rating";

const ALL = "all";

export function ListingsTable({ initial }: { initial: ModerationRow[] }) {
  const [rows, setRows] = useState(initial);
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

  function toggleFeatured(id: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        toast.success(r.featured ? `${r.title} unfeatured` : `${r.title} featured`);
        return { ...r, featured: !r.featured };
      }),
    );
  }

  function toggleActive(id: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        toast.success(r.isActive ? `${r.title} deactivated` : `${r.title} back online`, {
          description: r.isActive
            ? "It is hidden from search and no longer bookable."
            : "Travellers can find and book it again.",
        });
        return { ...r, isActive: !r.isActive };
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
              <SelectItem value="Homestay">Homestays</SelectItem>
              <SelectItem value="Experience">Experiences</SelectItem>
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
            Published homestays and experiences with their feature and visibility state
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
                title={rows.length === 0 ? "No listings published yet" : "Nothing matches this filter"}
                body={
                  rows.length === 0
                    ? "Approved hosts publish homestays and experiences here; the catalogue is empty for now."
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
                  <td className="px-4 py-3 text-muted-foreground">{row.kind}</td>
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
                        onClick={() => toggleFeatured(row.id)}
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
                      <Button
                        variant="outline"
                        size="sm"
                        aria-pressed={!row.isActive}
                        onClick={() => toggleActive(row.id)}
                        aria-label={
                          row.isActive ? `Deactivate ${row.title}` : `Activate ${row.title}`
                        }
                      >
                        {row.isActive ? "Deactivate" : "Activate"}
                      </Button>
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
