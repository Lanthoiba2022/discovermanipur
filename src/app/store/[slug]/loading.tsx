import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="shell pb-24 pt-28 md:pt-32">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-6 h-6 w-32 rounded-full" />
      <Skeleton className="mt-4 h-12 w-full max-w-2xl" />
      <Skeleton className="mt-4 h-5 w-64" />
      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-6">
          <Skeleton className="aspect-[16/10] w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
        </div>
        <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />
      </div>
    </div>
  );
}
