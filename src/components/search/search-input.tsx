"use client";

import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import * as React from "react";

import { CatalogueImage } from "@/components/shared/catalogue-image";
import { matchEntries, type SearchEntry } from "@/lib/data/search-match";
import { cn } from "@/lib/utils";
import { KindIcon, kindLabel } from "./kinds";

/** Suggestions shown at once. The full result set lives at /search. */
const SUGGESTION_LIMIT = 6;
/** Fewer characters than this match too much to be useful as suggestions. */
const MIN_TERM = 2;

/* ------------------------------------------------------------ search index -- */

/**
 * The static catalogue index (`src/app/search-index.json/route.ts`), fetched
 * at most once per page load and shared by every SearchInput on the page (the
 * header, the home hero, the 404 page, /search).
 *
 * This replaced a Server Action per debounced keystroke: one prerendered,
 * CDN-cached JSON file instead of a function invocation for every few
 * characters typed. It is requested on intent (first focus or first input),
 * never on page load, so a visitor who never searches never downloads it.
 *
 * It lives in a tiny module-level store read with `useSyncExternalStore`, so
 * every input shares one download and one copy, and an input that unmounts
 * mid-fetch (the header dialog closing) has nothing to clean up.
 *
 * A failed fetch moves the store to "error"; the next focus or keystroke
 * tries again. Until then the box says suggestions are unavailable (a status
 * message, not a fake "nothing matched") and Enter still runs the full search
 * on /search, which matches on the server.
 */
interface IndexSnapshot {
  status: "idle" | "loading" | "ready" | "error";
  entries: readonly SearchEntry[];
}

const IDLE: IndexSnapshot = { status: "idle", entries: [] };
let indexSnapshot: IndexSnapshot = IDLE;
const indexListeners = new Set<() => void>();

function setIndexSnapshot(next: IndexSnapshot) {
  indexSnapshot = next;
  for (const listener of indexListeners) listener();
}

function subscribeIndex(listener: () => void) {
  indexListeners.add(listener);
  return () => {
    indexListeners.delete(listener);
  };
}

const getIndexSnapshot = () => indexSnapshot;
/** The server never has the index: suggestions are a browser-only feature. */
const getServerIndexSnapshot = () => IDLE;

function isEntry(value: unknown): value is SearchEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.kind === "string" &&
    typeof v.slug === "string" &&
    typeof v.title === "string" &&
    typeof v.subtitle === "string" &&
    typeof v.href === "string" &&
    // Only site paths: an entry is a navigation target.
    v.href.startsWith("/") &&
    !v.href.startsWith("//") &&
    typeof v.haystack === "string" &&
    (v.image === undefined || typeof v.image === "string")
  );
}

/** Starts the download unless it is already loaded or in flight. Safe to call on every keystroke. */
function ensureSearchIndex() {
  if (indexSnapshot.status === "loading" || indexSnapshot.status === "ready") return;
  setIndexSnapshot({ status: "loading", entries: [] });
  fetch("/search-index.json")
    .then((res) => {
      if (!res.ok) throw new Error(`search index: HTTP ${res.status}`);
      return res.json() as Promise<unknown>;
    })
    .then((data) => {
      setIndexSnapshot({ status: "ready", entries: Array.isArray(data) ? data.filter(isEntry) : [] });
    })
    .catch(() => {
      setIndexSnapshot({ status: "error", entries: [] });
    });
}

export interface SearchInputProps {
  /** Pre-fill, e.g. from `?q=` on the search page. */
  defaultValue?: string;
  placeholder?: string;
  /** Visually hidden label text for the combobox. */
  label?: string;
  autoFocus?: boolean;
  /** Called after the user navigates. Use it to close a sheet or dialog. */
  onNavigate?: () => void;
  className?: string;
  size?: "md" | "lg";
}

/**
 * Search box with live suggestions, usable anywhere on the site.
 * Follows the combobox pattern: arrow keys move through suggestions, Enter
 * opens the highlighted one (or runs a full search), Escape closes the list.
 * Escape closes ONLY the list while it shows, so inside the header's search
 * dialog the first Escape closes the suggestions and the second the dialog
 * (see the capture listener below for why that needs more than onKeyDown).
 *
 * Suggestions are computed in the browser from the static search index with
 * the same `matchEntries` the /search page uses, so typing makes no requests
 * and needs no debounce. The spinner shows only while the index downloads.
 */
