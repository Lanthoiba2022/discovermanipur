import { Clock, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { formatINR } from "@/lib/utils";
import type { Experience } from "@/types";

import { EmptyNote } from "./empty-note";

export function ExperiencesTeaser({ experiences }: { experiences: Experience[] }) {
  return (
    <Section
      eyebrow="Experiences"
      title="Do the thing, with the person who does it daily"
      description="Short, hosted, small-group. A loom in a courtyard, a dawn paddle through the phumdis, a kitchen full of fermented things."
      action={
        <Button asChild variant="outline" size="pill">
          <Link href="/experiences">All experiences</Link>
        </Button>
      }
    >
      {experiences.length === 0 ? (
        <EmptyNote
          title="Hosts are being introduced"
          body="Featured experiences will appear here as hosts come online."
          href="/experiences"
          cta="Browse experiences"
        />
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map((exp, i) => (
            <Reveal as="li" key={exp.id} delayIndex={i % 3} className="group">
              <Link
                href={`/experiences/${exp.slug}`}
                className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface transition-shadow duration-300 hover:shadow-[var(--shadow-md)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-sunken">
                  {exp.images[0]?.src && (
                    <Image
                      src={exp.images[0].src}
                      alt={exp.images[0].alt || exp.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                    />
                  )}
                  <Badge variant="glass" className="absolute left-4 top-4 capitalize">
                    {exp.category}
                  </Badge>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-xl leading-tight">{exp.title}</h3>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {exp.description}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock aria-hidden className="size-3.5" />
                      {exp.durationHours} hrs
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users aria-hidden className="size-3.5" />
                      max {exp.groupSizeMax}
                    </span>
                    <span className="ml-auto font-medium text-foreground">
                      {formatINR(exp.pricePerPerson)}
                      <span className="font-normal text-muted-foreground"> / person</span>
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      )}
    </Section>
  );
}
