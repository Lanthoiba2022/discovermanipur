"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BedDouble,
  CalendarHeart,
  Car,
  Compass,
  MapPin,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CatalogueItem, CatalogueKind, CatalogueResults } from "@/lib/ai/schema";

const kindIcon: Record<CatalogueKind, LucideIcon> = {
  place: MapPin,
  stay: BedDouble,
  experience: Sparkles,
  eatery: UtensilsCrossed,
  tour: Compass,
  festival: CalendarHeart,
  transport: Car,
};

const kindLabel: Record<CatalogueKind, string> = {
  place: "Place",
  stay: "Homestay",
  experience: "Experience",
  eatery: "Eat",
  tour: "Tour",
  festival: "Festival",
  transport: "Transport",
};

export function ResultCard({ item }: { item: CatalogueItem }) {
  const Icon = kindIcon[item.kind] ?? MapPin;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex gap-3 rounded-[var(--radius)] border border-border bg-surface p-3",
        "transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-md)]",
        "motion-reduce:transform-none motion-reduce:transition-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      )}
    >
      {item.image ? (
        <div className="relative size-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-muted">
          <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />
        </div>
      ) : (
        <div className="flex size-16 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-muted text-muted-foreground">
          <Icon aria-hidden className="size-5" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-display text-sm font-semibold tracking-tight text-foreground">{item.title}</p>
          <ArrowUpRight
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none"
          />
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.summary}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          <Badge variant="primary" className="px-2 py-0.5 text-[10px] uppercase tracking-wider">
            {kindLabel[item.kind] ?? item.kind}
          </Badge>
          {item.price && <span className="font-medium text-foreground">{item.price}</span>}
          {item.meta && <span className="truncate">{item.meta}</span>}
        </div>
      </div>
    </Link>
  );
}

export function ResultCards({ results }: { results: CatalogueResults }) {
  if (results.count === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-border-strong bg-surface-sunken p-4 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Nothing in the catalogue for that yet.</span> Try a wider search, or
        browse <Link href="/hotspots" className="text-primary underline underline-offset-4">all places</Link>.
      </div>
    );
  }

  return (
    <section aria-label={results.heading} className="space-y-2">
      <p className="eyebrow text-[10px] text-muted-foreground">{results.heading}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {results.items.map((item) => (
          <ResultCard key={`${item.kind}-${item.slug}`} item={item} />
        ))}
      </div>
    </section>
  );
}
