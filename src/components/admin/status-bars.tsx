import { cn } from "@/lib/utils";

export interface StatusBarRow {
  label: string;
  value: number;
  color: string;
}

/**
 * Horizontal magnitude bars, one row per category. Every row is directly
 * labelled with its name and its value, so identity never rests on colour
 * alone and no legend is needed. Rendered as real markup rather than SVG so
 * screen readers read it as a list of label/value pairs.
 */
export function StatusBars({
  rows,
  caption,
  className,
}: {
  rows: StatusBarRow[];
  caption: string;
  className?: string;
}) {
  const top = Math.max(1, ...rows.map((r) => r.value));

  return (
    <figure className={cn("m-0", className)}>
      {rows.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nothing to break down yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="mb-1.5 flex items-baseline justify-between gap-4">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: row.color }}
                  />
                  {row.label}
                </span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {row.value.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(row.value / top) * 100}%`, background: row.color }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      <figcaption className="mt-4 text-sm text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}
