import { Skeleton } from "@/components/ui/skeleton";

export default function CommunityLoading() {
  return (
    <div className="pb-24" aria-busy="true" aria-label="Loading community places">
      <div className="bg-surface-sand pb-12 pt-28 md:pb-16 md:pt-32">
        <div className="shell pt-10 md:pt-14">
          <Skeleton className="h-3 w-28" />
          <div className="mt-9 grid gap-9 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Skeleton className="h-14 w-full max-w-lg" />
              <Skeleton className="mt-4 h-8 w-4/5 max-w-md" />
            </div>
            <div className="space-y-3 lg:col-span-5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-3 pt-5">
                <Skeleton className="h-11 w-36 rounded-full" />
                <Skeleton className="h-11 w-52 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="shell mt-16 flex flex-col gap-10 md:mt-20">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-56 w-full rounded-[var(--radius-lg)]" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[var(--radius-lg)] border border-border p-3">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="space-y-3 p-2 pt-4">
                <Skeleton className="h-3 w-1/3" />
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
