import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";

/**
 * The standard section masthead.
 *
 * Title left, standfirst right, action on the baseline, closed by a rule —
 * one editorial opener shared by every listing band on the site, so the
 * rhythm holds from the home page through to the inner routes.
 */
export function Section({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  tone = "light",
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Chapter mood — drives ground, type and rule colours. */
  tone?: "light" | "dark" | "crimson";
}) {
  const hasHeader = Boolean(eyebrow || title || description || action);

  return (
    <section
      className={cn(
        "py-[var(--space-section)]",
        tone === "dark" && "chapter-dark",
        tone === "crimson" && "chapter-crimson",
        tone === "light" && "chapter-light",
        className,
      )}
    >
      <div className="shell">
        {hasHeader && (
          <Reveal className="mb-10 border-b border-border-strong pb-10 md:mb-14">
            <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:gap-16">
              <div>
                {eyebrow && (
                  <p className="eyebrow mb-5 flex items-center gap-3 text-muted-foreground">
                    <span className="weave-rule inline-block h-[3px] w-10 rounded-full" />
                    {eyebrow}
                  </p>
                )}
                {title && <h2 className="text-headline">{title}</h2>}
              </div>

              <div className="flex flex-col justify-end gap-6">
                {description && (
                  <p className="text-lead text-muted-foreground">{description}</p>
                )}
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
