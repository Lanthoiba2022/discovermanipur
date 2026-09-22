import { Skeleton } from "@/components/ui/skeleton";

export default function HotspotsLoading() {
  return (
    <div className="pt-28 md:pt-32" aria-busy="true" aria-label="Loading places">
      <div className="bg-primary pb-16 md:pb-24">
        <div className="shell">
          <Skeleton className="h-3 w-24 bg-cream-50/20" />
          <Skeleton className="mt-6 h-24 w-64 bg-cream-50/20 md:h-32" />
          <Skeleton className="mt-7 h-16 w-full max-w-xl bg-cream-50/20" />
        </div>
      </div>

      <div className="shell grid gap-10 py-12 lg:grid-cols-[18rem_1fr] lg:gap-12 md:py-16">
        <Skeleton className="h-[26rem] w-full rounded-[var(--radius-lg)]" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
