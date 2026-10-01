"use client";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HOST_TYPE_LABEL, type HostApplicationRecord } from "@/lib/host/types";
import type { ApplicationStatus } from "@/types";

type SortKey = "applicantName" | "hostType" | "district" | "createdAt" | "status";

const ALL = "all";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ApplicationsTable({ initial }: { initial: HostApplicationRecord[] }) {
  const [rows, setRows] = useState(initial);
  const [status, setStatus] = useState<string>(ALL);
  const [hostType, setHostType] = useState<string>(ALL);
  const [district, setDistrict] = useState<string>(ALL);
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "createdAt", direction: "desc" });
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const districts = useMemo(
    () => [...new Set(initial.map((r) => r.district))].sort(),
    [initial],
  );

  const filtered = useMemo(() => {
    const out = rows.filter(
      (r) =>
        (status === ALL || r.status === status) &&
        (hostType === ALL || r.hostType === hostType) &&
        (district === ALL || r.district === district),
    );
    return out.sort((a, b) => sortCompare(a[sort.key], b[sort.key], sort.direction));
  }, [rows, status, hostType, district, sort]);

  const open = rows.find((r) => r.id === openId) ?? null;
  const filtersActive = status !== ALL || hostType !== ALL || district !== ALL;

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, direction: s.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" },
    );
  }

  function review(id: string) {
    const row = rows.find((r) => r.id === id);
    setNotes(row?.adminNotes ?? "");
    setOpenId(id);
  }

  function decide(id: string, next: ApplicationStatus) {
    const trimmed = notes.trim();
    if (next === "rejected" && trimmed.length < 10) {
      toast.error("Add a reason before rejecting", {
        description: "Applicants see this note, so it needs at least a line of explanation.",
      });
      return;
    }
    // Local state only: decisions are not persisted anywhere yet.
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: next, adminNotes: trimmed || undefined } : r,
      ),
    );
    setOpenId(null);
    const row = rows.find((r) => r.id === id);
    toast.success(`${row?.propertyName ?? "Application"} ${next}`, {
      description:
        next === "approved"
          ? "The host can now publish their listing."
          : "The applicant has been sent your note.",
    });
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="sm:w-44">
          <Label htmlFor="filter-status" className="mb-1.5 block text-xs text-muted-foreground">
            Status
          </Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="filter-status" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="sm:w-44">
          <Label htmlFor="filter-type" className="mb-1.5 block text-xs text-muted-foreground">
            Host type
          </Label>
          <Select value={hostType} onValueChange={setHostType}>
            <SelectTrigger id="filter-type" aria-label="Filter by host type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All host types</SelectItem>
              {Object.entries(HOST_TYPE_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:w-48">
          <Label htmlFor="filter-district" className="mb-1.5 block text-xs text-muted-foreground">
            District
          </Label>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger id="filter-district" aria-label="Filter by district">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All districts</SelectItem>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground sm:ml-auto sm:pb-3" aria-live="polite">
          {filtered.length} of {rows.length} applications
        </p>
      </div>

      <TableScroller label="Host applications">
        <table className="w-full min-w-[54rem] border-collapse text-sm">
          <caption className="sr-only">
            Host applications with status, host type, district and submission date
          </caption>
          <thead className="border-b border-border bg-surface-sunken text-left">
            <tr>
              <SortableHeader columnKey="applicantName" sort={sort} onSort={toggleSort}>
                Applicant
              </SortableHeader>
              <PlainHeader>Property</PlainHeader>
              <SortableHeader columnKey="hostType" sort={sort} onSort={toggleSort}>
                Type
              </SortableHeader>
              <SortableHeader columnKey="district" sort={sort} onSort={toggleSort}>
                District
              </SortableHeader>
              <SortableHeader columnKey="createdAt" sort={sort} onSort={toggleSort}>
                Submitted
              </SortableHeader>
              <SortableHeader columnKey="status" sort={sort} onSort={toggleSort}>
                Status
              </SortableHeader>
              <PlainHeader align="right" srOnly>
                Actions
              </PlainHeader>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <EmptyRow
                colSpan={7}
                title={filtersActive ? "No applications match these filters" : "The queue is empty"}
                body={
                  filtersActive
                    ? "Widen the status, host type or district filter to see more of the queue."
                    : "New host applications land here the moment they are submitted from /host/apply."
                }
              />
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-b border-border/70 last:border-0 hover:bg-muted/50">
                  <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                    {row.applicantName}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {row.reference}
                    </span>
                  </th>
                  <td className="px-4 py-3 text-muted-foreground">{row.propertyName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{HOST_TYPE_LABEL[row.hostType]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.district}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => review(row.id)}
                      aria-label={`Review application from ${row.applicantName} for ${row.propertyName}`}
                    >
                      Review
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableScroller>

      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-w-2xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{open.propertyName}</DialogTitle>
                <DialogDescription>
                  {HOST_TYPE_LABEL[open.hostType]} · {open.district} · {open.reference}
                </DialogDescription>
              </DialogHeader>

              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">Applicant</dt>
                  <dd className="mt-1 text-sm text-foreground">{open.applicantName}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">Submitted</dt>
                  <dd className="mt-1 text-sm text-foreground">{formatDate(open.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">Contact</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    <a className="hover:underline" href={`mailto:${open.email}`}>
                      {open.email}
                    </a>
                    <span className="block text-muted-foreground">{open.phone}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                    Capacity · photos
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {open.capacity} guests · {open.photoCount} photos
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">Address</dt>
                  <dd className="mt-1 text-sm text-foreground">{open.propertyAddress}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                    What they offer
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {open.description}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                    Current status
                  </dt>
                  <dd className="mt-1">
                    <StatusPill status={open.status} />
                  </dd>
                </div>
              </dl>

              <div className="mt-5">
                <Label htmlFor="admin-notes">Admin notes</Label>
                <Textarea
                  id="admin-notes"
                  className="mt-1.5"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What did you verify? A rejection needs a reason the applicant can act on."
                />
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpenId(null)}>
                  Close
                </Button>
                <Button variant="destructive" onClick={() => decide(open.id, "rejected")}>
                  Reject
                </Button>
                <Button onClick={() => decide(open.id, "approved")}>Approve</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
