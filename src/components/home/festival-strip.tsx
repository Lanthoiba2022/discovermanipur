import Image from "next/image";
import Link from "next/link";

import { meiteiAlias } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Festival } from "@/types";

import { Band, BandHeader } from "./band";
import { EmptyNote } from "./empty-note";

/**
 * The year, as a timeline you can travel by.
 *
 * Horizontal because a calendar genuinely is one axis — but it is an ordinary
 * scroll container: native touch and trackpad scrolling, a visible scrollbar,
 * a real link per festival, and the full calendar one click away in the
 * masthead. Nothing here intercepts the page's vertical scroll.
 */
export function FestivalStrip({ festivals }: { festivals: Festival[] }) {
  return (
    <Band tone="crimson" measure="mid" pad="md" label="The festival year">
      <BandHeader
        tone="crimson"
        eyebrow="The year"
        word="A calendar."
        completion="That you can travel by."
        standfirst="Manipur keeps time in festivals — spring colour, harvest feasts, a ten-day November that pulls the whole state into Imphal."
        action={
          <Button
            asChild
            variant="outline"
            size="pill"
            className="w-fit border-ivory-50/40 text-ivory-50 hover:bg-ivory-50 hover:text-ningthou-900"
          >
            <Link href="/festivals">Full calendar</Link>
          </Button>
        }
      />

      {festivals.length === 0 ? (
        <EmptyNote
          title="The calendar is being set"
          body="Festival dates appear here once the year's programme is published."
          href="/festivals"
          cta="See the festivals page"
        />
      ) : (
        <div className="relative">
          <div
            aria-hidden
            className="weave-rule absolute inset-x-0 top-[3.1rem] h-[3px] rounded-full opacity-45"
          />
          <ol className="-mx-4 flex gap-5 overflow-x-auto px-4 pb-5 md:-mx-8 md:gap-7 md:px-8 [scrollbar-color:var(--brass-400)_transparent] [scrollbar-width:thin]">
            {festivals.map((f) => (
              <li key={f.id} className="w-[16.5rem] shrink-0 sm:w-[18.5rem]">
                <Link
                  href={`/festivals/${f.slug}`}
                  className="group block rounded-[var(--radius)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  <p className="eyebrow text-brass-300">{f.month}</p>
                  <span
                    aria-hidden
                    className="mt-3 block size-3.5 rounded-full border-2 border-brass-400 bg-ningthou-900 transition-colors duration-200 ease-[var(--ease-flat)] group-hover:bg-brass-400"
                  />
                  <div className="relative mt-6 aspect-[4/3] w-full overflow-hidden rounded-[var(--radius)] bg-ningthou-800">
                    {f.images[0]?.src && (
                      <Image
                        src={f.images[0].src}
                        alt={f.images[0].alt || f.name}
                        fill
                        sizes="(max-width: 640px) 70vw, 19rem"
                        className="object-cover transition-transform duration-[600ms] ease-[var(--ease-flat)] group-hover:scale-[1.05]"
                      />
                    )}
                  </div>
                  {/* Festival names are never clamped. */}
                  <h3 className="mt-5 font-display text-[1.375rem] leading-[1.15] text-ivory-50">
                    {f.name}
                  </h3>
                  {meiteiAlias(f.name, f.meiteiName) && (
                    <p className="font-mayek text-sm text-lily-300">
                      {meiteiAlias(f.name, f.meiteiName)}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">{f.typicalDates}</p>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Band>
  );
}
