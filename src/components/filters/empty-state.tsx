import { SearchX } from "lucide-react";
import type { ReactNode } from "react";

/** Shown when a dataset is empty or every row was filtered away. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sunken px-6 py-20 text-center">
      <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
      <h2 className="mt-5 font-display text-2xl">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
