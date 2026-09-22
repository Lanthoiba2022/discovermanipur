import { CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn, meiteiAlias } from "@/lib/utils";
import type { Festival } from "@/types";

import { PLACEHOLDER_IMAGE } from "./taxonomy";

export function FestivalCard({
  festival,
  highlight = false,
  className,
}: {
  festival: Festival;
  highlight?: boolean;
  className?: string;
}) {
  const cover = festival.images[0];

  return (
    <article
      className={cn(
        "group relative flex h-full gap-4 overflow-hidden rounded-[var(--radius-lg)] border bg-surface p-4 transition-shadow duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[var(--shadow-md)] focus-within:shadow-[var(--shadow-md)]",
        highlight ? "border-accent" : "border-border",
        className,
      )}
    >
      <div className="relative size-24 shrink-0 overflow-hidden rounded-[var(--radius)] bg-muted sm:size-28">
        <Image
          src={cover?.src ?? PLACEHOLDER_IMAGE}
          alt={cover?.alt ?? `${festival.name} being celebrated in ${festival.district}, Manipur`}
          fill
          sizes="(min-width: 640px) 112px, 96px"
          className="object-cover transition-transform duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 motion-reduce:transform-none"
        />
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={highlight ? "accent" : "primary"} className="text-[11px]">
            {festival.month}
          </Badge>
          {festival.featured && !highlight && (
            <Badge variant="outline" className="text-[11px]">
              Signature
            </Badge>
          )}
        </div>

        <h3 className="font-display text-lg leading-tight">
          <Link
            href={`/festivals/${festival.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {festival.name}
          </Link>
        </h3>

        {meiteiAlias(festival.name, festival.meiteiName) && (
          <p className="font-mayek text-sm text-muted-foreground" lang="mni-Mtei">
            {meiteiAlias(festival.name, festival.meiteiName)}
          </p>
        )}

        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {festival.description}
        </p>

        <p className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden />
            {festival.location || festival.district}
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            <span className="line-clamp-1">{festival.typicalDates || festival.month}</span>
          </span>
        </p>
      </div>
    </article>
  );
}
