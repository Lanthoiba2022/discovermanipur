import Image from "next/image";
import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/**
 * Chapter mood for a page opener.
 *
 * `light` and `sand` are the two editorial grounds; `dark` and `crimson` are
 * full-bleed opening bands. The mood is the ONLY thing this switches — the
 * structure, the type ramp and the figure index are identical across all four,
 * so every listing route opens with the same hero pattern.
 */
export type HeroTone = "light" | "sand" | "dark" | "crimson";

/** A single figure in the hero's index — how many, where, from how much. */
export interface HeroFigure {
  /** The number or short value. Set in the display face. */
  value: string;
  /** Uppercase micro-label underneath. */
  label: string;
}

export interface PageHeroImage {
  src: string;
  alt: string;
}

interface ToneStyle {
  ground: string;
  eyebrow: string;
  completion: string;
  figureValue: string;
  rule: string;
  /** Dark grounds flip the fixed header's wordmark to ivory on first paint. */
  dark: boolean;
}

/**
 * Colour is the only axis that varies. Every value here is measured on its own
 * ground: `brass-500` is 2.90:1 on ivory and may not carry text, so the light
 * tones take `brass-700` and the dark tones take `brass-300`.
 *
 * The light tones also need the dark-theme fallback spelled out. The theme is
 * toggled by a `.dark` class on `<html>` and this stylesheet has no matching
 * `dark:` variant registered, so `[.dark_&]` is what actually reaches it —
 * without it `brass-700` sits at ~3.3:1 on the near-black ground.
 */
const TONES: Record<HeroTone, ToneStyle> = {
  light: {
    ground: "chapter-light",
    eyebrow: "text-brass-700 [.dark_&]:text-brass-300",
    completion: "text-brass-700 [.dark_&]:text-brass-300",
    figureValue: "text-foreground",
    rule: "border-border-strong",
    dark: false,
  },
  sand: {
    ground: "bg-surface-sand text-foreground",
    eyebrow: "text-brass-700 [.dark_&]:text-brass-300",
    completion: "text-brass-700 [.dark_&]:text-brass-300",
    figureValue: "text-foreground",
    rule: "border-border-strong",
    dark: false,
  },
  dark: {
    ground: "chapter-dark",
    eyebrow: "text-brass-300",
    completion: "text-brass-300",
    figureValue: "text-brass-300",
    rule: "border-border-strong",
    dark: true,
  },
  crimson: {
    ground: "chapter-crimson",
    eyebrow: "text-brass-300",
    completion: "text-brass-300",
    figureValue: "text-brass-300",
    rule: "border-border-strong",
    dark: true,
  },
};

/**
 * The one page opener.
 *
 * Structure, in every tone:
 *
 *   eyebrow, flanked by a rule
 *   ┌ h1: a calm display word, then an italic line completing the sentence
 *   └ standfirst + actions (right column, or under the title when a photo
 *     takes the right column)
 *   a ruled index of figures across the full measure
 *
 * Always carries the `pt-28 md:pt-32` offset the fixed, transparent site
 * header needs, and marks itself `data-hero-tone="dark"` on the dark grounds
 * so the header flips to ivory in CSS on the first paint.
 */
