import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(value: number, opts?: { compact?: boolean }) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: opts?.compact ? "compact" : "standard",
  }).format(value);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function nightsBetween(from: Date | string, to: Date | string) {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/**
 * The Meitei name to show alongside an English title, or `undefined` when
 * there is nothing to add.
 *
 * Several records carry a `meiteiName` identical to `name` — "Kwak Tanba",
 * "Lai Haraoba", "Eromba" are the same word in both — and rendering both
 * printed the title twice. Compare case- and space-insensitively so a stray
 * capital does not slip a duplicate through.
 */
export function meiteiAlias(
  name: string | undefined,
  meiteiName: string | undefined,
): string | undefined {
  if (!meiteiName) return undefined;
  const norm = (v: string) => v.trim().toLowerCase().replace(/\s+/g, " ");
  if (name && norm(name) === norm(meiteiName)) return undefined;
  return meiteiName;
}
