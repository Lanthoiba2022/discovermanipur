import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="pb-24 pt-28 md:pt-32">
      <div className="shell">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-6 h-14 w-full max-w-2xl" />
        <Skeleton className="mt-4 h-20 w-full max-w-3xl" />
        <Skeleton className="mt-10 h-40 w-full rounded-[var(--radius-lg)]" />

        <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] w-full rounded-[var(--radius-lg)]" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
