"use client";

import { Check } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";


/**
 * A commitment checklist. Deliberately not persisted anywhere: the point is
 * the reading, not the record.
 */
export function VisitorPledge({ items }: { items: string[] }) {
  const [checked, setChecked] = React.useState<boolean[]>(() => items.map(() => false));
  const count = checked.filter(Boolean).length;
  const complete = count === items.length;

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 md:p-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl md:text-3xl">The visitor&apos;s pledge</h2>
        <p aria-live="polite" className="text-sm text-muted-foreground">
          <span className="tabular-nums font-medium text-foreground">{count}</span> of{" "}
          {items.length} agreed
        </p>
      </div>

      <p className="mt-4 max-w-[62ch] leading-relaxed text-muted-foreground">
        Nothing here is enforced and nothing is recorded. Read each line, and tick it only if you
        mean it.
      </p>

      <ul className="mt-8 space-y-3">
        {items.map((line, i) => {
          const id = `pledge-${i}`;
          return (
            <li key={id}>
              <label
                htmlFor={id}
                className={cn(
                  "flex cursor-pointer items-start gap-4 rounded-[var(--radius)] border p-4 transition-colors",
                  checked[i]
                    ? "border-secondary/45 bg-secondary/[0.08]"
                    : "border-border hover:bg-muted",
                )}
              >
                <input
                  id={id}
                  type="checkbox"
                  checked={checked[i]}
                  onChange={(e) =>
                    setChecked((prev) => prev.map((v, j) => (j === i ? e.target.checked : v)))
                  }
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[6px] border transition-colors",
                    "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                    checked[i]
                      ? "border-secondary bg-secondary text-secondary-foreground"
                      : "border-border-strong bg-surface",
                  )}
                >
                  {checked[i] && <Check className="size-3.5" />}
                </span>
                <span className="text-[0.975rem] leading-relaxed text-ink-700 dark:text-cream-200">
                  {line}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <p
        aria-live="polite"
        className={cn(
          "mt-7 text-sm transition-opacity",
          complete ? "text-secondary opacity-100" : "text-muted-foreground opacity-70",
        )}
      >
        {complete
          ? "That is the whole pledge. Travel well, and tell the next visitor."
          : "Take your time. The list is short on purpose."}
      </p>
    </div>
  );
}
