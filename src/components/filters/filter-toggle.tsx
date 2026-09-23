"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { useFilterParams } from "./use-filter-params";

/** Boolean chip bound to `?<name>=true`. Same 44px target as a filter chip. */
export function FilterToggle({
  name,
  label,
  className,
}: {
  name: string;
  label: string;
  className?: string;
}) {
  const { get, setParam, isPending } = useFilterParams();
  const active = get(name) === "true";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={isPending}
      onClick={() => setParam(name, active ? null : "true")}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 self-end rounded-full border px-4 py-2 text-sm",
        "transition-[background-color,border-color,color] duration-[180ms] ease-[var(--ease-flat)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
        "disabled:opacity-60",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border-strong bg-surface text-foreground hover:border-[var(--stone-500)] hover:bg-surface-sand",
        className,
      )}
    >
      <Check className={cn("size-4 shrink-0", active ? "opacity-100" : "opacity-30")} aria-hidden="true" />
      {label}
    </button>
  );
}