export function PageHero({
  eyebrow,
  title,
  completion,
  meiteiTitle,
  lede,
  figures,
  image,
  tone = "light",
  titleScale,
  id,
  children,
  className,
}: {
  eyebrow: string;
  /** The display line. Short reads best — the sentence finishes in `completion`. */
  title: string;
  /** Italic accent line that completes the title's sentence. Part of the `h1`. */
  completion?: string;
  /** Meetei Mayek rendering of the title, set below it. */
  meiteiTitle?: string;
  lede?: ReactNode;
  figures?: HeroFigure[];
  image?: PageHeroImage;
  tone?: HeroTone;
  /** Defaults to `display` on the dark grounds, `headline` on the light ones. */
  titleScale?: "display" | "headline";
  /** Anchor id. Carries a scroll margin so the header never covers it. */
  id?: string;
  children?: ReactNode;
  className?: string;
}) {
  const t = TONES[tone];
  const scale = titleScale ?? (t.dark ? "display" : "headline");
  const hasFigures = Boolean(figures && figures.length > 0);

  /**
   * The figure index, rendered in one of two places.
   *
   * With a photo it belongs in the text column, under the standfirst, laid out
   * 2x2 — that column runs short against a 4:5 photo, and stacking the figures
   * into the space fills it instead of leaving a hole and pushing the numbers
   * past the fold. Without a photo the standfirst already occupies the right
   * column, so the index keeps the full measure and runs 4-across.
   *
   * Same markup either way; only the column count differs.
   */
  const figureIndex = hasFigures ? (
    <dl
      className={cn(
        "grid gap-x-8 gap-y-8",
        image ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4",
      )}
    >
      {figures?.map((figure) => (
        <div
          key={figure.label}
          className={cn("flex flex-col-reverse gap-2.5 border-t pt-4", t.rule)}
        >
          {/* `dt` leads in the DOM because that is the order a definition list
              is specified in; the flex reversal puts the number on top where it
              belongs visually. */}
          <dt className="eyebrow text-muted-foreground">{figure.label}</dt>
          <dd className={cn("font-display text-4xl leading-none md:text-5xl", t.figureValue)}>
            {figure.value}
          </dd>
        </div>
      ))}
    </dl>
  ) : null;

  return (
    <section
      id={id}
      data-hero-tone={t.dark ? "dark" : undefined}
      className={cn(
        "relative isolate overflow-hidden pt-28 md:pt-32",
        id && "scroll-mt-28 md:scroll-mt-32",
        t.ground,
        className,
      )}
    >
      {t.dark && (
        <div
          aria-hidden
          className="dawn-wash pointer-events-none absolute -right-40 -top-32 -z-10 size-[42rem] opacity-25"
        />
      )}

      <div className="shell">
        <div
          className={cn(
            "pt-10 md:pt-14",
            t.dark ? "pb-16 md:pb-24" : cn("border-b pb-12 md:pb-16", t.rule),
          )}
        >
          <Reveal>
            <p className={cn("eyebrow rule-flank rule-flank-start", t.eyebrow)}>{eyebrow}</p>
          </Reveal>

          <div className="mt-7 grid gap-x-14 gap-y-9 md:mt-9 lg:grid-cols-12">
            <Reveal className={cn("flex flex-col lg:col-span-7", image && "lg:pb-1")}>
              <h1>
                <span className={cn("block", scale === "display" ? "section-word" : "text-headline")}>
                  {title}
                </span>
                {meiteiTitle && (
                  <span className="mt-3 block font-mayek text-2xl font-normal tracking-normal text-brass-700 [.dark_&]:text-brass-300 md:text-3xl">
                    {meiteiTitle}
                  </span>
                )}
                {completion && (
                  <span className={cn("section-completion mt-4 block max-w-[34ch]", t.completion)}>
                    {completion}
                  </span>
                )}
              </h1>

              {/* The standfirst sits directly under the title. Pinning it to
                  the foot of the column (`mt-auto`) so its baseline meets the
                  bottom of the photo leaves a screen-deep hole between the
                  italic line and the copy on a wide viewport.
                  Without a photo the standfirst moves into the right column
                  and fills the measure. */}
              {image && lede && (
                <div className="text-lead mt-7 text-muted-foreground">{lede}</div>
              )}
              {image && children && <div className="mt-8">{children}</div>}
              {image && figureIndex && (
                <div className="mt-10 md:mt-12">{figureIndex}</div>
              )}
            </Reveal>

            {image ? (
              <Reveal delayIndex={1} className="lg:col-span-4 lg:col-start-9 lg:self-end">
                <div className="mask-arch relative aspect-4/5 w-full bg-surface-sunken sm:aspect-3/2 lg:aspect-4/5">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    preload
                    sizes="(max-width: 1024px) 100vw, 30vw"
                    className="object-cover"
                  />
                </div>
              </Reveal>
            ) : (
              (lede || children) && (
                <Reveal
                  delayIndex={1}
                  className="flex flex-col justify-end gap-8 lg:col-span-5 lg:pb-1"
                >
                  {lede && <div className="text-lead text-muted-foreground">{lede}</div>}
                  {children}
                </Reveal>
              )
            )}
          </div>

          {!image && figureIndex && (
            <Reveal delayIndex={2} className="mt-12 md:mt-16">
              {figureIndex}
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
