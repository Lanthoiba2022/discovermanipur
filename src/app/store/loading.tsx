import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="shell pb-24 pt-28 md:pt-32">
      <Skeleton className="h-4 w-56" />
      <Skeleton className="mt-5 h-14 w-full max-w-2xl" />
      <Skeleton className="mt-5 h-20 w-full max-w-xl" />
      <Skeleton className="mt-12 h-44 w-full rounded-[var(--radius-lg)]" />
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-3">
            <Skeleton className="aspect-[4/3] w-full rounded-[var(--radius-lg)]" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
