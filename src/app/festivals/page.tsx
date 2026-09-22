import { CalendarHeart, PartyPopper } from "lucide-react";
import type { Metadata } from "next";

import { FestivalCard } from "@/components/places/festival-card";
import {
  bucketByMonth,
  FestivalTimeline,
  MonthRail,
} from "@/components/places/festival-timeline";
import { MONTHS, PLACEHOLDER_IMAGE } from "@/components/places/taxonomy";
import { Reveal } from "@/components/motion/reveal";
import { getFestivals } from "@/lib/data";

/** The "what's on now" band is date-aware, so refresh the shell once a day. */
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Festivals of Manipur, month by month",
  description:
    "Sangai, Yaoshang, Lai Haraoba, Kut, Ningol Chakouba — Manipur's festival calendar laid out January to December so you can time your trip to the drums.",
  openGraph: {
    title: "Festivals of Manipur, month by month · Manipur Tourism",
    description:
      "Manipur's festival calendar from January to December — plan your trip around the drums.",
    images: [
      { url: PLACEHOLDER_IMAGE, width: 1200, height: 630, alt: "A Manipuri festival in full colour" },
    ],
  },
};

export default async function FestivalsPage() {
  const festivals = await getFestivals();
  const buckets = bucketByMonth(festivals);
  const currentMonth = new Date().getMonth();

  const onNow = buckets[currentMonth]?.festivals ?? [];
  // Wrap around the year to find the next month that actually has something on.
  const nextBucket = [
    ...buckets.slice(currentMonth + 1),
    ...buckets.slice(0, currentMonth),
  ].find((b) => b.festivals.length > 0);

  const spotlight = onNow.length > 0 ? onNow : (nextBucket?.festivals ?? []);
  const spotlightMonth = onNow.length > 0 ? MONTHS[currentMonth] : nextBucket?.name;
  const monthsCovered = new Set(festivals.map((f) => f.month)).size;
  const districtCount = new Set(festivals.map((f) => f.district).filter(Boolean)).size;

  return (
    <main id="main">
      {/* ---------------------------------------------------------- hero band */}
      <section
        data-hero-tone="dark"
        className="relative overflow-hidden bg-leirum-700 text-cream-50 pt-28 md:pt-32"
      >
        <div
          aria-hidden
          className="blob-phumdi animate-float-slow absolute -left-24 top-0 size-[26rem] bg-shirui-400/25 blur-3xl"
        />
        <div className="shell relative pb-16 md:pb-24">
          <p className="eyebrow mb-5 flex items-center gap-3 text-brass-400">
            <span className="weave-rule inline-block h-[3px] w-10 rounded-full" />
            The year in colour
          </p>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <h1 className="text-display">Festivals</h1>
              <p className="text-lead mt-7 max-w-[52ch] text-ivory-200">
                Manipur measures the year in drums, boat races and bonfires. Here is the whole
                calendar — January to December — so you can land in the middle of one.
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-7 self-end lg:col-span-4 lg:col-start-9">
              <div className="border-t border-ivory-50/20 pt-4">
                <dd className="font-display text-4xl leading-none text-brass-400">
                  {festivals.length}
                </dd>
                <dt className="eyebrow mt-2.5 text-ivory-200/70">
                  {festivals.length === 1 ? "Festival mapped" : "Festivals mapped"}
                </dt>
              </div>
              <div className="border-t border-ivory-50/20 pt-4">
                <dd className="font-display text-4xl leading-none text-brass-400">
                  {monthsCovered}
                </dd>
                <dt className="eyebrow mt-2.5 text-ivory-200/70">Months covered</dt>
              </div>
              <div className="border-t border-ivory-50/20 pt-4">
                <dd className="font-display text-4xl leading-none text-brass-400">
                  {districtCount}
                </dd>
                <dt className="eyebrow mt-2.5 text-ivory-200/70">Districts</dt>
              </div>
              <div className="border-t border-ivory-50/20 pt-4">
                <dd className="font-display text-4xl leading-none text-brass-400">
                  {spotlightMonth}
                </dd>
                <dt className="eyebrow mt-2.5 text-ivory-200/70">
                  {onNow.length > 0 ? "On now" : "Next up"}
                </dt>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- what's on now */}
      {spotlight.length > 0 && (
        <section className="border-b border-border bg-surface-sunken py-12 md:py-16">
          <div className="shell">
            <Reveal>
              <p className="eyebrow mb-3 flex items-center gap-2 text-primary">
                <CalendarHeart className="size-4" aria-hidden />
                {onNow.length > 0 ? `On now — ${spotlightMonth}` : `Next up — ${spotlightMonth}`}
              </p>
              <h2 className="font-display text-3xl">
                {onNow.length > 0
                  ? "Happening while you plan"
                  : "Nothing this month — here is what comes next"}
              </h2>
            </Reveal>
            <ul className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {spotlight.slice(0, 4).map((festival, index) => (
                <Reveal as="li" key={festival.id || festival.slug} delayIndex={index}>
                  <FestivalCard festival={festival} highlight className="h-full" />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ calendar */}
      <section className="shell py-16 md:py-24">
        <h2 className="sr-only">Festival calendar, January to December</h2>

        {festivals.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sunken px-6 py-20 text-center">
            <span className="mb-5 grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
              <PartyPopper className="size-6" aria-hidden />
            </span>
            <p className="font-display text-2xl">The calendar is being filled in</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Sangai, Yaoshang, Lai Haraoba, Kut and the rest of Manipur&apos;s year are being
              catalogued. Check back shortly.
            </p>
          </div>
        ) : (
          <div className="grid min-w-0 gap-10 lg:grid-cols-[14rem_1fr] lg:gap-16">
            <MonthRail buckets={buckets} currentMonth={currentMonth} />
            <div className="min-w-0">
              <FestivalTimeline buckets={buckets} currentMonth={currentMonth} />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
