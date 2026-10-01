/**
 * Small presentational pieces shared by the community admin pages. No hooks
 * and no server imports, so both Server and Client Components can use them.
 *
 * Dates are formatted in India Standard Time by hand rather than with
 * `Intl`: Node's and each browser's ICU data can differ in spacing and
 * punctuation, and a mismatch between the server and client render is a
 * hydration error. IST has a fixed offset and no daylight saving, so plain
 * arithmetic gives the same string everywhere.
 */

import type { CommunityPlaceStatus } from "@/lib/community/rules";
import { STATUS_LABELS, type SubmitterRelationship } from "@/lib/community/taxonomy";
import { cn } from "@/lib/utils";

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const IST_OFFSET_MS = (5 * 60 + 30) * 60_000;

function inIst(iso: string) {
  const d = new Date(new Date(iso).getTime() + IST_OFFSET_MS);
  return { day: d.getUTCDate(), month: MONTHS[d.getUTCMonth()], year: d.getUTCFullYear(), hours: d.getUTCHours(), minutes: d.getUTCMinutes() };
}

/** "1 Oct 2026" */
export function formatDate(iso: string) {
  const { day, month, year } = inIst(iso);
  return `${day} ${month} ${year}`;
}

/** "1 Oct 2026, 2:05 pm IST" */
export function formatDateTime(iso: string) {
  const { day, month, year, hours, minutes } = inIst(iso);
  const clock = `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "am" : "pm"}`;
  return `${day} ${month} ${year}, ${clock} IST`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const n = (value: number) => value.toLocaleString("en-IN");

const STATUS_TONE: Record<CommunityPlaceStatus, string> = {
  held: "bg-warning/12 text-warning",
  pending: "bg-primary/10 text-primary",
  published: "bg-success/12 text-success",
  rejected: "bg-destructive/12 text-destructive",
};

/** The place's status in the same pill shape as the other admin tables. */
export function CommunityStatusPill({ status, className }: { status: CommunityPlaceStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        STATUS_TONE[status],
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}

const RELATIONSHIP_FLAG: Record<SubmitterRelationship, { label: string; tone: string }> = {
  owner: { label: "Owner or staff", tone: "border-warning/40 bg-warning/12 text-warning" },
  connected: { label: "Knows the owner", tone: "border-warning/40 bg-warning/12 text-warning" },
  none: { label: "No connection", tone: "border-border text-muted-foreground" },
};

/** Flags a submitter with a stake in the place, so it stands out in a list. */
export function RelationshipFlag({ relationship }: { relationship: SubmitterRelationship }) {
  const flag = RELATIONSHIP_FLAG[relationship];
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
        flag.tone,
      )}
    >
      {flag.label}
    </span>
  );
}
