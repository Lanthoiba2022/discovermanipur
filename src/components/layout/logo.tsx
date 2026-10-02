import { IntentLink } from "@/components/shared/intent-link";
import { cn } from "@/lib/utils";

/**
 * Discover Manipur lockup.
 *
 * The mark is the outline of the state itself, set beside a two-part wordmark:
 * "Discover" as a micro-label above "Manipur" in the display oldstyle, so the
 * two read in order and the large word keeps the lockup's original width.
 *
 * The silhouette is drawn as a CSS mask filled with `currentColor` rather than
 * as an `<img>`. The supplied file is a single flat crimson shape on alpha, and
 * that crimson is close to invisible against the dark film the header floats
 * over on the landing page. Masking lets the one file take the brand crimson on
 * the ivory header, ivory over the film and ivory again in the footer, with no
 * second asset, no `filter: invert()`, and it stays in step with the
 * `--hdr-*` custom properties the header already flips on first paint.
 *
 * The link is an `IntentLink`: it sits in the header and footer of every page,
 * and a plain `<Link href="/">` would prefetch the home page segment (the
 * heaviest on the site) on every page view, opened or not. It now prefetches
 * when the visitor points at, focuses or touches it.
 */
export function Logo({
  className,
  inverted = false,
  tone = "auto",
}: {
  className?: string;
  /** Force the ivory treatment, used on the dark footer. */
  inverted?: boolean;
  /** `inherit` takes its colour from the parent, so the header can drive it. */
  tone?: "auto" | "inherit";
}) {
  const wordmarkTone =
    tone === "inherit" ? "text-current" : inverted ? "text-ivory-50" : "text-foreground";
  const labelTone =
    tone === "inherit"
      ? "text-current opacity-60"
      : inverted
        ? "text-ivory-50/60"
        : "text-muted-foreground";
  // In the header the mark follows `--hdr-mark`, which is crimson on a light
  // page and ivory while the bar sits over a dark hero.
  const markTone =
    tone === "inherit"
      ? "text-[var(--hdr-mark,var(--color-primary))]"
      : inverted
        ? "text-ivory-50"
        : "text-primary";

  return (
    <IntentLink
      href="/"
      aria-label="Discover Manipur: The Land of Jewels, home"
      className={cn(
        "group inline-flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        className,
      )}
    >
      {/* Decorative: the link is already named, and the shape adds nothing a
          screen reader can use. The box is fixed to the file's 1280×1347
          ratio so the lockup never reflows while the mask decodes. */}
      <span
        aria-hidden
        className={cn(
          "logo-mark block h-9 w-[2.14rem] shrink-0 transition-transform duration-[var(--dur-base)] ease-[var(--ease-flat)] group-hover:scale-[1.06]",
          markTone,
        )}
      />

      <span className="flex flex-col leading-none">
        <span className={cn("eyebrow mb-1 leading-none", labelTone)}>Discover</span>
        <span
          className={cn(
            "font-display text-[1.375rem] leading-none tracking-tight transition-colors",
            wordmarkTone,
          )}
        >
          Manipur
        </span>
      </span>
    </IntentLink>
  );
}
