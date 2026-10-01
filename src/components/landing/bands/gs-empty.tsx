import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The empty state every showcase band falls back to.
 *
 * All four getters can legitimately return `[]` — an unconfigured database, a filter that matches nothing (the "quieter places" band filters
 * featured spots out, so it empties first), a content table still being
 * seeded. A band that indexes `rows[0]` in that state takes the whole landing
 * page down, so every band renders this instead and the page still reads as a
 * finished national tourism page rather than a hole.
 *
 * Shared by all four bands; the `gs-` prefix is only a filename convention,
 * not a hint that it belongs to Get Started.
 */
export function BandEmpty({
  title,
  body,
  href,
  cta,
  tone = "light",
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
  /** Matches the band's ground so the panel is not a bright hole in a dark band. */
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";

  return (
    <div
      className={cn(
        "mx-auto flex max-w-[44rem] flex-col items-center rounded-[var(--radius-lg)] border border-dashed px-6 py-12 text-center md:px-10",
        dark ? "border-ivory-50/30 bg-ink-950/20" : "border-border-strong bg-surface",
      )}
    >
      <h3 className={cn("font-display text-2xl leading-snug", dark ? "text-ivory-50" : "text-foreground")}>
        {title}
      </h3>

      <p
        className={cn(
          "mt-3 max-w-[46ch] text-sm leading-relaxed md:text-base",
          dark ? "text-ivory-50/80" : "text-muted-foreground",
        )}
      >
        {body}
      </p>

      <Link
        href={href}
        className={cn(
          // 44px tall with room to spare, so it clears the touch-target floor
          // on its own rather than relying on the line box.
          "mt-7 inline-flex min-h-11 items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-medium",
          "transition-colors duration-[var(--dur-base)] ease-[var(--ease-flat)]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          dark
            ? "border-brass-300/60 text-brass-300 hover:bg-brass-300 hover:text-ink-950"
            : "border-border-strong text-foreground hover:border-primary hover:text-primary",
        )}
      >
        {cta}
      </Link>
    </div>
  );
}
