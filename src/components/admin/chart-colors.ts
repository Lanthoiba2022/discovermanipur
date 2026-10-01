/**
 * Chart colours for the host and admin dashboards.
 *
 * These are chart-surface colours, not brand tokens. Each series hue was
 * chosen by stepping the Discover Manipur hues (loktak teal, kangla gold, leirum plum,
 * shirui blush) until the palette passed the lightness-band, chroma-floor,
 * CVD-separation and normal-vision checks against the chart surface.
 *
 * They resolve through CSS custom properties defined in `globals.css`, which
 * carries a SECOND set of steps for the dark surface: the light series fails
 * the lightness band against the dark background, and the theme toggle in the
 * site header means dark mode is reachable by any visitor. Reading them as
 * variables is what lets a single series index stay correct in both themes.
 *
 * The gold sits below 3:1 against the light surface, so every chart that uses
 * it ships direct labels plus a table view.
 *
 * Categorical hues are assigned in this fixed order and never cycled.
 */
export const CHART_SERIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
] as const;

/** Reserved status colours, never reused as a categorical series. */
export const CHART_STATUS = {
  good: "var(--chart-good)",
  warning: "var(--chart-warning)",
  critical: "var(--chart-critical)",
  neutral: "var(--chart-neutral)",
} as const;
