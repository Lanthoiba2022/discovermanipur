"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { useFilterParams } from "./use-filter-params";

/** Boolean chip bound to `?<name>=true`. */
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
        "inline-flex h-11 items-center gap-2 self-end rounded-full border px-4 text-sm transition-colors duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border-strong bg-surface text-foreground hover:bg-muted",
        className,
      )}
    >
      <Check className={cn("size-4", active ? "opacity-100" : "opacity-30")} aria-hidden="true" />
      {label}
    </button>
  );
}
