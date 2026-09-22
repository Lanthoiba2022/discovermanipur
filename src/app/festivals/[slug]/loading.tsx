import { Skeleton } from "@/components/ui/skeleton";

export default function FestivalDetailLoading() {
  return (
    <div aria-busy="true" aria-label="Loading this festival">
      <Skeleton className="h-[64vh] w-full rounded-none md:h-[74vh]" />
      <div className="shell grid gap-12 py-16 lg:grid-cols-[1fr_18rem] lg:gap-16 md:py-20">
        <div className="max-w-3xl space-y-4">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/5" />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full" />
            ))}
          </div>
        </div>
        <Skeleton className="h-80 w-full rounded-[var(--radius-lg)]" />
      </div>
    </div>
  );
}
