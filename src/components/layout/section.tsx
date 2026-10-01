import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";

/** Rungs of the measure ladder. A page should narrow as it descends. */
export type SectionWidth = "wide" | "mid" | "tight" | "prose";

const WIDTHS: Record<SectionWidth, string> = {
  wide: "shell",
  mid: "shell-mid",
  tight: "shell-tight",
  prose: "shell-prose",
};

/**
 * The standard section masthead.
 *
 * Title left, standfirst right, action on the baseline, closed by a rule:
 * the same grammar as the page opener in `PageHero`, one step down the type
 * ramp, so the rhythm holds from the hero through to the last band.
 */
export function Section({
  eyebrow,
  title,
  completion,
  description,
  action,
  children,
  className,
  contentClassName,
  headingId,
  id,
  tone = "light",
  width = "wide",
}: {
  eyebrow?: string;
  title?: string;
  /** Italic accent line completing the title's sentence. Part of the heading. */
  completion?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Set when the caller wants to label the landmark from the heading. */
  headingId?: string;
  /** Anchor id. Carries a scroll margin so the fixed header never covers it. */
  id?: string;
  /** Chapter mood: drives ground, type and rule colours. */
  tone?: "light" | "sand" | "dark" | "crimson";
  /** Which rung of the measure ladder this band sits on. */
  width?: SectionWidth;
}) {
  const hasHeader = Boolean(eyebrow || title || description || action);
  const dark = tone === "dark" || tone === "crimson";

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "py-[var(--space-section)]",
        id && "scroll-mt-28 md:scroll-mt-32",
        tone === "dark" && "chapter-dark",
        tone === "crimson" && "chapter-crimson",
        tone === "light" && "chapter-light",
        tone === "sand" && "bg-surface-sand text-foreground",
        className,
      )}
    >
      <div className={WIDTHS[width]}>
        {hasHeader && (
          <Reveal className="mb-10 border-b border-border-strong pb-10 md:mb-14">
            <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:gap-16">
              <div>
                {eyebrow && (
                  <p className="eyebrow rule-flank rule-flank-start mb-5 text-muted-foreground">
                    {eyebrow}
                  </p>
                )}
                {title && (
                  <h2 id={headingId}>
                    <span className="text-headline block">{title}</span>
                    {completion && (
                      <span
                        className={cn(
                          "section-completion mt-3 block max-w-[34ch]",
                          dark ? "text-brass-300" : "text-brass-700 [.dark_&]:text-brass-300",
                        )}
                      >
                        {completion}
                      </span>
                    )}
                  </h2>
                )}
              </div>

              <div className="flex flex-col justify-end gap-6">
                {description && <p className="text-lead text-muted-foreground">{description}</p>}
                {action && <div className="shrink-0">{action}</div>}
              </div>
            </div>
          </Reveal>
        )}
        <div className={contentClassName}>{children}</div>
      </div>
    </section>
  );
}
