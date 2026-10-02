import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowUpRight, SearchX } from "lucide-react";

import { PageHero } from "@/components/content/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { SearchInput } from "@/components/search/search-input";
import {
  SEARCH_KINDS,
  isSearchKind,
  KindIcon,
  kindLabel,
  kindPlural,
  type SearchKind,
} from "@/components/search/kinds";
import { CatalogueImage } from "@/components/shared/catalogue-image";
import { IntentLink } from "@/components/shared/intent-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { thumbnailCredit } from "@/lib/data/photos";
import { searchCatalogue } from "@/lib/data/search";
import type { SearchEntry } from "@/lib/data/search-match";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search everything on Discover Manipur at once: places, homestays, experiences, eateries, crafts, festivals, transport and multi-day tours across Manipur.",
  robots: { index: false, follow: true },
};

const SUGGESTIONS = [
  "Loktak",
  "Imphal",
  "Sangai",
  "Shirui",
  "homestay",
  "handloom",
  "eromba",
  "Ukhrul",
  "Kangla",
  "trek",
];

const CATALOGUE = [
  { href: "/hotspots", label: "Places", blurb: "Lakes, hills, forts and floating islands" },
  { href: "/homestays", label: "Stays", blurb: "Live with a Manipuri family" },
  { href: "/experiences", label: "Experiences", blurb: "Weave, cook, paddle, celebrate" },
  { href: "/eateries", label: "Eat", blurb: "Eromba, singju and chak-hao" },
  { href: "/tours", label: "Tours", blurb: "Curated multi-day routes" },
];

