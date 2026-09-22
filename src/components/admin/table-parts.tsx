"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

export interface SortState<K extends string> {
  key: K;
  direction: SortDirection;
}

/** A sortable column header: a real `<th scope="col">` wrapping a button. */
export function SortableHeader<K extends string>({
  columnKey,
  sort,
  onSort,
  children,
  align = "left",
  className,
}: {
  columnKey: K;
  sort: SortState<K>;
  onSort: (key: K) => void;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  const isActive = sort.key === columnKey;
  const Icon = !isActive ? ChevronsUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <th
      scope="col"
      aria-sort={isActive ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
      className={cn("px-4 py-3 font-medium", align === "right" && "text-right", className)}
    >
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] text-xs uppercase tracking-wider transition-colors hover:text-foreground",
          isActive ? "text-foreground" : "text-muted-foreground",
          align === "right" && "flex-row-reverse",
        )}
      >
        {children}
        <Icon className="size-3.5" aria-hidden="true" />
      </button>
    </th>
  );
}

export function PlainHeader({
  children,
  align = "left",
  srOnly = false,
  className,
}: {
  children: ReactNode;
  align?: "left" | "right";
  srOnly?: boolean;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground",
        align === "right" && "text-right",
        className,
      )}
    >
      {srOnly ? <span className="sr-only">{children}</span> : children}
    </th>
  );
}

export function EmptyRow({ colSpan, title, body }: { colSpan: number; title: string; body: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14 text-center">
        <p className="font-display text-lg text-foreground">{title}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>
      </td>
    </tr>
  );
}

const STATUS_TONE: Record<string, string> = {
  pending: "bg-warning/12 text-warning",
  approved: "bg-success/12 text-success",
  confirmed: "bg-success/12 text-success",
  completed: "bg-primary/10 text-primary",
  rejected: "bg-destructive/12 text-destructive",
  cancelled: "bg-destructive/12 text-destructive",
  live: "bg-success/12 text-success",
  paused: "bg-warning/12 text-warning",
  draft: "bg-muted text-muted-foreground",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        STATUS_TONE[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

/** Horizontally scrollable, keyboard-reachable table wrapper. */
export function TableScroller({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={label}
      // `relative` matters: the table's sr-only <caption> is absolutely
      // positioned, and without a positioned scroll container it resolves its
      // containing block further up the tree, escaping this box and widening
      // the document to the table's full width on small screens.
      className="relative overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {children}
    </div>
  );
}

export function sortCompare(a: string | number, b: string | number, direction: SortDirection) {
  const factor = direction === "asc" ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return (a - b) * factor;
  return String(a).localeCompare(String(b)) * factor;
}
