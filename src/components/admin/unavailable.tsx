import { cn } from "@/lib/utils";

/** Shown in place of figures when the database is missing or a read failed. */
export function AdminUnavailable({ what, className }: { what: string; className?: string }) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-[var(--radius-lg)] border border-dashed border-border bg-surface p-10 text-center",
        className,
      )}
    >
      <p className="font-display text-lg text-foreground">{what} could not be loaded</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        The database is not configured on this deployment or did not answer. Nothing is shown
        rather than sample figures; reload to try again.
      </p>
    </div>
  );
}
