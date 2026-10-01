"use client";

import { Search } from "lucide-react";
import { useId } from "react";

import { useFilterParams } from "@/components/filters/use-filter-params";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Name or location search bound to `?q=`. Submits on Enter or the button. */
export function CommunitySearch({ className }: { className?: string }) {
  const { get, setParam, isPending } = useFilterParams();
  const id = useId();
  const current = get("q") ?? "";

  return (
    <form
      role="search"
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("q");
        setParam("q", typeof value === "string" ? value.trim().slice(0, 100) : null);
      }}
    >
      <label htmlFor={id} className="eyebrow mb-3 block text-muted-foreground">
        Search by name or location
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            key={current}
            id={id}
            name="q"
            type="search"
            maxLength={100}
            defaultValue={current}
            placeholder="Ukhrul, lakeside cafe, Moirang…"
            className="border-border-strong pl-11"
          />
        </div>
        <Button type="submit" variant="outline" disabled={isPending} className="border-border-strong">
          Search
        </Button>
      </div>
    </form>
  );
}
