import { Suspense, type ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { ClearFilters } from "./clear-filters";

/**
 * Layout shell for a row of URL-driven filter controls. Stays a Server
 * Component; the controls it wraps are the only client code.
 */
export function FilterBar({
  children,
  resultCount,
  resultNoun,
  className,
}: {
  children: ReactNode;
  resultCount: number;
  resultNoun: string;
  className?: string;
}) {
  return (
    <section
      aria-label="Filters"
      className={cn(
        "rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-sm)] md:p-6",
        className,
      )}
    >
      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <div className="flex flex-col gap-6">{children}</div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{resultCount}</span>{" "}
            {resultCount === 1 ? resultNoun : `${resultNoun}s`}
          </p>
          <ClearFilters />
        </div>
      </Suspense>
    </section>
  );
}

/** Horizontal group for dropdown-style filters. */
export function FilterRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-end gap-4">{children}</div>;
}