/**
 * Full search results.
 *
 * Server-rendered per request on purpose: `?q=` URLs are shareable and land
 * on real HTML, and robots.ts keeps /search out of the index. It matches with
 * `searchCatalogue`, the same entries and the same `matchEntries` the
 * typeahead runs in the browser over `/search-index.json`, so a suggestion
 * and a full search agree. Unlike the slim static index, results here carry
 * every lead photo (Places photos included) with its credit.
 *
 * Every link here is an `IntentLink`. This page is dynamic, and a plain
 * `<Link>` prefetches its route on sight: the filter chips, the suggestion
 * chips and "Show all" all point back at /search, so one view could cost
 * a dozen or more extra function invocations. `IntentLink` never prefetches
 * /search (`isDynamicHref`) and prefetches the static result pages only on
 * hover, focus or touch.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const params = await searchParams;
  const term = (params.q ?? "").trim();
  const activeType = isSearchKind(params.type) ? params.type : undefined;

  const all: SearchEntry[] = term ? await searchCatalogue(term, 200) : [];

  const counts = new Map<SearchKind, number>();
  for (const row of all) counts.set(row.kind, (counts.get(row.kind) ?? 0) + 1);

  const filtered = activeType ? all.filter((r) => r.kind === activeType) : all;

  const grouped = SEARCH_KINDS.map((kind) => ({
    kind: kind.value,
    heading: kind.plural,
    rows: filtered.filter((r) => r.kind === kind.value),
  })).filter((g) => g.rows.length > 0);

  function typeHref(type?: string) {
    const sp = new URLSearchParams();
    if (term) sp.set("q", term);
    if (type) sp.set("type", type);
    const qs = sp.toString();
    return qs ? `/search?${qs}` : "/search";
  }

  return (
    <>
      <PageHero
        eyebrow="Search"
        title={term ? `“${term}”` : "Search"}
        titleScale="display"
        completion={
          term
            ? `${all.length} ${all.length === 1 ? "result" : "results"} across the catalogue.`
            : "one box across every place, stay, experience, eatery, tour, craft, festival and transport option."
        }
      >
        <div className="w-full max-w-xl">
          <SearchInput
            defaultValue={term}
            size="lg"
            autoFocus={!term}
            placeholder="Try “Loktak”, “homestay”, “eromba”…"
            label="Search places, stays, experiences, eateries and tours"
          />
        </div>
      </PageHero>

      <div className="shell pt-14 pb-28 md:pt-20 md:pb-36">
        {/* ------------------------------ Filters ---------------------------- */}
        {term && all.length > 0 && (
          <Reveal className="mb-10 flex flex-wrap items-center gap-2 border-b border-border pb-6">
            <span className="eyebrow mr-2 text-muted-foreground">Filter</span>
            <FilterLink href={typeHref()} active={!activeType}>
              All <span className="tabular-nums opacity-70">{all.length}</span>
            </FilterLink>
            {SEARCH_KINDS.map((kind) => {
              const count = counts.get(kind.value) ?? 0;
              if (count === 0) return null;
              return (
                <FilterLink
                  key={kind.value}
                  href={typeHref(kind.value)}
                  active={activeType === kind.value}
                >
                  {kind.plural} <span className="tabular-nums opacity-70">{count}</span>
                </FilterLink>
              );
            })}
          </Reveal>
        )}

        {/* ------------------------------ Results ---------------------------- */}
        {!term ? (
          <EmptyState
            title="What are you looking for?"
            body="Start typing above; suggestions appear as you go. Or pick one of these to see what the catalogue holds."
          />
        ) : all.length === 0 ? (
          <EmptyState
            icon
            title={`Nothing matched “${term}”.`}
            body="The catalogue may still be filling, or the spelling may differ from ours, as many Manipuri place names have several romanisations. Try a shorter word, or start from one of these."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon
            title={`No ${activeType ? kindPlural(activeType).toLowerCase() : "results"} for “${term}”.`}
            body="There are results in other categories, though. Clear the filter to see them."
          >
            <Button asChild variant="outline" className="mt-6">
              <IntentLink href={typeHref()}>Show all {all.length} results</IntentLink>
            </Button>
          </EmptyState>
        ) : (
          <div className="space-y-16">
            {grouped.map((group) => (
              <section key={group.kind} aria-labelledby={`group-${group.kind}`}>
                <div className="mb-6 flex items-baseline gap-4">
                  <h2 id={`group-${group.kind}`} className="text-title">
                    {group.heading}
                  </h2>
                  <Badge variant="default">{group.rows.length}</Badge>
                </div>

                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.rows.map((row, i) => (
                    <Reveal as="li" key={`${row.kind}-${row.slug}`} delayIndex={i % 3}>
                      <ResultCard result={row} />
                    </Reveal>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <IntentLink
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border-strong text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </IntentLink>
  );
}

/**
 * One result. The thumbnail renders through `CatalogueImage` (most lead photos
 * are Google Places photos and must bypass `/_next/image`) and carries its
 * credit as the one-line 9px overlay the gallery grid uses: a licence
 * condition for Places photos, not decoration.
 */
function ResultCard({ result }: { result: SearchEntry }) {
  const credit = thumbnailCredit(result.image, result.imageCredit);
  return (
    <IntentLink
      href={result.href}
      className="group flex h-full gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-3 transition-all duration-300 ease-[var(--ease-flat)] hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-md)]"
    >
      <div className="relative size-24 shrink-0 overflow-hidden rounded-[var(--radius)] bg-surface-sunken">
        {result.image ? (
          <CatalogueImage
            src={result.image}
            alt=""
            fill
            sizes="96px"
            className="object-cover transition-transform duration-500 ease-[var(--ease-flat)] group-hover:scale-105"
          />
        ) : (
          <KindIcon
            kind={result.kind}
            className="absolute inset-0 m-auto size-8 text-muted-foreground"
          />
        )}
        {result.image && credit && (
          <span className="pointer-events-none absolute inset-x-1 bottom-1 truncate text-right text-[9px] leading-none text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {credit}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
        <span className="eyebrow text-[0.625rem] text-muted-foreground">
          {kindLabel(result.kind)}
        </span>
        <span className="mt-1.5 font-display text-lg leading-snug text-foreground group-hover:text-primary">
          {result.title}
        </span>
        <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{result.subtitle}</span>
        <span className="mt-auto pt-3 text-sm font-medium text-primary">
          <ArrowUpRight
            className="inline size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </IntentLink>
  );
}

function EmptyState({
  title,
  body,
  icon = false,
  children,
}: {
  title: string;
  body: string;
  icon?: boolean;
  children?: ReactNode;
}) {
  return (
    <Reveal>
      <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sand px-6 py-16 text-center md:py-20">
        {icon && (
          <SearchX className="mx-auto mb-6 size-8 text-muted-foreground" aria-hidden="true" />
        )}
        <h2 className="text-headline">{title}</h2>
        <p className="mx-auto mt-4 max-w-[52ch] leading-relaxed text-muted-foreground">{body}</p>
        {children}

        <div className="mx-auto mt-10 max-w-2xl">
          <p className="eyebrow mb-4 text-muted-foreground">Try searching for</p>
          <ul className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <li key={s}>
                <IntentLink
                  href={`/search?q=${encodeURIComponent(s)}`}
                  className="inline-block rounded-full border border-border-strong px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {s}
                </IntentLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {CATALOGUE.map((entry) => (
            <IntentLink
              key={entry.href}
              href={entry.href}
              className="bg-surface p-5 text-left transition-colors hover:bg-muted"
            >
              <span className="block font-display text-lg text-foreground">{entry.label}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{entry.blurb}</span>
            </IntentLink>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
