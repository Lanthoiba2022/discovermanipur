import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import type { Festival } from "@/types";

import { FestivalCard } from "./festival-card";
import { MONTHS, monthIndexOf } from "./taxonomy";

export interface MonthBucket {
  index: number;
  name: string;
  slug: string;
  festivals: Festival[];
}

/** Group festivals into Jan→Dec buckets; unparseable months land in December's tail. */
export function bucketByMonth(festivals: Festival[]): MonthBucket[] {
  const buckets: MonthBucket[] = MONTHS.map((name, index) => ({
    index,
    name,
    slug: name.toLowerCase(),
    festivals: [],
  }));

  for (const festival of festivals) {
    const index = monthIndexOf(festival.month ?? "");
    buckets[index >= 0 ? index : buckets.length - 1].festivals.push(festival);
  }

  return buckets;
}

/** Sticky month rail: jump straight to the month you are travelling in. */
export function MonthRail({
  buckets,
  currentMonth,
}: {
  buckets: MonthBucket[];
  currentMonth: number;
}) {
  return (
    <nav aria-label="Jump to a month" className="min-w-0 lg:sticky lg:top-28 lg:h-fit">
      <p className="eyebrow mb-4 text-muted-foreground">The year</p>
      <ol className="flex snap-x gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
        {buckets.map((bucket) => {
          const empty = bucket.festivals.length === 0;
          const isNow = bucket.index === currentMonth;
          return (
            <li key={bucket.slug} className="snap-start lg:border-l lg:border-border">
              <a
                href={`#month-${bucket.slug}`}
                aria-current={isNow ? "true" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm transition-colors lg:-ml-px lg:rounded-none lg:border-l-2 lg:px-4",
                  empty
                    ? "text-muted-foreground/60 lg:border-transparent"
                    : "text-foreground hover:bg-muted lg:border-transparent lg:hover:border-border-strong",
                  isNow && "font-semibold text-primary lg:border-primary",
                )}
              >
                <span className="lg:hidden">{bucket.name.slice(0, 3)}</span>
                <span className="hidden lg:inline">{bucket.name}</span>
                {!empty && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      isNow ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {bucket.festivals.length}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** The Jan→Dec timeline itself: every month is present, even the quiet ones. */
export function FestivalTimeline({
  buckets,
  currentMonth,
}: {
  buckets: MonthBucket[];
  currentMonth: number;
}) {
  return (
    <ol className="space-y-12">
      {buckets.map((bucket) => (
        <li
          key={bucket.slug}
          id={`month-${bucket.slug}`}
          className="scroll-mt-28 md:scroll-mt-32"
        >
          <div className="mb-5 flex items-baseline gap-4">
            <h3
              className={cn(
                "font-display text-2xl md:text-3xl",
                bucket.festivals.length === 0 && "text-muted-foreground",
              )}
            >
              {bucket.name}
            </h3>
            {bucket.index === currentMonth && (
              <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-foreground">
                This month
              </span>
            )}
            <span className="weave-rule h-[3px] flex-1 rounded-full opacity-40" aria-hidden />
          </div>

          {bucket.festivals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              A quiet month: good weather, fewer crowds.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {bucket.festivals.map((festival, index) => (
                <Reveal as="li" key={festival.id || festival.slug} delayIndex={index % 4}>
                  <FestivalCard
                    festival={festival}
                    highlight={bucket.index === currentMonth}
                    className="h-full"
                  />
                </Reveal>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}
