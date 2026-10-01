import { ArrowUpRight, Clock, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import type { Experience } from "@/types";

import { Band, BandHeader } from "./band";
import { EmptyNote } from "./empty-note";
import { Reveal } from "@/components/motion/reveal";

/**
 * Second rung of the measure ladder (75rem) on the warm sand ground: the page
 * has started to narrow, and the ground change stops two light bands running
 * into one another.
 */
export function ExperiencesTeaser({ experiences }: { experiences: Experience[] }) {
  return (
    <Band tone="sand" measure="mid" pad="md" label="Experiences">
      <BandHeader
        tone="sand"
        eyebrow="Experiences"
        word="Do the thing."
        completion="With the person who does it daily."
        standfirst="Short, hosted, small-group. A loom in a courtyard, a dawn paddle through the phumdis, a kitchen full of fermented things."
        action={
          <Button asChild variant="outline" size="pill" className="w-fit">
            <Link href="/experiences">All experiences</Link>
          </Button>
        }
      />

      {experiences.length === 0 ? (
        <EmptyNote
          title="Hosts are being introduced"
          body="Featured experiences appear here as hosts come online. The full programme is already open."
          href="/experiences"
          cta="Browse experiences"
        />
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {experiences.map((exp, i) => (
            <Reveal as="li" key={exp.id} delayIndex={i % 3} className="group">
              <Link
                href={`/experiences/${exp.slug}`}
                className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface transition-[box-shadow,transform] duration-300 ease-[var(--ease-flat)] hover:-translate-y-1 hover:shadow-[var(--shadow-md)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                <div className="relative aspect-[5/4] w-full overflow-hidden bg-surface-sunken">
                  {exp.images[0]?.src && (
                    <Image
                      src={exp.images[0].src}
                      alt={exp.images[0].alt || exp.title}
                      fill
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 23rem"
                      className="object-cover transition-transform duration-[600ms] ease-[var(--ease-flat)] group-hover:scale-[1.05]"
                    />
                  )}
                  <Badge variant="glass" className="absolute left-4 top-4 capitalize">
                    {exp.category}
                  </Badge>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  {/* Titles carry the promise: never clamped, whatever it
                      costs in card-height evenness. */}
                  <h3 className="font-display text-[1.375rem] leading-[1.18] tracking-[-0.008em]">
                    {exp.title}
                  </h3>
                  <p className="mt-2.5 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {exp.description}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock aria-hidden className="size-3.5" />
                      {exp.durationHours} hrs
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users aria-hidden className="size-3.5" />
                      max {exp.groupSizeMax}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-foreground">
                      {formatINR(exp.pricePerPerson)}
                      <span className="font-normal text-muted-foreground">/ person</span>
                      <ArrowUpRight
                        aria-hidden
                        className="size-4 text-brass-700 transition-transform duration-200 ease-[var(--ease-flat)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      )}
    </Band>
  );
}
