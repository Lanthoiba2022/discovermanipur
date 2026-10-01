"use client";

import { BedDouble, CalendarHeart, Info, MapPin, PauseCircle, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Concierge, type ConciergeSeed } from "@/components/ai/concierge";
import { ConciergeShowcase, type ShowcaseTurnView } from "@/components/ai/concierge-showcase";
import { TripForm } from "@/components/ai/trip-form";

/** What the concierge does, for the aside while the live chat is paused. */
const CAPABILITIES = [
  { icon: MapPin, label: "Finds real places", note: "Lakes, hills, heritage — never invented." },
  { icon: BedDouble, label: "Matches homestays", note: "By district, price and how many of you there are." },
  { icon: UtensilsCrossed, label: "Points at kitchens", note: "Dishes first, then where to actually eat them." },
  { icon: CalendarHeart, label: "Builds the days", note: "A costed, day-by-day plan you can open and book from." },
];

export function PlanClient({
  aiConfigured,
  live,
  showcase,
}: {
  aiConfigured: boolean;
  /** False when the concierge is switched off — `/plan` then shows the sample. */
  live: boolean;
  showcase: ShowcaseTurnView[];
}) {
  const [seed, setSeed] = useState<ConciergeSeed | undefined>(undefined);
  const [nonce, setNonce] = useState(0);

  // With the chat paused and no sample to fall back on (an unseeded catalogue),
  // the honest thing is the live component's own "not configured" behaviour.
  const showSample = !live && showcase.length > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-10">
      {/* Guided brief, or — while paused — what the concierge is for */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-sm)] md:p-6">
          {showSample ? (
            <>
              <p className="mb-3 flex w-fit items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-warning">
                <PauseCircle aria-hidden className="size-3" />
                Paused for now
              </p>
              <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                Here&apos;s what it does
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                The live concierge is switched off on this site for now. The conversation beside this is a sample with
                hand-written replies — every card in it was built from Discover Manipur&apos;s own catalogue, and every link works.
              </p>

              <div className="my-5 h-px bg-border" />

              <ul className="space-y-3.5">
                {CAPABILITIES.map(({ icon: Icon, label, note }) => (
                  <li key={label} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-surface-sunken text-primary"
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">{label}</span>
                      <span className="block text-xs leading-relaxed text-muted-foreground">{note}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="my-5 h-px bg-border" />

              <p className="text-xs leading-relaxed text-muted-foreground">
                Browsing works normally in the meantime —{" "}
                <Link href="/hotspots" className="underline underline-offset-4 hover:text-foreground">
                  places
                </Link>
                ,{" "}
                <Link href="/homestays" className="underline underline-offset-4 hover:text-foreground">
                  homestays
                </Link>{" "}
                and{" "}
                <Link href="/tours" className="underline underline-offset-4 hover:text-foreground">
                  tours
                </Link>{" "}
                are all live.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                Start with the shape of it
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                A few answers and the concierge opens the conversation for you. You can change your mind at any point —
                just say so in the chat.
              </p>

              <div className="my-5 h-px bg-border" />

              <TripForm
                onSubmit={(_brief, prompt) => {
                  const next = nonce + 1;
                  setNonce(next);
                  setSeed({ nonce: next, text: prompt });
                }}
              />

              {!aiConfigured && (
                <p className="mt-5 flex items-start gap-2 rounded-[var(--radius)] bg-surface-sunken p-3 text-xs leading-relaxed text-muted-foreground">
                  <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
                  <span>
                    The AI concierge isn&apos;t configured on this deployment yet. You&apos;ll still get a sample
                    itinerary built from the real catalogue.
                  </span>
                </p>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Conversation */}
      <div className="min-h-0 lg:h-[min(88dvh,58rem)]">
        {showSample ? (
          <ConciergeShowcase turns={showcase} className="h-[min(82dvh,52rem)] lg:h-full" />
        ) : (
          <Concierge variant="page" seed={seed} className="h-[min(82dvh,52rem)] lg:h-full" />
        )}
      </div>
    </div>
  );
}
