"use client";

import { Info } from "lucide-react";
import { useState } from "react";

import { Concierge, type ConciergeSeed } from "@/components/ai/concierge";
import { TripForm } from "@/components/ai/trip-form";

export function PlanClient({ aiConfigured }: { aiConfigured: boolean }) {
  const [seed, setSeed] = useState<ConciergeSeed | undefined>(undefined);
  const [nonce, setNonce] = useState(0);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-10">
      {/* Guided brief */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-sm)] md:p-6">
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">Start with the shape of it</h2>
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
        </div>
      </aside>

      {/* Conversation */}
      <div className="min-h-0 lg:h-[min(88dvh,58rem)]">
        <Concierge variant="page" seed={seed} className="h-[min(82dvh,52rem)] lg:h-full" />
      </div>
    </div>
  );
}
