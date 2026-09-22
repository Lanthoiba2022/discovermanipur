import Image from "next/image";
import Link from "next/link";

import { meiteiAlias } from "@/lib/utils";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import type { Festival } from "@/types";

import { EmptyNote } from "./empty-note";

export function FestivalStrip({ festivals }: { festivals: Festival[] }) {
  return (
    <Section
      tone="crimson"
      eyebrow="The year"
      title="A calendar you can travel by"
      description="Manipur keeps time in festivals — spring colour, harvest feasts, a ten-day November that pulls the whole state into Imphal."
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
    >
      {festivals.length === 0 ? (
        <EmptyNote
          title="The calendar is being set"
          body="Festival dates will appear here once the year's programme is published."
          href="/festivals"
          cta="See the festivals page"
        />
      ) : (
        <div className="relative">
          <div
            aria-hidden
            className="weave-rule absolute inset-x-0 top-[3.25rem] h-[3px] rounded-full opacity-40"
          />
          <ol className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 md:-mx-8 md:gap-6 md:px-8 [scrollbar-width:thin]">
            {festivals.map((f) => (
              <li key={f.id} className="w-[17rem] shrink-0 sm:w-[19rem]">
                <Link
                  href={`/festivals/${f.slug}`}
                  className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  <p className="eyebrow text-muted-foreground">{f.month}</p>
                  <span
                    aria-hidden
                    className="mt-3 block size-3 rounded-full border-2 border-brass-400 bg-ningthou-900 transition-colors group-hover:bg-brass-400"
                  />
                  <div className="relative mt-5 aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-lg)] bg-muted">
                    {f.images[0]?.src && (
                      <Image
                        src={f.images[0].src}
                        alt={f.images[0].alt || f.name}
                        fill
                        sizes="(max-width: 640px) 70vw, 19rem"
                        className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                      />
                    )}
                  </div>
                  <h3 className="mt-4 font-display text-xl leading-tight text-ivory-50">{f.name}</h3>
                  {meiteiAlias(f.name, f.meiteiName) && (
                    <p className="font-mayek text-sm text-muted-foreground">{meiteiAlias(f.name, f.meiteiName)}</p>
                  )}
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.typicalDates}</p>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Section>
  );
}
