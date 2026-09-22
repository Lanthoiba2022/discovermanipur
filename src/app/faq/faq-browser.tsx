"use client";

import { Search, X } from "lucide-react";
import * as React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FaqGroup } from "./faq-data";

function normalise(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function FaqBrowser({ groups }: { groups: FaqGroup[] }) {
  const [query, setQuery] = React.useState("");
  const [group, setGroup] = React.useState<string>("all");

  const term = normalise(query);

  const visible = React.useMemo(() => {
    return groups
      .filter((g) => group === "all" || g.id === group)
      .map((g) => ({
        ...g,
        items: term
          ? g.items.filter((item) => normalise(`${item.q} ${item.a}`).includes(term))
          : g.items,
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, group, term]);

  const resultCount = visible.reduce((n, g) => n + g.items.length, 0);

  return (
    <div>
      {/* ------------------------------ Controls ------------------------------ */}
      <div className="sticky top-20 z-20 -mx-4 mb-12 bg-background/85 px-4 py-4 backdrop-blur-md md:top-24 md:mx-0 md:rounded-[var(--radius-lg)] md:border md:border-border md:px-6">
        <div className="relative">
          <label htmlFor="faq-search" className="sr-only">
            Search the questions
          </label>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="faq-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions — permits, food, monsoon, wheelchair…"
            className="h-12 pl-11 pr-11"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterChip active={group === "all"} onClick={() => setGroup("all")}>
            Everything
          </FilterChip>
          {groups.map((g) => (
            <FilterChip key={g.id} active={group === g.id} onClick={() => setGroup(g.id)}>
              {g.label}
            </FilterChip>
          ))}
        </div>

        <p aria-live="polite" className="mt-3 text-xs text-muted-foreground">
          {term || group !== "all"
            ? `${resultCount} ${resultCount === 1 ? "question" : "questions"} shown`
            : `${resultCount} questions in total`}
        </p>
      </div>

      {/* ------------------------------- Results ------------------------------ */}
      {visible.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong px-6 py-16 text-center">
          <p className="font-display text-2xl">Nothing matches “{query.trim()}”.</p>
          <p className="mx-auto mt-3 max-w-[46ch] leading-relaxed text-muted-foreground">
            Try a broader word — <em>permit</em>, <em>monsoon</em>, <em>homestay</em>, <em>vegan</em>{" "}
            — or clear the filter. If the answer genuinely is not here, the contact form is the
            place to ask.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setGroup("all");
            }}
            className="mt-6 text-sm font-medium text-primary underline underline-offset-4"
          >
            Reset the filters
          </button>
        </div>
      ) : (
        <div className="space-y-16">
          {visible.map((g) => (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-heading`} className="scroll-mt-40">
              <div className="mb-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h2 id={`${g.id}-heading`} className="font-display text-2xl md:text-3xl">
                  {g.label}
                </h2>
                <Badge variant="default">{g.items.length}</Badge>
              </div>
              <p className="mb-6 text-muted-foreground">{g.blurb}</p>

              <Accordion type="single" collapsible className="w-full border-t border-border">
                {g.items.map((item, i) => (
                  <AccordionItem key={item.q} value={`${g.id}-${i}`}>
                    <AccordionTrigger className="text-base md:text-lg">{item.q}</AccordionTrigger>
                    <AccordionContent>
                      <p className="max-w-[68ch]">{item.a}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border-strong text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
