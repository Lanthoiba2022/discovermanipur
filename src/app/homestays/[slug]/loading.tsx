import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="pb-24 pt-28 md:pt-32">
      <div className="shell">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-5 h-12 w-full max-w-xl" />
        <Skeleton className="mt-4 h-4 w-64" />

        <div className="mt-8 grid gap-3 md:grid-cols-2">
          <Skeleton className="aspect-[4/3] w-full rounded-[var(--radius)] md:aspect-auto md:min-h-[24rem]" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full rounded-[var(--radius)]" />
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="space-y-4">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-8 h-40 w-full rounded-[var(--radius-lg)]" />
          </div>
          <Skeleton className="h-[30rem] w-full rounded-[var(--radius-lg)]" />
        </div>
      </div>
    </div>
  );
}
