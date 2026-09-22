import { Skeleton } from "@/components/ui/skeleton";

export default function HotspotDetailLoading() {
  return (
    <div aria-busy="true" aria-label="Loading this place">
      <Skeleton className="h-[72vh] w-full rounded-none md:h-[82vh]" />
      <div className="shell grid gap-12 py-16 lg:grid-cols-[1fr_20rem] lg:gap-16 md:py-20">
        <div className="max-w-3xl space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="mt-10 h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full" />
            ))}
          </div>
        </div>
        <Skeleton className="h-[30rem] w-full rounded-[var(--radius-lg)]" />
      </div>
    </div>
  );
}
