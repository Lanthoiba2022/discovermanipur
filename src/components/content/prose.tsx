import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Long-form reading column. Holds the measure at roughly 65 characters and
 * supplies the vertical rhythm that editorial and legal pages share.
 */
export function Prose({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-[65ch] text-[1.0625rem] leading-[1.75] text-ink-700 dark:text-cream-200",
        "[&_p+p]:mt-5",
        "[&_h3]:mt-12 [&_h3]:font-display [&_h3]:text-2xl [&_h3]:leading-snug [&_h3]:text-foreground",
        "[&_h4]:mt-9 [&_h4]:font-display [&_h4]:text-xl [&_h4]:text-foreground",
        "[&_h3+p]:mt-4 [&_h4+p]:mt-3",
        "[&_ul]:mt-5 [&_ul]:space-y-2.5 [&_ol]:mt-5 [&_ol]:space-y-2.5",
        "[&_li]:relative [&_li]:pl-6",
        "[&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-[0.7em]",
        "[&_ul>li]:before:size-1.5 [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-accent [&_ul>li]:before:content-['']",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol>li]:pl-1",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-loktak-600",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Opening paragraph — larger, looser, set apart from the body copy. */
export function Lede({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "max-w-[58ch] font-display text-xl leading-relaxed text-ink-700 md:text-2xl md:leading-[1.5] dark:text-cream-100",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Editorial pull quote. Breaks the measure deliberately. */
export function PullQuote({
  children,
  attribution,
  className,
}: {
  children: ReactNode;
  attribution?: string;
  className?: string;
}) {
  return (
    <figure className={cn("my-14 border-l-2 border-accent pl-6 md:pl-8", className)}>
      <blockquote className="font-display text-2xl leading-[1.35] text-foreground md:text-[2rem]">
        {children}
      </blockquote>
      {attribution && (
        <figcaption className="eyebrow mt-5 text-muted-foreground">{attribution}</figcaption>
      )}
    </figure>
  );
}

/** A small, high-contrast aside — advisories, caveats, "check this yourself" notes. */
export function NoteBox({
  title,
  children,
  tone = "neutral",
  className,
}: {
  title: string;
  children: ReactNode;
  tone?: "neutral" | "warning";
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "my-10 rounded-[var(--radius-lg)] border p-6 md:p-7",
        tone === "warning"
          ? "border-warning/35 bg-warning/[0.07]"
          : "border-border bg-surface-sunken",
        className,
      )}
    >
      <p className="eyebrow mb-3 text-muted-foreground">{title}</p>
      <div className="text-[0.975rem] leading-relaxed text-ink-700 dark:text-cream-200 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_p+p]:mt-3">
        {children}
      </div>
    </aside>
  );
}
