import { Skeleton } from "@/components/ui/skeleton";

export default function FestivalsLoading() {
  return (
    <div className="pt-28 md:pt-32" aria-busy="true" aria-label="Loading the festival calendar">
      <div className="bg-leirum-700 pb-16 md:pb-24">
        <div className="shell">
          <Skeleton className="h-3 w-32 bg-cream-50/20" />
          <Skeleton className="mt-6 h-24 w-72 bg-cream-50/20 md:h-32" />
          <Skeleton className="mt-7 h-16 w-full max-w-xl bg-cream-50/20" />
        </div>
      </div>

      <div className="shell grid gap-10 py-16 lg:grid-cols-[14rem_1fr] lg:gap-16 md:py-24">
        <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />
        <div className="space-y-12">
          {Array.from({ length: 3 }).map((_, month) => (
            <div key={month} className="space-y-5">
              <Skeleton className="h-8 w-40" />
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {Array.from({ length: 2 }).map((_, card) => (
                  <Skeleton key={card} className="h-36 w-full rounded-[var(--radius-lg)]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
