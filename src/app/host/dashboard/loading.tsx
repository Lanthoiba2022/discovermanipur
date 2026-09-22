import { Skeleton } from "@/components/ui/skeleton";

export default function HostDashboardLoading() {
  return (
    <div className="shell pb-24 pt-28 md:pt-32">
      <span className="sr-only" role="status">
        Loading your host dashboard
      </span>
      <Skeleton className="h-10 w-72" />
      <Skeleton className="mt-4 h-5 w-full max-w-xl" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-[var(--radius-lg)]" />
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-[var(--radius-lg)] lg:col-span-2" />
        <Skeleton className="h-80 rounded-[var(--radius-lg)]" />
      </div>
      <Skeleton className="mt-12 h-64 rounded-[var(--radius-lg)]" />
    </div>
  );
}