export function SearchInput({
  defaultValue = "",
  placeholder = "Search places, stays, food, experiences…",
  label = "Search Discover Manipur",
  autoFocus = false,
  onNavigate,
  className,
  size = "md",
}: SearchInputProps) {
  const router = useRouter();
  const id = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [value, setValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);

  // ------------------------------------------------------------- index load
  const index = React.useSyncExternalStore(
    subscribeIndex,
    getIndexSnapshot,
    getServerIndexSnapshot,
  );

  // `autoFocus` focuses before React attaches onFocus, so start the load
  // explicitly when the box mounts focused or pre-filled (the /search page
  // does both). Otherwise the load waits for focus or input.
  React.useEffect(() => {
    if (autoFocus || defaultValue.trim().length >= MIN_TERM) ensureSearchIndex();
  }, [autoFocus, defaultValue]);

  // -------------------------------------------------------------- suggestions
  const term = value.trim();
  /** Recomputed only when the term or the index changes; backspacing costs nothing. */
  const suggestions = React.useMemo(
    () =>
      index.status === "ready" && term.length >= MIN_TERM
        ? matchEntries(index.entries, term, SUGGESTION_LIMIT)
        : [],
    [index, term],
  );
  const loading = index.status === "loading" && term.length >= MIN_TERM;

  // Nothing to show until the index is in, so the list waits for "ready". A
  // failed load gets a status line instead of a misleading "nothing matched".
  const showList = open && term.length >= MIN_TERM && index.status === "ready";
  const showUnavailable = open && term.length >= MIN_TERM && index.status === "error";
  /** Either popover under the box: what the first Escape closes. */
  const popoverOpen = showList || showUnavailable;

  // ------------------------------------------------------------------ Escape
  // Radix's dialog listens for Escape on `document` in the CAPTURE phase
  // (@radix-ui/react-dismissable-layer, `ownerDocument.addEventListener(
  // "keydown", ..., { capture: true })`), which runs before any React handler,
  // so stopPropagation in onKeyDown comes too late to keep the header dialog
  // open. `window` capture runs before `document` capture, and the layer
  // skips its dismiss when the event is already default-prevented. So while a
  // popover shows, an Escape aimed at this input is marked here and onKeyDown
  // then closes the popover. With no popover the listener is gone and Escape
  // behaves as before (the dialog closes; the browser clears the field).
  React.useEffect(() => {
    if (!popoverOpen) return;
    function onEscapeCapture(event: KeyboardEvent) {
      // An Escape that cancels an IME composition is the IME's, not ours.
      if (event.key !== "Escape" || event.isComposing) return;
      if (event.target === inputRef.current) event.preventDefault();
    }
    window.addEventListener("keydown", onEscapeCapture, { capture: true });
    return () => window.removeEventListener("keydown", onEscapeCapture, { capture: true });
  }, [popoverOpen]);

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
      if (popoverOpen && !event.nativeEvent.isComposing) {
        // Close only the popover: no native clear of the field, and no
        // React ancestor (a dialog, a sheet) treats it as its own Escape.
        event.preventDefault();
        event.stopPropagation();
      }
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
          ref={inputRef}
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
            setActive(-1);
            ensureSearchIndex();
            setOpen(next.trim().length >= MIN_TERM);
          }}
          onFocus={() => {
            ensureSearchIndex();
            if (term.length >= MIN_TERM) setOpen(true);
          }}
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
                setActive(-1);
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
            {suggestions.length === 0 && (
              <li className="px-4 py-5 text-sm text-muted-foreground" role="presentation">
                Nothing matched “{term}”. Press Enter to search the whole catalogue.
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
                    {/* The index only carries uncredited self-hosted files (see the
                        route), so no credit overlay is owed on this 44px tile.
                        Without one (most Places-only rows) the kind's icon fills
                        it; the kind label beside it already names the kind. */}
                    {result.image ? (
                      <CatalogueImage
                        src={result.image}
                        alt=""
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : (
                      <KindIcon
                        kind={result.kind}
                        className="absolute inset-0 m-auto size-5 text-muted-foreground"
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
              See all results for “{term}”
            </button>
          )}
        </div>
      )}

      {/* Always mounted, so screen readers have a live region to announce the
          message into when it appears. Not an option: the combobox stays
          collapsed (aria-expanded follows the listbox alone), and Enter still
          runs the full search. */}
      <div role="status" aria-live="polite">
        {showUnavailable && (
          <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 rounded-[var(--radius)] border border-border bg-surface px-4 py-5 text-sm text-muted-foreground shadow-[var(--shadow-lg)]">
            Suggestions are unavailable right now. Press Enter to search everything.
          </div>
        )}
      </div>
    </div>
  );
}
