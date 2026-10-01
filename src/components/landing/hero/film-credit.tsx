import { cn } from "@/lib/utils";

/**
 * The Instagram mark, inline.
 *
 * `lucide-react` v1 dropped its brand icons, so there is no `Instagram` export
 * to import. Drawn here in the same stroke idiom as the rest of the icon set
 * (24-box, 2px stroke, round caps) so it sits with them rather than against
 * them. Decorative: the link around it carries the accessible name.
 */
function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

/**
 * Credit for the fold's film.
 *
 * A link, not a caption: a credit the reader cannot follow is decoration, and
 * this names the person whose footage the whole fold is built on.
 *
 * It is rendered inside the search row rather than floated over the film at a
 * fixed percentage. A percentage drifts (it lands beside the lede on a short
 * viewport and under the rail on a tall one), whereas sitting in the search
 * row keeps it on the search field's own baseline at every height.
 */
export function FilmCredit({ handle, className }: { handle: string; className?: string }) {
  return (
    <a
      href={`https://instagram.com/${handle}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full",
        "border border-ivory-50/15 bg-ink-950/55 px-3.5 py-2 backdrop-blur-sm",
        "text-sm leading-none text-ivory-50/85",
        "transition-colors duration-[var(--dur-base)] ease-[var(--ease-flat)]",
        "hover:bg-ink-950/75 hover:text-ivory-50",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <InstagramGlyph className="size-4 shrink-0" />
      <span>{handle}</span>
      <span className="sr-only">, film credit, opens Instagram in a new tab</span>
    </a>
  );
}
