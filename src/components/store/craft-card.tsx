import Image from "next/image";
import Link from "next/link";
import { Award, Hammer, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";
import type { Craft } from "@/types";

import { craftCategoryLabel, formatLeadTime } from "./craft-filters";

export function CraftCard({ craft, preload = false }: { craft: Craft; preload?: boolean }) {
  const cover = craft.images[0];

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
        <Badge variant="glass" className="absolute left-4 top-4">
          {craftCategoryLabel(craft.category)}
        </Badge>
        {craft.giTagged && (
          <Badge variant="glass" className="absolute right-4 top-4">
            <Award className="size-3.5" aria-hidden="true" />
            GI tagged
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-xl leading-tight">
          <Link
            href={`/store/${craft.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {craft.name}
          </Link>
        </h3>

        <p className="text-sm text-muted-foreground">
          Made by <span className="text-foreground">{craft.maker}</span>
        </p>

        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          {craft.location}, {craft.district}
        </p>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {craft.description}
        </p>

        {craft.madeToOrder && (
          <p className="mt-auto flex items-center gap-1.5 pt-1 text-sm text-muted-foreground">
            <Hammer className="size-4 shrink-0" aria-hidden="true" />
            Made to order
            {craft.leadTimeDays ? ` · ready in ${formatLeadTime(craft.leadTimeDays)}` : ""}
          </p>
        )}

        <div className={craft.madeToOrder ? "" : "mt-auto"}>
          <p className="border-t border-border pt-3">
            <span className="font-display text-xl">{formatINR(craft.price)}</span>
            {craft.priceNote && (
              <span className="text-sm text-muted-foreground"> · {craft.priceNote}</span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Paid direct to the maker</p>
        </div>
      </div>
    </article>
  );
}
