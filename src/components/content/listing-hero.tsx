import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export interface HeroFigure {
  /** The number or short value. Set in the display face. */
  value: string;
  /** Mono micro-label underneath. */
  label: string;
}

/**
 * The opening band shared by every listing route.
 *
 * Title and standfirst on the left, a ruled index of figures on the right.
 * The index exists for a reason beyond decoration: these heroes previously
 * ran copy to `max-w-2xl` and left the remaining 40% of a desktop screen
 * empty, and the figures put real scent (how many, which districts, what it
 * costs) on the fold instead.
 *
 * Carries the `pt-28 md:pt-32` offset the fixed transparent header needs.
 */
export function ListingHero({
  eyebrow,
  title,
  lede,
  figures,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  lede?: ReactNode;
  figures?: HeroFigure[];
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("chapter-light pt-28 md:pt-32", className)}>
      <div className="shell">
        <div className="grid gap-10 border-b border-border-strong pb-10 pt-10 md:pb-14 md:pt-16 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow flex items-center gap-3 text-muted-foreground">
              <span className="weave-rule inline-block h-[3px] w-10 rounded-full" />
              {eyebrow}
            </p>
            <h1 className="text-headline mt-5">{title}</h1>
            {lede && (
              <div className="text-lead mt-6 max-w-[54ch] text-muted-foreground">{lede}</div>
            )}
            {children && <div className="mt-8">{children}</div>}
          </Reveal>

          {figures && figures.length > 0 && (
            <Reveal delayIndex={1} className="lg:col-span-4 lg:col-start-9 lg:self-end">
              <dl className="grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-3 lg:grid-cols-2">
                {figures.map((f) => (
                  <div key={f.label} className="border-t border-border pt-4">
                    <dd className="font-display text-3xl leading-none">{f.value}</dd>
                    <dt className="eyebrow mt-2.5 text-muted-foreground">{f.label}</dt>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
