import { Skeleton } from "@/components/ui/skeleton";

/**
 * A community place renders per request (the viewer's session decides what
 * they may see), so without this the previous page sat on screen with no
 * feedback until that render finished. Mirrors the page: light `PageHero`,
 * back link, then the article and the quick-facts aside.
 */
export default function CommunityPlaceLoading() {
  return (
    <div className="pb-24" aria-busy="true" aria-label="Loading this place">
      <div className="chapter-light pt-28 md:pt-32">
        <div className="shell">
          <div className="border-b border-border-strong pb-12 pt-10 md:pb-16 md:pt-14">
            <Skeleton className="h-3 w-28" />
            <div className="mt-7 md:mt-9 lg:w-7/12">
              <Skeleton className="h-12 w-full max-w-lg md:h-14" />
              <Skeleton className="mt-7 h-5 w-64" />
              <div className="mt-8 flex flex-wrap gap-3">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-11 w-40 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="shell mt-10 md:mt-12">
        <Skeleton className="h-4 w-44" />
      </div>

      <div className="shell mt-12 grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
        <div className="min-w-0 max-w-3xl">
          <Skeleton className="h-9 w-56" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-11/12" />
            <Skeleton className="h-5 w-3/5" />
          </div>
          <Skeleton className="mt-14 h-8 w-32" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Skeleton className="aspect-[4/3] w-full rounded-[var(--radius-lg)]" />
            <Skeleton className="aspect-[4/3] w-full rounded-[var(--radius-lg)]" />
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 lg:h-fit">
          <Skeleton className="h-3 w-24" />
          <div className="mt-5 space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-4 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
