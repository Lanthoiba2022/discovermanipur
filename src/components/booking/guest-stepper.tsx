"use client";

import { Minus, Plus, Users } from "lucide-react";

export function GuestStepper({
  value,
  max,
  min = 1,
  onChange,
  id = "guest-stepper",
}: {
  value: number;
  max: number;
  min?: number;
  onChange: (next: number) => void;
  id?: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));

  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-border bg-surface px-4 py-3">
      <div className="min-w-0">
        <p id={`${id}-label`} className="flex items-center gap-2 text-sm font-medium">
          <Users className="size-4" aria-hidden="true" />
          Guests
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">This home sleeps up to {max}</p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          aria-label="Remove a guest"
          className="flex size-8 items-center justify-center rounded-full border border-border-strong transition-colors hover:bg-muted disabled:opacity-40"
        >
          <Minus className="size-3.5" aria-hidden="true" />
        </button>

        <output
          htmlFor={`${id}-label`}
          aria-live="polite"
          className="w-6 text-center text-sm font-medium tabular-nums"
        >
          {value}
        </output>

        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          aria-label="Add a guest"
          className="flex size-8 items-center justify-center rounded-full border border-border-strong transition-colors hover:bg-muted disabled:opacity-40"
        >
          <Plus className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
