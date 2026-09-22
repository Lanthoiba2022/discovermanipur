import Link from "next/link";

import { ArrowUpRight } from "lucide-react";

/**
 * Graceful placeholder used whenever a data call returns nothing yet.
 * Keeps the section's rhythm instead of collapsing the layout.
 */
export function EmptyNote({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col items-start gap-5 rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sunken/60 px-6 py-12 text-center sm:items-center md:py-16">
      <div className="sm:text-center">
        <p className="font-display text-xl text-foreground md:text-2xl">{title}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {cta}
        <ArrowUpRight aria-hidden className="size-4" />
      </Link>
    </div>
  );
}
