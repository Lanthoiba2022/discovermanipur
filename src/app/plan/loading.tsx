import { Skeleton } from "@/components/ui/skeleton";

export default function PlanLoading() {
  return (
    <div className="pb-20 pt-28 md:pb-28 md:pt-32">
      <div className="shell">
        <div className="mb-10 max-w-3xl space-y-4 md:mb-12">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-12 w-full max-w-xl" />
          <Skeleton className="h-5 w-full max-w-2xl" />
          <Skeleton className="h-5 w-3/4 max-w-xl" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-10">
          <div className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-13 w-full" />
          </div>

          <Skeleton className="h-[min(72dvh,42rem)] w-full rounded-[var(--radius-lg)]" />
        </div>
      </div>
    </div>
  );
}
