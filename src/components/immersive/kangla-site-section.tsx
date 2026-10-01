"use client";

import dynamic from "next/dynamic";
import { ArrowRight, Box, LoaderCircle, MapPin } from "lucide-react";
import { useCallback, useState } from "react";

import type { LandmarkId } from "@/lib/immersive/kangla";
import { kanglaPlaces, type KanglaPlace } from "@/lib/immersive/kangla-places";
import { cn } from "@/lib/utils";

const SiteMap = dynamic(() => import("./kangla-site-map"), {
  ssr: false,
  loading: () => (
    <div className="grid size-full place-items-center bg-ink-950 text-ivory-50/70">
      <span className="flex items-center gap-3 text-sm">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        Loading the site map…
      </span>
    </div>
  ),
});

const KIND_LABEL: Record<KanglaPlace["kind"], string> = {
  guardian: "Sculpture",
  temple: "Temple",
  gate: "Gateway",
  hall: "Hall",
  museum: "Museum",
  water: "Waterway",
};

const KIND_DOT: Record<KanglaPlace["kind"], string> = {
  guardian: "bg-brass-500",
  temple: "bg-ningthou-600",
  gate: "bg-pine-600",
  hall: "bg-ningthou-800",
  museum: "bg-ink-600",
  water: "bg-[#2f6b8a]",
};

/**
 * The site level of the experience.
 *
 * The detailed models are three separate architectural studies with no shared
 * ground plane, so on their own they never tell you where anything *is*. This
 * puts them back on the real fort: satellite imagery, the actual moats and
 * footprints from OpenStreetMap, and a pin on every place at its mapped
 * coordinate. From here a modelled place opens its 3D view.
 */
export function KanglaSiteSection({
  onOpenModel,
}: {
  onOpenModel: (id: LandmarkId) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = kanglaPlaces.find((p) => p.id === selectedId) ?? null;
  const onSelect = useCallback((id: string) => setSelectedId((cur) => (cur === id ? null : id)), []);

  return (
    <section className="chapter-dark rounded-[var(--radius-lg)] px-5 py-10 md:px-8 md:py-14">
      <div className="mb-8 grid gap-6 border-b border-ivory-50/15 pb-8 md:mb-10 md:grid-cols-[1.1fr_1fr] md:gap-14">
        <div>
          <p className="eyebrow mb-4 flex items-center gap-3 text-brass-400">
            <MapPin className="size-4" aria-hidden />
            The site, from above
          </p>
          <h2 className="font-display text-[1.9rem] leading-[1.05] text-ivory-50 sm:text-4xl">
            Kangla is an island. Start by seeing the whole of it.
          </h2>
        </div>
        <p className="self-end text-base leading-relaxed text-ivory-50/70">
          Seven hundred and fifty metres across, thirteen hundred long, ringed by a moat with the
          Imphal river on its eastern side. Every pin below sits on a real mapped coordinate;
          the ones marked <span className="font-mono text-brass-400">3D</span> open a detailed
          reconstruction you can walk around.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:gap-8">
        <div className="relative h-[24rem] overflow-hidden rounded-[var(--radius)] border border-ivory-50/15 md:h-[34rem]">
          <SiteMap selectedId={selectedId} onSelect={onSelect} />
        </div>

        <div className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2" aria-label="Places inside Kangla">
            {kanglaPlaces.map((place) => {
              const active = place.id === selectedId;
              return (
                <li key={place.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(place.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[var(--radius-sm)] border px-4 py-3 text-left transition-colors",
                      active
                        ? "border-brass-400 bg-ivory-50/10"
                        : "border-ivory-50/15 hover:border-ivory-50/35 hover:bg-ivory-50/5",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn("size-2.5 shrink-0 rounded-full", KIND_DOT[place.kind])}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ivory-50">
                        {place.name}
                      </span>
                      <span className="eyebrow text-ivory-50/45">{KIND_LABEL[place.kind]}</span>
                    </span>
                    {place.model && (
                      <span className="eyebrow shrink-0 rounded-full border border-brass-400/60 px-2 py-0.5 text-brass-400">
                        3D
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {selected ? (
            <div className="rounded-[var(--radius-sm)] border border-ivory-50/15 bg-ivory-50/5 p-5">
              <h3 className="font-display text-xl leading-tight text-ivory-50">{selected.name}</h3>
              {selected.meiteiName && (
                <p className="font-mayek mt-1 text-sm text-brass-400">{selected.meiteiName}</p>
              )}
              <p className="mt-3 text-sm leading-relaxed text-ivory-50/75">{selected.summary}</p>

              {selected.model && (
                <button
                  type="button"
                  onClick={() => onOpenModel(selected.model as LandmarkId)}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-brass-400 px-4 py-2 text-sm font-medium text-ink-950 transition-colors hover:bg-brass-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Box className="size-4" aria-hidden />
                  Open the 3D view
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              )}

              <p className="eyebrow mt-5 border-t border-ivory-50/12 pt-3 leading-relaxed text-ivory-50/40">
                Source · {selected.source}
              </p>
            </div>
          ) : (
            <p className="rounded-[var(--radius-sm)] border border-dashed border-ivory-50/20 p-5 text-sm leading-relaxed text-ivory-50/55">
              Pick a place to fly the map to it. Drag to orbit, scroll to zoom, and use the pitch
              control to drop the camera towards the ground.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
