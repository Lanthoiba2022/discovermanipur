"use client";

import { cn } from "@/lib/utils";

import type { FilterOption } from "./params";
import { useFilterParams } from "./use-filter-params";

/**
 * Single-select chip row. The selected chip is reflected in `?<name>=<value>`;
 * clicking the active chip (or "All") clears it.
 *
 * Chips are 44px tall with 8px between them — the row is the densest touch
 * target on a listing page — and the row wraps rather than scrolling, because
 * a district list in Manipuri runs long and must never be cut off.
 */
export function FilterChips({
  name,
  label,
  options,
  allLabel = "All",
  className,
}: {
  name: string;
  label: string;
  options: FilterOption[];
  allLabel?: string;
  className?: string;
}) {
  const { get, setParam, isPending } = useFilterParams();
  const current = get(name);

  const chip = (value: string | null, text: string, active: boolean) => (
    <button
      key={value ?? "__all"}
      type="button"
      aria-pressed={active}
      disabled={isPending}
      onClick={() => setParam(name, active ? null : value)}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm",
        "transition-[background-color,border-color,color] duration-[180ms] ease-[var(--ease-flat)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
        "disabled:opacity-60",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border-strong bg-surface text-foreground hover:border-[var(--stone-500)] hover:bg-surface-sand",
      )}
    >
      {text}
    </button>
  );

  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="eyebrow mb-3 text-muted-foreground">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {chip(null, allLabel, !current)}
        {options.map((option) => chip(option.value, option.label, current === option.value))}
      </div>
    </fieldset>
  );
}
