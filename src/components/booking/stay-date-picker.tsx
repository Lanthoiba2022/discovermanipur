"use client";

import type { CSSProperties } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";

import { startOfToday } from "@/lib/booking";

export type { DateRange };

/**
 * Range calendar, themed onto the Manipur Tourism design tokens through
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

export function StayDatePicker({
  value,
  onChange,
  months = 1,
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  months?: number;
}) {
  return (
    <DayPicker
      mode="range"
      min={1}
      numberOfMonths={months}
      selected={value}
      onSelect={onChange}
      disabled={{ before: startOfToday() }}
      startMonth={startOfToday()}
      style={THEME}
      className="text-sm"
      aria-label="Choose your check-in and check-out dates"
    />
  );
}
