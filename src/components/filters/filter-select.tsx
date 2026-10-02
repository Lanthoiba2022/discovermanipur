"use client";

import { useId } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { FilterParamsGate } from "./filter-params-gate";
import { ALL, type FilterOption } from "./params";
import type { FilterParams } from "./use-filter-params";

interface FilterSelectProps {
  name: string;
  label: string;
  options: FilterOption[];
  allLabel?: string;
  className?: string;
}

/**
 * Dropdown filter bound to `?<name>=<value>`. Reads and writes the URL through
 * `FilterParamsGate`, so it works in either URL mode.
 */
export function FilterSelect(props: FilterSelectProps) {
  return <FilterParamsGate>{(params) => <FilterSelectView {...props} params={params} />}</FilterParamsGate>;
}

function FilterSelectView({
  name,
  label,
  options,
  allLabel = "Any",
  className,
  params,
}: FilterSelectProps & { params: FilterParams }) {
  const { get, setParam, isPending } = params;
  const id = useId();
  // A shared URL can carry a value this list does not offer (a district with
  // nothing in it, a stale slug). Radix would then render an empty trigger, so
  // fall back to the "any" sentinel rather than showing a blank control.
  const raw = get(name);
  const current = raw && options.some((o) => o.value === raw) ? raw : ALL;

  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="eyebrow mb-3 block text-muted-foreground">
        {label}
      </label>
      <Select value={current} onValueChange={(value) => setParam(name, value)} disabled={isPending}>
        <SelectTrigger id={id} aria-label={label} className="min-w-44 border-border-strong">
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
