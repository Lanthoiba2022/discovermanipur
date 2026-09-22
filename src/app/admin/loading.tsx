import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div>
      <span className="sr-only" role="status">
        Loading the admin view
      </span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-[var(--radius-lg)]" />
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-80 rounded-[var(--radius-lg)] lg:col-span-3" />
        <Skeleton className="h-80 rounded-[var(--radius-lg)] lg:col-span-2" />
      </div>
    </div>
  );
}
