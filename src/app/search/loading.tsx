import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="pt-28 md:pt-32">
      <div className="shell py-10 md:py-16">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-6 h-12 w-full max-w-lg" />
        <Skeleton className="mt-8 h-14 w-full max-w-xl rounded-[var(--radius)]" />

        <div className="mt-12 flex flex-wrap gap-2 border-b border-border pb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-[var(--radius-lg)]" />
          ))}
        </div>
      </div>
    </div>
  );
}
