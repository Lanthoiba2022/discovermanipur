"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

import { CatalogueImage } from "@/components/shared/catalogue-image";
import { cn } from "@/lib/utils";

/** Scroll progress through the hero, clamped like a ranged `useTransform`. */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Immersive header image that drifts slower than the page scroll.
 * Under `prefers-reduced-motion` it is a plain, static image.
 *
 * This is the LCP element of every hotspot and festival detail page, and its
 * `src` is usually a Google Places photo, so it renders through
 * `CatalogueImage`: Places sources skip `/_next/image` (which would answer 400
 * on the proxy's 307 and leave the hero empty), our own files stay optimized.
 */
export function ParallaxHero({
  src,
  alt,
  credit,
  children,
  className,
  heightClassName = "min-h-[72vh] md:min-h-[82vh]",
}: {
  src: string;
  alt: string;
  /** Photographer credit. Required for Google Places photos. */
  credit?: string;
  children: ReactNode;
  className?: string;
  heightClassName?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  /*
   * Reduced motion is applied INSIDE the transforms, never by branching the
   * `style` prop. `useReducedMotion()` is null during SSR and true on a
   * reduced-motion client, so `style={reduce ? undefined : { y, scale }}`
   * rendered different inline styles on server and client: a hydration
   * mismatch on the LCP hero. Here `style` is always `{ y, scale }`; the flag
   * lives in a motion value (0 on the server and on first client render, so
   * both agree on `transform: none`), and flipping it re-runs the transforms
   * straight to neutral without a React re-render or a scroll event.
   *
   * Same parallax range as before: y 0% to 16%, scale 1 to 1.12 over the
   * hero's scroll-out.
   */
  const prefersReduced = useReducedMotion();
  const still = useMotionValue(0);
  useEffect(() => {
    still.set(prefersReduced ? 1 : 0);
  }, [prefersReduced, still]);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform([scrollYProgress, still], ([progress, off]: number[]) =>
    off ? "0%" : `${clamp01(progress) * 16}%`,
  );
  const scale = useTransform([scrollYProgress, still], ([progress, off]: number[]) =>
    off ? 1 : 1 + clamp01(progress) * 0.12,
  );

  return (
    <header
      ref={ref}
      // Tells the fixed site header it is sitting over a dark band, so the
      // wordmark and nav invert until the page scrolls past this image.
      data-hero-tone="dark"
      className={cn(
        // Ink ground under the photo: a slow image (often a redirected Places
        // photo) left the cream title on the ivory page until it arrived.
        "relative isolate flex flex-col justify-end overflow-hidden bg-ink-950",
        heightClassName,
        className,
      )}
    >
      <motion.div className="absolute inset-0 -z-10" style={{ y, scale }}>
        <CatalogueImage
          src={src}
          alt={alt}
          fill
          preload
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-950/80 via-ink-900/30 via-35% to-ink-950/88"
      />
      {credit && (
        /* Licence condition for Google Places photos, not decoration. Bottom
           right, clear of the hero copy, quiet enough not to fight it. */
        <span className="pointer-events-none absolute bottom-2 right-3 z-10 text-[10px] leading-none text-white/55">
          {credit}
        </span>
      )}
      <div className="shell relative w-full pb-14 pt-28 md:pb-20 md:pt-32">
        {children}
      </div>
    </header>
  );
}
