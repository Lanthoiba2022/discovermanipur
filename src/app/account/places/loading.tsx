import { Skeleton } from "@/components/ui/skeleton";

export default function MyPlacesLoading() {
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">
        Loading your places
      </span>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <div className="mt-8 space-y-4">
        <Skeleton className="h-32 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-32 w-full rounded-[var(--radius-lg)]" />
      </div>
    </div>
  );
}
