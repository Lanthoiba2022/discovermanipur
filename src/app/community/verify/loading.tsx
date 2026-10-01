import { Skeleton } from "@/components/ui/skeleton";

export default function VerifyLoading() {
  return (
    <div className="pb-24" aria-busy="true" aria-label="Loading places waiting for votes">
      <div className="border-b border-border pb-12 pt-28 md:pb-16 md:pt-32">
        <div className="shell pt-10 md:pt-14">
          <Skeleton className="h-3 w-36" />
          <div className="mt-9 grid gap-9 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Skeleton className="h-14 w-full max-w-lg" />
              <Skeleton className="mt-4 h-8 w-3/4 max-w-sm" />
            </div>
            <div className="space-y-3 lg:col-span-5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      </div>

      <div className="shell mt-16 md:mt-20">
        <Skeleton className="h-10 w-56" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[var(--radius-lg)] border border-border p-3">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="space-y-3 p-2 pt-4">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-4 h-8 w-1/3" />
                <Skeleton className="h-11 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
