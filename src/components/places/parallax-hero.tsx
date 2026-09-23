"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Immersive header image that drifts slower than the page scroll.
 * Under `prefers-reduced-motion` it is a plain, static image.
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
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  return (
    <header
      ref={ref}
      // Tells the fixed site header it is sitting over a dark band, so the
      // wordmark and nav invert until the page scrolls past this image.
      data-hero-tone="dark"
      className={cn(
        "relative isolate flex flex-col justify-end overflow-hidden",
        heightClassName,
        className,
      )}
    >
      <motion.div
        className="absolute inset-0 -z-10"
        style={reduce ? undefined : { y, scale }}
      >
        <Image
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
