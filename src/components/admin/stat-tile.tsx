import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  hint,
  delta,
  deltaIsGood = true,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  delta?: string;
  deltaIsGood?: boolean;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && (
          <span className="rounded-full bg-muted p-2 text-primary" aria-hidden="true">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-3 font-sans text-3xl font-semibold leading-none text-foreground">{value}</p>
      {(delta || hint) && (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {delta && (
            <span className={deltaIsGood ? "font-medium text-success" : "font-medium text-destructive"}>
              {delta}
            </span>
          )}
          {hint && <span>{hint}</span>}
        </p>
      )}
    </div>
  );
}
