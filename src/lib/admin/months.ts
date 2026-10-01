import type { MonthPoint } from "@/lib/host/types";

/** Month buckets are counted in Manipur's time zone, in SQL and here alike. */
export const ADMIN_TIME_ZONE = "Asia/Kolkata";

export interface MonthSlot {
  /** `YYYY-MM`, matching `to_char(..., 'YYYY-MM')` in the queries. */
  key: string;
  label: string;
  year: number;
}

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function yearMonthIn(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit" }).formatToParts(date);
  const pick = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: pick("year"), month: pick("month") };
}

/** The last `count` calendar months, oldest first, ending with the current one. */
export function recentMonths(now: Date, count = 12): MonthSlot[] {
  const { year, month } = yearMonthIn(now, ADMIN_TIME_ZONE);
  return Array.from({ length: count }, (_, i) => {
    const offset = month - 1 - (count - 1 - i);
    const y = year + Math.floor(offset / 12);
    const m = ((offset % 12) + 12) % 12;
    return { key: `${y}-${String(m + 1).padStart(2, "0")}`, label: SHORT_MONTHS[m], year: y };
  });
}

/** One point per slot; months with no rows are zero. */
export function fillMonths(slots: MonthSlot[], counts: { month: string; value: number }[]): MonthPoint[] {
  const byKey = new Map(counts.map((c) => [c.month, c.value]));
  return slots.map((s) => ({ label: s.label, value: byKey.get(s.key) ?? 0 }));
}

export function windowLabel(slots: MonthSlot[]) {
  const first = slots[0];
  const last = slots[slots.length - 1];
  return `${first.label} ${first.year} to ${last.label} ${last.year}`;
}
