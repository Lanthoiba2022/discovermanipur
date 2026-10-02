"use client";

import { useCallback, useEffect, type CSSProperties, type ReactNode } from "react";

/**
 * The house easings, named. `expo` is the default settle; `spring` overshoots
 * and is for entrances only (never for something being read); `flat` has a long
 * tail and suits anything that should feel unhurried. The same curves as the
 * `--ease-*` tokens in globals.css, spelled out so a call site can pick one.
 */
const EASES = {
  expo: "cubic-bezier(0.22, 1, 0.36, 1)",
  spring: "cubic-bezier(0.2, 0.9, 0.25, 1.1)",
  flat: "cubic-bezier(0.4, 0, 0.1, 1)",
} as const;

export type RevealEase = keyof typeof EASES;

/** Stagger between siblings sharing a `delayIndex` sequence. */
const STEP_MS = 70;
/** Stagger between words in a `RevealText` heading. */
const WORD_STEP_MS = 50;

/**
 * Attribute set on `<html>` once React has hydrated (by `RevealReady`, which
 * the root layout mounts on every page, and again by any reveal wired up).
 *
 * The inline script in the root layout adds `html.js` before first paint (the
 * class the hidden state hangs off), then checks for this attribute shortly
 * after the window `load` event. If it never appeared, the JavaScript failed
 * (a blocked chunk, a flaky network, an extension throwing) and the script
 * drops `js` again, so the page shows its content instead of staying blank.
 * Keyed to `load` rather than a fixed delay because the page's async chunks
 * hold up `load`: a slow network gets more time, not a premature fallback.
 */
const READY_ATTR = "data-reveal-ready";

function markReady(): void {
  document.documentElement.setAttribute(READY_ATTR, "");
}

/**
 * Tells the root layout's no-JS fallback that hydration happened. Renders
 * nothing. Mounted once in the root layout rather than relying on a reveal
 * being on the page: landing on a page with no reveals would otherwise let
 * the fallback drop `html.js` for the whole visit, and every page reached by
 * client navigation afterwards would lose its entrances.
 */
export function RevealReady(): null {
  useEffect(markReady, []);
  return null;
}

/* ---------------------------------------------------------------------------
   One IntersectionObserver per viewport margin, shared by every reveal on the
   page (a module singleton, created on first use). Each element is revealed
   once: the observer marks it `data-revealed` and stops watching it. CSS does
   the rest; see the "Scroll reveals" block in globals.css.

   This is the second of two observers. The root layout's inline script
   already handles every reveal in the server HTML at DOMContentLoaded,
   without waiting for hydration: it marks those on screen
   `data-revealed="instant"` and watches the rest with an observer of its own.
   The component's observer is what covers elements mounted afterwards (client
   navigation, a list growing) and is a backstop for the first page. Both
   leave an existing `data-revealed` alone, so an element is revealed exactly
   once, and an "instant" one never has its entrance replayed.
   --------------------------------------------------------------------------- */

const observers = new Map<string, IntersectionObserver>();

function observerFor(rootMargin: string): IntersectionObserver {
  let io = observers.get(rootMargin);
  if (!io) {
    io = new IntersectionObserver(
      (entries, self) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (!entry.target.hasAttribute("data-revealed")) {
            entry.target.setAttribute("data-revealed", "");
          }
          self.unobserve(entry.target);
        }
      },
      { rootMargin },
    );
    observers.set(rootMargin, io);
  }
  return io;
}

/**
 * Start watching `el`; returns the cleanup React 19 runs when the ref
 * detaches. Without IntersectionObserver the element is revealed at once:
 * the failure mode is "no entrance", never "invisible".
 */
function observeReveal(el: HTMLElement, rootMargin: string): (() => void) | undefined {
  markReady();
  if (el.hasAttribute("data-revealed")) return undefined;
  if (typeof IntersectionObserver === "undefined") {
    el.setAttribute("data-revealed", "");
    return undefined;
  }
  const io = observerFor(rootMargin);
  io.observe(el);
  return () => io.unobserve(el);
}

/** A callback ref that wires its element into the shared observer. */
function useRevealRef(rootMargin: string) {
  return useCallback((el: HTMLElement | null) => (el ? observeReveal(el, rootMargin) : undefined), [rootMargin]);
}

/**
 * Fade-and-rise on scroll into view, as progressive enhancement.
 *
 * The element is server-rendered fully visible. It carries `data-reveal` and
 * two custom properties (its stagger delay and easing), and the hidden state
 * lives in CSS, gated four ways: only under `html.js` (set by an inline
 * script before first paint, and withdrawn again if the JavaScript never
 * arrives), only until an observer marks it `data-revealed`, only under
 * `prefers-reduced-motion: no-preference`, and only on screen (never in
 * print). A reader with no JavaScript, failed
 * JavaScript or reduced motion therefore always sees the content, and the
 * page's LCP never waits on hydration for anything outside a reveal.
 *
 * Hydration contract: the markup and the inline style depend only on the
 * props, never on `matchMedia`, reduced motion or anything else that differs
 * between server and client, so server and client render byte-identical
 * markup. Reduced motion is decided by the media query in CSS, where it is
 * correct on the very first paint. `data-revealed` is written to the DOM by
 * an observer (on the first page usually the layout's inline script, before
 * hydration), outside React's props, so a re-render never takes it away. The
 * element carries `suppressHydrationWarning` because that attribute may
 * already be there when React hydrates; it covers this element's own
 * attributes only, not its children.
 */
export function Reveal({
  children,
  className,
  delayIndex = 0,
  as: Tag = "div",
  ease = "expo",
}: {
  children: ReactNode;
  className?: string;
  delayIndex?: number;
  as?: "div" | "section" | "li" | "article";
  /** Entrances may use `spring`; anything carrying prose should not. */
  ease?: RevealEase;
}) {
  // Framer's `margin: "-80px"`: the element has to be properly on screen, not
  // just touching the edge, before it rises.
  const ref = useRevealRef("-80px");
  const style = {
    "--reveal-delay": `${delayIndex * STEP_MS}ms`,
    "--reveal-ease": EASES[ease],
  } as CSSProperties;

  return (
    <Tag ref={ref} data-reveal="" className={className} style={style} suppressHydrationWarning>
      {children}
    </Tag>
  );
}

/**
 * Word-by-word display heading reveal. Same contract as `Reveal`.
 *
 * Each word sits in its own `overflow: hidden` span and rises from below that
 * mask, 50 ms after the word before it. There is no opacity change: the words
 * are clipped, not faded, so even mid-animation nothing is see-through. The
 * heading itself is the observed element (60 px inset, as before), so the
 * whole line starts together rather than word by word as each crosses the
 * margin.
 */
export function RevealText({
  text,
  className,
  as: Tag = "h2",
  ease = "flat",
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
  ease?: RevealEase;
}) {
  const ref = useRevealRef("-60px");

  return (
    <Tag
      ref={ref}
      data-reveal-text=""
      className={className}
      suppressHydrationWarning
      style={{ "--reveal-ease": EASES[ease] } as CSSProperties}
    >
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
          <span
            data-reveal-word=""
            className="inline-block"
            style={{ "--reveal-delay": `${i * WORD_STEP_MS}ms` } as CSSProperties}
          >
            {word}
            {" "}
          </span>
        </span>
      ))}
    </Tag>
  );
}
