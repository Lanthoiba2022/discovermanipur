"use client";

import { useState, type CSSProperties } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";

import { startOfToday } from "@/lib/booking";
import { useMounted } from "@/lib/use-mounted";

export type { DateRange };

/**
 * Range calendar, themed onto the Discover Manipur design tokens through
 * react-day-picker's own custom properties. They are set inline **on the
 * picker root** because the library defines its defaults on that same element,
 * which would otherwise win over an inherited value. No global stylesheet is
 * touched.
 */
const THEME: CSSProperties = {
  "--rdp-accent-color": "var(--primary)",
  "--rdp-accent-background-color": "color-mix(in oklab, var(--primary) 12%, transparent)",
  "--rdp-today-color": "var(--accent)",
  "--rdp-range_middle-color": "var(--foreground)",
  "--rdp-range_start-color": "var(--primary-foreground)",
  "--rdp-range_end-color": "var(--primary-foreground)",
  "--rdp-day-height": "38px",
  "--rdp-day-width": "38px",
  "--rdp-day_button-height": "36px",
  "--rdp-day_button-width": "36px",
  "--rdp-nav_button-height": "2rem",
  "--rdp-nav_button-width": "2rem",
  "--rdp-months-gap": "1.5rem",
} as CSSProperties;

/**
 * `YYYY-MM-DD` as local midnight. `new Date("2026-10-05")` would be UTC
 * midnight, which is the previous evening anywhere west of Greenwich.
 */
function localDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * The stay calendar.
 *
 * **Why "today" is passed in.** The homestay pages are fully static and are
 * rebuilt only when the catalogue changes, so whatever the server took as
 * "today" is frozen into the HTML for days or weeks. Reading the clock during
 * render would therefore make the server HTML (the build day) and the first
 * client render (the visitor's day) disagree, a hydration mismatch React
 * repairs by re-rendering the segment on the client.
 *
 * So the first render on both sides uses `anchorDate`, a deterministic date
 * the server page computes and passes down, as `today`, as the displayed
 * month and as the "nothing before this" rule. Once hydrated (`useMounted`
 * flips without an effect-driven state update), the calendar switches to the
 * visitor's real local today. Same markup shape throughout: no skeleton, no
 * swap, and `fixedWeeks` keeps every month at six rows, so moving from the
 * anchor's month to the visitor's never changes the card's height.
 *
 * The displayed month follows "today" until the reader navigates; after
 * that it is theirs. The server-side `checkStart()` is still the real guard
 * against past dates; this is only what the calendar offers.
 */
export function StayDatePicker({
  value,
  onChange,
  anchorDate,
  months = 1,
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  /** `YYYY-MM-DD` the server rendered as today, used until hydration. */
  anchorDate: string;
  months?: number;
}) {
  const mounted = useMounted();
  const today = mounted ? startOfToday() : localDate(anchorDate);
  /** Null until the reader pages the calendar: until then it tracks `today`. */
  const [month, setMonth] = useState<Date | null>(null);

  return (
    <DayPicker
      mode="range"
      min={1}
      numberOfMonths={months}
      selected={value}
      onSelect={onChange}
      today={today}
      month={month ?? today}
      onMonthChange={setMonth}
      fixedWeeks
      disabled={{ before: today }}
      startMonth={today}
      style={THEME}
      className="text-sm"
      aria-label="Choose your check-in and check-out dates"
    />
  );
}
