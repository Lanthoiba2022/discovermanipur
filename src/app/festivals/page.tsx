import { CalendarHeart, PartyPopper } from "lucide-react";
import type { Metadata } from "next";

import { PageHero } from "@/components/content/page-hero";
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
    title: "Festivals of Manipur, month by month · Discover Manipur",
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
    <>
      <PageHero
        tone="dark"
        eyebrow="The year in colour"
        title="Festivals"
        completion="Manipur measures the year in drums, boat races and bonfires."
        lede={
          <p>
            The whole calendar, January to December, so you can land in the middle of one — the
            lily on Shirui, the Sangai in Keibul Lamjao, Yaoshang colour across the valley.
          </p>
        }
        image={{
          src: "/file-uploads/manipuri-dancer-solo.webp",
          alt: "A Manipuri classical dancer mid-gesture in orange costume against a black stage.",
        }}
        figures={[
          {
            value: String(festivals.length),
            label: festivals.length === 1 ? "Festival mapped" : "Festivals mapped",
          },
          { value: String(monthsCovered), label: "Months covered" },
          { value: String(districtCount), label: "Districts" },
          {
            value: spotlightMonth ?? "—",
            label: onNow.length > 0 ? "On now" : "Next up",
          },
        ]}
      />

      {/* ------------------------------------------------------- what's on now */}
      {spotlight.length > 0 && (
        <section
          aria-labelledby="festivals-spotlight"
          className="border-b border-border bg-surface-sand py-16 md:py-20"
        >
          <div className="shell-mid">
            <Reveal>
              <p className="eyebrow rule-flank rule-flank-start mb-4 text-brass-700 [.dark_&]:text-brass-300">
                <CalendarHeart className="size-4" aria-hidden />
                {onNow.length > 0 ? `On now — ${spotlightMonth}` : `Next up — ${spotlightMonth}`}
              </p>
              <h2 id="festivals-spotlight" className="text-headline">
                {onNow.length > 0
                  ? "Happening while you plan"
                  : "Nothing this month — here is what comes next"}
              </h2>
            </Reveal>
            <ul className="mt-9 grid grid-cols-1 gap-4 lg:grid-cols-2">
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
      <section aria-labelledby="festival-calendar" className="shell py-16 md:py-24">
        <h2 id="festival-calendar" className="sr-only">
          Festival calendar, January to December
        </h2>

        {festivals.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sunken px-6 py-20 text-center">
            <span className="mb-5 grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
              <PartyPopper className="size-6" aria-hidden />
            </span>
            <p className="text-title">The calendar is being filled in</p>
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
    </>
  );
}
