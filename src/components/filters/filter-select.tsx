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

import { ALL, type FilterOption } from "./params";
import { useFilterParams } from "./use-filter-params";

/** Dropdown filter bound to `?<name>=<value>`. */
export function FilterSelect({
  name,
  label,
  options,
  allLabel = "Any",
  className,
}: {
  name: string;
  label: string;
  options: FilterOption[];
  allLabel?: string;
  className?: string;
}) {
  const { get, setParam, isPending } = useFilterParams();
  const id = useId();
  const current = get(name) ?? ALL;

  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="eyebrow mb-3 block text-muted-foreground">
        {label}
      </label>
      <Select value={current} onValueChange={(value) => setParam(name, value)} disabled={isPending}>
        <SelectTrigger id={id} aria-label={label} className="min-w-44">
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
