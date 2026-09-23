import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The landing page's section shell.
 *
 * The national tourism board's home page runs one rhythm nine times: a giant
 * uppercase word, a line completing the sentence, a rail of cards, and a
 * single pill. It is repetitive by design — that is what makes a state
 * tourism page feel official rather than scrappy — but it is also why theirs
 * reads as eight identical stripes over 9,600px.
 *
 * So the structure is the same and the variation is ours: `tone` alternates
 * the ground (photo band → ivory → sand → crimson), the word inverts colour
 * across those grounds, and the subtitle is an oldstyle italic rather than
 * more of the same sans. `align` moves the masthead off centre on some bands
 * so the page does not march down a single axis.
 */
export type BandTone = "photo" | "ivory" | "sand" | "crimson" | "ink";

const GROUND: Record<BandTone, string> = {
  photo: "relative text-ivory-50",
  ivory: "chapter-light",
  sand: "chapter-light bg-surface-sand",
  crimson: "chapter-crimson",
  ink: "chapter-dark",
};

/** The word inverts across grounds; the tail always takes the accent. */
const WORD: Record<BandTone, string> = {
  photo: "text-ivory-50",
  ivory: "text-primary",
  sand: "text-primary",
  crimson: "text-ivory-50",
  ink: "text-ivory-50",
};

const TAIL: Record<BandTone, string> = {
  photo: "text-ivory-50/85",
  ivory: "text-brass-700",
  sand: "text-brass-700",
  crimson: "text-brass-300",
  ink: "text-brass-400",
};

const RULE: Record<BandTone, string> = {
  photo: "bg-ivory-50/40",
  ivory: "bg-brass-700/40",
  sand: "bg-brass-700/40",
  crimson: "bg-brass-300/40",
  ink: "bg-brass-400/40",
};

export function ShowcaseBand({
  id,
  tone = "ivory",
  align = "center",
  word,
  tail,
  eyebrow,
  action,
  children,
  backdrop,
  ghost,
  className,
  innerClassName,
  headingLevel: Heading = "h2",
}: {
  id?: string;
  tone?: BandTone;
  /** Centre reads institutional; left breaks the march down the page. */
  align?: "center" | "left";
  /** The one enormous word. */
  word: string;
  /** The line that finishes its sentence. */
  tail: string;
  eyebrow?: string;
  action?: ReactNode;
  children?: ReactNode;
  /** Full-bleed media for `tone="photo"`, rendered behind everything. */
  backdrop?: ReactNode;
  /** Decorative Meetei Mayek mark behind light grounds. */
  ghost?: string;
  className?: string;
  innerClassName?: string;
  headingLevel?: "h2" | "h3";
}) {
  const centred = align === "center";

  return (
    <section
      id={id}
      className={cn(
        "relative isolate overflow-hidden py-[clamp(4rem,7vw,6.5rem)]",
        GROUND[tone],
        id && "scroll-mt-28 md:scroll-mt-32",
        className,
      )}
    >
      {backdrop}

      {ghost && (
        <span aria-hidden className="ghost-mark -right-10 top-4 md:right-4">
          {ghost}
        </span>
      )}

      <div className={cn("shell relative", innerClassName)}>
        <header
          className={cn(
            "mb-10 flex flex-col md:mb-14",
            centred ? "items-center text-center" : "items-start text-left",
          )}
        >
          {eyebrow && (
            <p className={cn("eyebrow mb-4", TAIL[tone])}>{eyebrow}</p>
          )}

          <Heading className={cn("display-word", WORD[tone])}>{word}</Heading>

          {/* The tail is flanked by two short rules — the editorial tick that
              says a new chapter starts here without adding a type size. */}
          <p
            className={cn(
              "mt-4 flex max-w-[46ch] items-center gap-4",
              centred ? "justify-center" : "justify-start",
            )}
          >
            {centred && (
              <span aria-hidden className={cn("hidden h-px w-10 shrink-0 sm:block", RULE[tone])} />
            )}
            <span className={cn("display-tail", TAIL[tone])}>{tail}</span>
            <span aria-hidden className={cn("hidden h-px w-10 shrink-0 sm:block", RULE[tone])} />
          </p>
        </header>

        {children}

        {action && (
          <div className={cn("mt-10 flex md:mt-12", centred ? "justify-center" : "justify-start")}>
            {action}
          </div>
        )}
      </div>
    </section>
  );
}
