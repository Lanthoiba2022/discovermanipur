import Link from "next/link";

import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The real empty state for a band whose getter came back with nothing.
 *
 * Every home band is required to render correctly against an empty dataset, so
 * this is not a spinner or a collapsed section: it keeps the band's rhythm,
 * says plainly what is missing, and still offers the onward route.
 *
 * Colour is taken entirely from `currentColor` and the chapter tokens, so the
 * same component sits correctly on the ivory, sand, ink and crimson grounds
 * without a variant per ground.
 */
export function EmptyNote({
  title,
  body,
  href,
  cta,
  className,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] border border-dashed border-border-strong px-6 py-14 md:py-20",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.16] [mask-image:radial-gradient(60%_60%_at_50%_50%,#000,transparent)]"
      >
        <div className="dawn-wash size-full" />
      </div>

      <div className="relative mx-auto flex max-w-lg flex-col items-center text-center">
        <span
          aria-hidden
          className="mask-arch mb-7 block h-10 w-8 border border-current opacity-30"
        />
        <p className="text-title">{title}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
        <Link
          href={href}
          className="mt-7 inline-flex items-center gap-2 border-b border-current/40 pb-1 text-sm font-medium transition-colors duration-200 ease-[var(--ease-flat)] hover:border-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {cta}
          <ArrowUpRight aria-hidden className="size-4" />
        </Link>
      </div>
    </div>
  );
}
