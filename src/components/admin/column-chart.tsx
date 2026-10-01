"use client";

import { useId, useState } from "react";

import { CHART_SERIES } from "@/components/admin/chart-colors";
import type { MonthPoint } from "@/lib/host/types";
import { cn, formatINR } from "@/lib/utils";

/**
 * Formatters are named rather than passed as functions: this component is
 * rendered from Server Components, which cannot hand a function across the
 * boundary.
 */
export type ValueFormat = "number" | "inr" | "inr-compact";

const FORMATTERS: Record<ValueFormat, (value: number) => string> = {
  number: (v) => v.toLocaleString("en-IN"),
  inr: (v) => formatINR(v),
  "inr-compact": (v) => formatINR(v, { compact: true }),
};

const VB_W = 720;
const VB_H = 250;
const PAD_L = 52;
const PAD_R = 12;
const PAD_T = 26;
const PAD_B = 34;
const MAX_BAR = 24;

function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];
  for (const step of steps) {
    const candidate = step * magnitude;
    if (candidate >= value) return candidate;
  }
  return 10 * magnitude;
}

/** Rounded at the data end, square at the baseline. */
function columnPath(x: number, y: number, w: number, h: number, r = 4) {
  const radius = Math.min(r, w / 2, h);
  return [
    `M ${x} ${y + h}`,
    `L ${x} ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    `L ${x + w - radius} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + radius}`,
    `L ${x + w} ${y + h}`,
    "Z",
  ].join(" ");
}

export interface ColumnChartProps {
  data: MonthPoint[];
  /** Plain-language description of what is plotted, used for the chart's a11y label. */
  caption: string;
  /** Column header for the value column in the table view. */
  valueLabel: string;
  format?: ValueFormat;
  color?: string;
  /** Shown instead of the chart when there is nothing to plot, including all-zero data. */
  emptyMessage?: string;
  className?: string;
}

/**
 * Single-series column chart drawn as inline SVG (no charting dependency).
 * One series, so no legend: the caption names what is plotted. The peak is
 * directly labelled, every column has a hover/focus tooltip, and the full
 * numbers are always available in the table view beneath.
 */
export function ColumnChart({
  data,
  caption,
  valueLabel,
  format = "number",
  color = CHART_SERIES[0],
  emptyMessage = "No figures for this period yet.",
  className,
}: ColumnChartProps) {
  const formatValue = FORMATTERS[format];
  const [active, setActive] = useState<number | null>(null);
  const tableId = useId();

  if (data.every((d) => d.value === 0)) {
    return (
      <div className={cn("rounded-[var(--radius)] border border-dashed border-border p-8 text-center", className)}>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const top = niceMax(Math.max(...data.map((d) => d.value)));
  const plotW = VB_W - PAD_L - PAD_R;
  const plotH = VB_H - PAD_T - PAD_B;
  const band = plotW / data.length;
  const barW = Math.min(MAX_BAR, band - 10);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * top);
  const peak = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);
  const activePoint = active === null ? null : data[active];

  return (
    <figure className={cn("m-0", className)}>
      <div className="relative">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label={`${caption}. Peak: ${data[peak].label}, ${formatValue(data[peak].value)}. Full figures in the table below.`}
        >
          {ticks.map((t) => {
            const y = PAD_T + plotH - (t / top) * plotH;
            return (
              <g key={t}>
                <line
                  x1={PAD_L}
                  x2={VB_W - PAD_R}
                  y1={y}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                />
                <text
                  x={PAD_L - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={11}
                  fill="var(--color-muted-foreground)"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatValue(t)}
                </text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const h = Math.max(1, (d.value / top) * plotH);
            const x = PAD_L + i * band + (band - barW) / 2;
            const y = PAD_T + plotH - h;
            const isActive = active === i;
            return (
              <g key={d.label}>
                <path
                  d={columnPath(x, y, barW, h)}
                  fill={color}
                  opacity={active === null || isActive ? 1 : 0.45}
                />
                {i === peak && (
                  <text
                    x={x + barW / 2}
                    y={y - 9}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={600}
                    fill="var(--color-foreground)"
                  >
                    {formatValue(d.value)}
                  </text>
                )}
                <text
                  x={PAD_L + i * band + band / 2}
                  y={VB_H - 12}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--color-muted-foreground)"
                >
                  {d.label}
                </text>
                <rect
                  x={PAD_L + i * band}
                  y={PAD_T}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  role="button"
                  aria-label={`${d.label}: ${formatValue(d.value)} ${valueLabel.toLowerCase()}`}
                  className="cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                />
              </g>
            );
          })}

          <line
            x1={PAD_L}
            x2={VB_W - PAD_R}
            y1={PAD_T + plotH}
            y2={PAD_T + plotH}
            stroke="var(--color-border-strong)"
            strokeWidth={1}
          />
        </svg>

        {activePoint && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-xs shadow-[var(--shadow-md)]"
            style={{
              left: `${((PAD_L + (active! + 0.5) * ((VB_W - PAD_L - PAD_R) / data.length)) / VB_W) * 100}%`,
            }}
          >
            <span className="block font-medium text-foreground">{activePoint.label}</span>
            <span className="block text-muted-foreground">
              {formatValue(activePoint.value)} {valueLabel.toLowerCase()}
            </span>
          </div>
        )}
      </div>

      <figcaption className="mt-3 text-sm text-muted-foreground">{caption}</figcaption>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          View as table
        </summary>
        <table className="mt-3 w-full text-sm" id={tableId}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="py-2 font-medium">
                Month
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                {valueLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-b border-border/60 last:border-0">
                <th scope="row" className="py-2 font-normal text-muted-foreground">
                  {d.label}
                </th>
                <td className="py-2 text-right tabular-nums text-foreground">{formatValue(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
