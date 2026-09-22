"use client";

import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const SUGGESTIONS = ["Loktak", "Shirui lily", "Ima Keithel", "Sangai Festival"];

/**
 * Hero search. Set as a ruled editorial field rather than a floating glass
 * pill: the rule lines up with the instrument rail above it, and the submit
 * control sits flush inside the field instead of overhanging its container.
 */
export function HeroSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function go(term: string) {
    const q = term.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    go(value);
  }

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={onSubmit} role="search">
        <label htmlFor="hero-search" className="sr-only">
          Search places, stays, experiences and food in Manipur
        </label>
        <div className="flex items-center gap-3 rounded-[var(--radius)] border border-ivory-50/25 bg-ink-950/35 p-1.5 pl-4 backdrop-blur-md transition-colors duration-300 focus-within:border-brass-400/70 hover:border-ivory-50/40">
          <Search aria-hidden className="size-4 shrink-0 text-ivory-50/55" />
          <input
            id="hero-search"
            name="q"
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Loktak, Shirui, chak-hao…"
            autoComplete="off"
            className="h-11 min-w-0 flex-1 bg-transparent text-sm text-ivory-50 outline-none placeholder:text-ivory-50/45 [&::-webkit-search-cancel-button]:appearance-none"
          />
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[calc(var(--radius)-2px)] bg-ivory-50 px-5 text-sm font-medium text-ink-950 transition-colors duration-200 hover:bg-brass-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Explore
            <ArrowRight aria-hidden className="size-4" />
          </button>
        </div>
      </form>

      <ul className="mt-4 flex flex-wrap items-center gap-2">
        <li className="eyebrow mr-1 text-ivory-50/45">Try</li>
        {SUGGESTIONS.map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => go(s)}
              className="rounded-full border border-ivory-50/25 px-3 py-1 text-xs text-ivory-50/75 transition-colors hover:border-brass-400 hover:text-brass-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
