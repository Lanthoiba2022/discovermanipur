import Image from "next/image";
import { ArrowUpRight, Map } from "lucide-react";

import { IntentLink } from "@/components/shared/intent-link";
import { cn } from "@/lib/utils";

/**
 * The map-collection teaser.
 *
 * A conversion moment, so it carries exactly one call to action: the whole
 * card is the link, and the "Open the 3D map" line inside it is a styled span,
 * not a second, competing target.
 *
 * The imagery uses `.mask-arch` (the Manipuri gateway profile) and
 * `.media-recede`: the photograph sits back, desaturated and dimmed, until the
 * card is hovered or focused, at which point it comes fully forward. That is
 * the payoff, and it costs no JavaScript.
 *
 * `compact` is the inline variant used on the Kangla Fort hotspot page.
 */
export function KanglaTeaser({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={cn(
        compact ? "my-12" : "chapter-light py-[clamp(4.5rem,8vw,7rem)]",
      )}
      aria-label="Explore Kangla in 3D"
    >
      <div className={compact ? undefined : "shell-mid"}>
        <IntentLink
          href="/explore/kangla"
          className="group relative grid overflow-hidden rounded-[var(--radius-lg)] bg-ink-950 text-ivory-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring md:grid-cols-[0.85fr_1fr]"
        >
          <div className="relative min-h-60 p-5 md:min-h-[22rem] md:p-7">
            <div className="mask-arch relative size-full min-h-52 overflow-hidden">
              <Image
                src="/file-uploads/kangla-kanglasha.webp"
                alt="The white kanglasha (dragon-lion guardians) standing on the brick forecourt inside Kangla Fort, Imphal."
                fill
                sizes="(max-width: 768px) 92vw, 34rem"
                className="media-recede object-cover transition-transform duration-[600ms] ease-[var(--ease-flat)] group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center p-6 pt-0 md:p-10 md:pl-4 lg:p-14 lg:pl-6">
            <p className="eyebrow rule-flank rule-flank-start mb-6 text-brass-400">
              <Map aria-hidden className="size-4" />
              <span>The map collection · 01</span>
            </p>

            <h2 className="font-display text-[clamp(1.875rem,1.25rem+2vw,2.75rem)] leading-[1.06] tracking-[-0.015em]">
              Kangla, from a new angle.
            </h2>

            <p className="mt-5 max-w-md text-base leading-relaxed text-ivory-50/75">
              Tilt, rotate and zoom across the fort and its river bank, with the
              moats, the coronation ground and the shrines pinned where they
              actually stand.
            </p>

            <span className="mt-9 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-transform duration-200 ease-[var(--ease-flat)] group-hover:-translate-y-0.5 h-11">
              Open the 3D map
              <ArrowUpRight aria-hidden className="size-4" />
            </span>

            {/* The explorer renders Google satellite imagery draped
                on terrain. Imphal has no 3D building mesh, so promising
                "3D buildings" would be a promise the map cannot keep. */}
            <p className="mt-4 text-xs text-ivory-50/55">
              Google satellite imagery on terrain · landmarks located from
              OpenStreetMap
            </p>
          </div>
        </IntentLink>
      </div>
    </section>
  );
}
