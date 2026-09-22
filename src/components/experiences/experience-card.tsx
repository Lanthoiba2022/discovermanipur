import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Star, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";
import type { Experience } from "@/types";

import { formatHours } from "./experience-filters";

export function ExperienceCard({
  experience,
  preload = false,
}: {
  experience: Experience;
  preload?: boolean;
}) {
  const cover = experience.images[0];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-sm)] transition-shadow duration-300 hover:shadow-[var(--shadow-md)]">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-sunken">
        {cover ? (
          <Image
            src={cover.src}
            alt={cover.alt}
            fill
            preload={preload}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          />
        ) : null}
        <Badge variant="glass" className="absolute left-4 top-4 capitalize">
          {experience.category}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl leading-tight">
            <Link
              href={`/experiences/${experience.slug}`}
              className="after:absolute after:inset-0 focus-visible:outline-none"
            >
              {experience.title}
            </Link>
          </h3>
          {experience.rating > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm">
              <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
              <span className="font-medium">{experience.rating.toFixed(1)}</span>
              <span className="sr-only">out of 5</span>
            </span>
          )}
        </div>

        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4" aria-hidden="true" />
          {experience.location}
        </p>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {experience.description}
        </p>

        <dl className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden="true" />
            <dt className="sr-only">Duration</dt>
            <dd>{formatHours(experience.durationHours)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="size-4" aria-hidden="true" />
            <dt className="sr-only">Maximum group size</dt>
            <dd>Up to {experience.groupSizeMax}</dd>
          </div>
        </dl>

        <p className="border-t border-border pt-3 text-base">
          <span className="font-display text-xl">{formatINR(experience.pricePerPerson)}</span>
          <span className="text-sm text-muted-foreground"> / person</span>
        </p>
      </div>
    </article>
  );
}
