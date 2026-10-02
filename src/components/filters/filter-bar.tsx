import { SlidersHorizontal } from "lucide-react";
import { Suspense, type ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { ClearFilters } from "./clear-filters";

/**
 * Layout shell for a row of URL-driven filter controls. Stays a Server
 * Component; the controls it wraps are the only client code.
 *
 * It sits on the sand ground rather than on white so that a page of white
 * cards has something to sit against, and its result count is the one live
 * region on the page.
 *
 * The count comes one of two ways. A server-filtered page (/community) passes
 * the number it rendered as `resultCount`. A static listing filters in the
 * browser, so the number the server knows is only the unfiltered total; it
 * passes that as `resultCount` and a live client count (`ListingResultCount`)
 * as `resultSlot`, which is rendered in place of the static number inside the
 * same `aria-live` paragraph.
 *
 * The Suspense boundary is for server-mode controls, which read
 * `useSearchParams()`. Client-mode controls (under
 * `FilterUrlModeProvider mode="client"`) do not suspend, so on a static
 * listing the bar is prerendered in full rather than as the skeleton.
 */
export function FilterBar({
  children,
  resultCount,
  resultNoun,
  resultSlot,
  className,
}: {
  children: ReactNode;
  resultCount: number;
  resultNoun: string;
  /** Replaces the static count, e.g. `<ListingResultCount total noun />`. */
  resultSlot?: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label="Filters"
      className={cn(
        "rounded-[var(--radius-lg)] border border-border bg-surface-sand p-5 shadow-[var(--shadow-sm)] md:p-6",
        className,
      )}
    >
      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <p className="eyebrow mb-5 flex items-center gap-2 text-[var(--stone-700)]">
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          Narrow it down
        </p>
        <div className="flex flex-col gap-6">{children}</div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border-strong pt-4">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {resultSlot ?? (
              <>
                <span className="font-display text-lg text-foreground">{resultCount}</span>{" "}
                {resultCount === 1 ? resultNoun : `${resultNoun}s`}
              </>
            )}
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
