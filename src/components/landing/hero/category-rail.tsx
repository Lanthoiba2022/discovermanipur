import { IntentLink } from "@/components/shared/intent-link";

import { HERO_CATEGORIES } from "./hero-links";

/**
 * The pipe-separated category rail that closes the fold.
 *
 * A plain scroll container rather than a slider: native touch and trackpad
 * scrolling, keyboard focus scrolls a link into view on its own, and it works
 * with no JavaScript at all, which matters for the one row on the page whose
 * whole job is to get a first-time visitor to a section.
 *
 * `overflow-x-auto` clips its own row, so the eight entries never widen the
 * document. The row bleeds to the viewport edge on phones (`-mx-4 px-4`, the
 * exact inverse of the shell gutter) so the last link is reachable at the edge
 * instead of being cut off inside a gutter.
 *
 * The links are `IntentLink`s: the rail sits in the first viewport of the
 * most-viewed page, and prefetching all eight routes on every home view cost
 * more than it saved. A route is prefetched once a visitor points at, focuses
 * or touches its link.
 */
export function CategoryRail() {
  return (
    <nav
      aria-label="Browse Manipur by subject"
      className="relative border-t border-ivory-50/20 bg-ink-950/40 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm"
    >
      <div className="shell">
        {/* The trailing gutter is not decoration: the concierge button is
            `fixed bottom-4 right-4` (60x52 including its label chip), so the
            last entry has to be able to scroll out from under it. Measured at
            375px, the rail's end sat at x=359 against the button's x=299.
            Six rem of run-off clears it at every width below `lg`, where the
            row centres and the collision cannot happen. */}
        <ul className="-mx-4 flex items-center overflow-x-auto pl-4 pr-24 [scrollbar-width:none] md:-mx-8 md:pl-8 lg:justify-center lg:pr-8 [&::-webkit-scrollbar]:hidden">
          {HERO_CATEGORIES.map((category, i) => (
            <li key={category.href} className="flex shrink-0 items-center">
              <IntentLink
                href={category.href}
                className="inline-block whitespace-nowrap px-3 py-3.5 text-sm font-medium text-ivory-50/85 underline-offset-[6px] transition-colors duration-[var(--dur-base)] ease-[var(--ease-flat)] hover:text-brass-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brass-300"
              >
                {category.label}
              </IntentLink>
              {i < HERO_CATEGORIES.length - 1 && (
                <span aria-hidden className="select-none text-ivory-50/25">
                  |
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
