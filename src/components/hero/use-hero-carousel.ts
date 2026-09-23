"use client";

import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState, type RefObject } from "react";

/** How long one frame takes to slide across. */
export const SLIDE_MS = 900;
/** How long a frame holds before the reel moves on. */
const DWELL_MS = 5600;

/**
 * The fold's carousel state.
 *
 * The track runs one way — left to right, each frame sliding the last one off
 * — so the reel reads as a continuous pan across Manipur rather than a stack
 * of separate transitions. To keep that direction true at the wrap point, the
 * track renders one extra copy of the first frame on the end: the reel slides
 * *forward* onto the clone, then silently re-seats itself on the real first
 * frame with transitions off. Without that, every fifth step would be a long
 * backwards rewind.
 *
 * Autoplay is guarded the way the guidelines require of any auto-rotating
 * content: it never starts under `prefers-reduced-motion`, it stops while the
 * fold is off screen, it stops when the tab is hidden, it stops on hover or
 * keyboard focus of the controls, and there is a real pause button.
 *
 * Reduced motion is read here and used only in effects — never to decide what
 * gets rendered. The first render is identical either way (`index` 0,
 * `animated` true), so the server HTML and the first client render always
 * agree; see the contract in `components/motion/reveal.tsx`.
 */
export function useHeroCarousel(
  count: number,
  /**
   * The stage element, owned by the caller.
   *
   * Passed in rather than returned because returning a ref inside this object
   * makes the React Compiler treat every read of the object as a ref access
   * during render, and the whole hook lights up as an error.
   */
  stageRef: RefObject<HTMLDivElement | null>,
) {
  const reduce = useReducedMotion();

  /** 0..count — `count` is the trailing clone of the first frame. */
  const [index, setIndex] = useState(0);
  /** False for the single frame in which the reel re-seats itself. */
  const [animated, setAnimated] = useState(true);
  const [userPaused, setUserPaused] = useState(false);
  const [pointerHeld, setPointerHeld] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  const goTo = useCallback((next: number) => {
    setAnimated(true);
    setIndex(next);
  }, []);

  // Land on the clone, then re-seat on the real first frame without a
  // transition, so the rewind is never painted.
  useEffect(() => {
    if (index !== count) return;
    const t = setTimeout(() => {
      setAnimated(false);
      setIndex(0);
    }, SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, count]);

  // Re-arm transitions on the frame after the re-seat.
  useEffect(() => {
    if (animated) return;
    const r = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(r);
  }, [animated]);

  // Stop while the fold is scrolled away.
  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.15 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [stageRef]);

  // Stop while the tab is in the background.
  useEffect(() => {
    const onChange = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  const autoplaying =
    !reduce && !userPaused && !pointerHeld && onScreen && tabVisible && count > 1;

  useEffect(() => {
    // The re-seat frame is not a resting frame; it owns its own timing.
    if (!autoplaying || !animated) return;
    const t = setTimeout(() => {
      setAnimated(true);
      setIndex((i) => i + 1);
    }, DWELL_MS);
    return () => clearTimeout(t);
  }, [autoplaying, animated, index]);

  return {
    /** Where the track sits, including the clone. */
    index,
    /** Whether the track should transition, or re-seat silently. */
    animated,
    /** Which real frame the caption and dots describe. */
    shown: index % count,
    autoplaying,
    userPaused,
    togglePaused: () => setUserPaused((p) => !p),
    goTo,
    /** Bind to the controls cluster, not the stage — the stage is the viewport. */
    holdHandlers: {
      onPointerEnter: () => setPointerHeld(true),
      onPointerLeave: () => setPointerHeld(false),
      onFocusCapture: () => setPointerHeld(true),
      onBlurCapture: () => setPointerHeld(false),
    },
  };
}
