import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Manipur Tourism lockup.
 *
 * A woven mark — four bands of a phanek stripe — set against a two-part
 * wordmark: "Manipur" in the display didone, "Tourism" as a mono micro-label
 * underneath. The mark's bands stagger outward on hover, the way a loom
 * opens a shed.
 */
export function Logo({
  className,
  inverted = false,
  tone = "auto",
}: {
  className?: string;
  /** Force the ivory treatment — used on the dark footer. */
  inverted?: boolean;
  /** `inherit` takes its colour from the parent, so the header can drive it. */
  tone?: "auto" | "inherit";
}) {
  const wordmarkTone =
    tone === "inherit" ? "text-current" : inverted ? "text-ivory-50" : "text-foreground";
  const labelTone =
    tone === "inherit" ? "text-current opacity-60" : inverted ? "text-ivory-50/60" : "text-muted-foreground";

  return (
    <Link
      href="/"
      aria-label="Manipur Tourism — The Land of Jewels, home"
      className={cn(
        "group inline-flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        className,
      )}
    >
      <span aria-hidden className="flex flex-col gap-[3px]">
        {[
          { w: "w-6", tone: "bg-ningthou-600" },
          { w: "w-4", tone: "bg-brass-500" },
          { w: "w-6", tone: "bg-ningthou-600" },
          { w: "w-3", tone: "bg-brass-500" },
        ].map((band, i) => (
          <span
            key={i}
            className={cn(
              "block h-[3px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              band.w,
              band.tone,
              i % 2 === 0 ? "group-hover:w-3" : "group-hover:w-6",
            )}
          />
        ))}
      </span>

      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[1.375rem] leading-none tracking-tight transition-colors",
            wordmarkTone,
          )}
        >
          Manipur
        </span>
        <span
          className={cn(
            "eyebrow mt-1 leading-none",
            labelTone,
          )}
        >
          Tourism
        </span>
      </span>
    </Link>
  );
}
