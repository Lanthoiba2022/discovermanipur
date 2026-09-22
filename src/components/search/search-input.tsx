"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import * as React from "react";

import type { SearchResult } from "@/lib/data";
import { cn } from "@/lib/utils";
import { fetchSuggestions } from "./actions";
import { kindLabel } from "./kinds";

const DEBOUNCE_MS = 220;

export interface SearchInputProps {
  /** Pre-fill, e.g. from `?q=` on the search page. */
  defaultValue?: string;
  placeholder?: string;
  /** Visually hidden label text for the combobox. */
  label?: string;
  autoFocus?: boolean;
  /** Called after the user navigates — use it to close a sheet or dialog. */
  onNavigate?: () => void;
  className?: string;
  size?: "md" | "lg";
}

/**
 * Debounced search box with live suggestions, usable anywhere on the site.
 * Follows the combobox pattern: arrow keys move through suggestions, Enter
 * opens the highlighted one (or runs a full search), Escape closes the list.
 */
export function SearchInput({
  defaultValue = "",
  placeholder = "Search places, stays, food, experiences…",
  label = "Search Manipur Tourism",
  autoFocus = false,
  onNavigate,
  className,
  size = "md",
}: SearchInputProps) {
  const router = useRouter();
  const id = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);

  const [value, setValue] = React.useState(defaultValue);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState(-1);

  // -------------------------------------------------------------- suggestions
  React.useEffect(() => {
    const term = value.trim();
    if (term.length < 2) return;

    let cancelled = false;

    const timer = window.setTimeout(() => {
      setLoading(true);
      fetchSuggestions(term)
        .then((rows) => {
          if (cancelled) return;
          setResults(rows);
          setActive(-1);
          setOpen(true);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value]);

  /** Suggestions are only meaningful for the current term. */
  const suggestions = value.trim().length >= 2 ? results : [];

  // ------------------------------------------------------------ outside click
  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function go(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  function runFullSearch() {
    const term = value.trim();
    if (!term) return;
    go(`/search?q=${encodeURIComponent(term)}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % suggestions.length);
      return;
    }
    if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const picked = active >= 0 ? suggestions[active] : undefined;
      if (picked) go(picked.href);
      else runFullSearch();
    }
  }

  const listboxId = `${id}-listbox`;
  const showList = open && value.trim().length >= 2;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          runFullSearch();
        }}
      >
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          id={id}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-option-${active}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            const next = e.target.value;
            setValue(next);
            if (next.trim().length < 2) {
              setResults([]);
              setLoading(false);
              setActive(-1);
              setOpen(false);
            }
          }}
          onFocus={() => value.trim().length >= 2 && setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            "w-full rounded-[var(--radius)] border border-border bg-surface pl-11 pr-11 text-foreground",
            "placeholder:text-muted-foreground transition-colors",
            "focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
            "[&::-webkit-search-cancel-button]:hidden",
            size === "lg" ? "h-14 text-base" : "h-11 text-sm",
          )}
        />
        {loading ? (
          <Loader2
            className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        ) : (
          value && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setValue("");
                setResults([]);
                setOpen(false);
              }}
              className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )
        )}
      </form>

      {showList && (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-[var(--radius)] border border-border bg-surface shadow-[var(--shadow-lg)]">
          <ul id={listboxId} role="listbox" aria-label="Search suggestions" className="max-h-96 overflow-y-auto">
            {suggestions.length === 0 && !loading && (
              <li className="px-4 py-5 text-sm text-muted-foreground" role="presentation">
                Nothing matched “{value.trim()}”. Press Enter to search the whole catalogue.
              </li>
            )}
            {suggestions.map((result, i) => (
              <li key={`${result.kind}-${result.slug}`} role="presentation">
                <button
                  type="button"
                  id={`${id}-option-${i}`}
                  role="option"
                  aria-selected={active === i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(result.href)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    active === i ? "bg-muted" : "bg-transparent",
                  )}
                >
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-sunken">
                    {result.image && (
                      <Image
                        src={result.image}
                        alt=""
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {result.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {result.subtitle}
                    </span>
                  </span>
                  <span className="eyebrow shrink-0 text-[0.625rem] text-muted-foreground">
                    {kindLabel(result.kind)}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {suggestions.length > 0 && (
            <button
              type="button"
              onClick={runFullSearch}
              className="block w-full border-t border-border px-4 py-3 text-left text-sm font-medium text-primary transition-colors hover:bg-muted"
            >
              See all results for “{value.trim()}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}
