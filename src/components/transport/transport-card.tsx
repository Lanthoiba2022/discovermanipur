import Image from "next/image";
import Link from "next/link";
import { Route, Star, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";
import type { TransportOption } from "@/types";

import { modeLabel } from "./transport-filters";

export function TransportCard({
  option,
  preload = false,
}: {
  option: TransportOption;
  preload?: boolean;
}) {
  const cover = option.images[0];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-sm)] transition-shadow duration-300 hover:shadow-[var(--shadow-md)]">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-sunken">
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
          {modeLabel(option.mode)}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl leading-tight">
            <Link
              href={`/transport/${option.slug}`}
              className="after:absolute after:inset-0 focus-visible:outline-none"
            >
              {option.name}
            </Link>
          </h3>
          {option.rating > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm">
              <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
              <span className="font-medium">{option.rating.toFixed(1)}</span>
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground">Operated by {option.operator}</p>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {option.description}
        </p>

        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-4" aria-hidden="true" />
          {option.seats} {option.seats === 1 ? "seat" : "seats"}
        </p>

        {option.routes.length > 0 && (
          <p className="mt-auto flex items-start gap-1.5 pt-2 text-sm text-muted-foreground">
            <Route className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="line-clamp-2">{option.routes.slice(0, 3).join(" · ")}</span>
          </p>
        )}

        <p className="border-t border-border pt-3">
          {option.pricePerDay ? (
            <>
              <span className="font-display text-xl">{formatINR(option.pricePerDay)}</span>
              <span className="text-sm text-muted-foreground"> / day</span>
            </>
          ) : option.pricePerKm ? (
            <>
              <span className="font-display text-xl">{formatINR(option.pricePerKm)}</span>
              <span className="text-sm text-muted-foreground"> / km</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Price on request</span>
          )}
        </p>
      </div>
    </article>
  );
}
