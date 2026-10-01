import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The persistent planning tab, pinned to the right edge of the viewport.
 *
 * The national board pins two of these, one to each edge. Two is clutter (the
 * left one repeats what its header already offers), so this is the single
 * standing invitation on the page, and it goes to the planner.
 *
 * Deliberately not interactive beyond being a link, so it stays a Server
 * Component: no state, no effect, nothing to hydrate for a fixture that never
 * changes.
 *
 * The constraints it has to satisfy, all of them load-bearing:
 *
 * - **Hidden below `lg`.** A phone has no edge to spare, and at that width it
 *   would land on the concierge button. The planner is reachable from the
 *   header nav and the concierge panel on small screens.
 * - **Clear of the concierge.** That button is `fixed bottom-4 right-4 z-50`
 *   (`md:bottom-6 md:right-6`). This tab is centred on the vertical axis
 *   instead of anchored to a corner, so the two never share space at any
 *   viewport tall enough to show both.
 * - **Under the header.** `z-40`, one step below the header's `z-50`, so an
 *   open mega-menu panel passes over it rather than under it.
 * - **Keyboard reachable with a visible ring.** It is a real link in the
 *   document flow, and the focus ring is brass rather than the global crimson
 *   `--ring`, which would be nearly invisible against the crimson tab.
 *
 * Contrast: ivory-50 on ningthou-700 is 10.1:1, and the brass ring on the same
 * ground clears 3:1 for non-text UI.
 */
export function SideTab({ className }: { className?: string }) {
  return (
    <Link
      href="/plan"
      className={cn(
        "group fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 lg:flex",
        "items-center gap-3 rounded-l-[var(--radius)] bg-ningthou-700 py-6 pl-3 pr-2.5",
        "text-ivory-50 shadow-[var(--shadow-md)] print:hidden",
        // Transform and colour only, on the house hover easing.
        "transition-[background-color,padding] duration-[var(--dur-base)] ease-[var(--ease-flat)]",
        "hover:bg-ningthou-600 hover:pl-4",
        "focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-brass-300",
        className,
      )}
    >
      {/* `vertical-rl` reads top-to-bottom, which is the direction an edge tab
          is scanned in. The arrow is rotated back to horizontal so it points
          along the reading direction rather than across it. */}
      <span className="eyebrow [writing-mode:vertical-rl]">Plan my trip</span>
      <ArrowRight
        aria-hidden
        className="size-3.5 rotate-90 transition-transform duration-[var(--dur-base)] ease-[var(--ease-flat)] group-hover:translate-y-0.5"
      />
    </Link>
  );
}
