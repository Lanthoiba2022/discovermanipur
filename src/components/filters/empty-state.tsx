import { SearchX } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Shown when a dataset is empty or every row was filtered away. The arch that
 * masks every card's photo returns here as the icon plate, so the empty slot
 * still reads as part of the same grid.
 */
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
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sand px-6 py-20 text-center">
      <span className="mask-arch grid size-14 place-items-center bg-surface text-[var(--stone-700)] shadow-[var(--shadow-sm)]">
        <SearchX className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-display text-2xl">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
