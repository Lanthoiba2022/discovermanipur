"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Two browser preferences read as external stores rather than as effects.

   `useSyncExternalStore` is the right shape for both: it subscribes, it keeps
   the value current, and (the part that matters here) its server snapshot is
   what React uses for the hydration render, so the markup the server emitted
   and the markup the client first renders agree by construction. Reading these
   with `useState` + an effect would either flash or, done the obvious wrong
   way, decide the markup from a client-only signal.
   --------------------------------------------------------------------------- */

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduce(onChange: () => void) {
  const mq = window.matchMedia(REDUCE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/** The server cannot know either preference, so it assumes the common case. */
const serverFalse = () => false;
const serverTrue = () => true;

/** What the reader has asked for, as distinct from what is actually playing. */
type Intent = "auto" | "play" | "pause";

/**
 * Connections slow enough that an unrequested 1-3 MB film is the wrong call.
 * `effectiveType` is the Network Information API's estimate from measured
 * round-trip time and throughput, not the radio generation, so a congested
 * 4G link reports "3g" here, which is exactly when to hold back.
 */
const SLOW_CONNECTIONS = new Set(["slow-2g", "2g", "3g"]);

/**
 * The slice of the Network Information API read here. It is Chromium-only and
 * absent from TypeScript's DOM lib, so it is typed locally and every field is
 * optional: Safari and Firefox expose no `navigator.connection` at all, and
 * those readers get the default (autoplay unless reduced motion).
 */
type NetworkInformationLike = { saveData?: boolean; effectiveType?: string };

/** True when the reader asked for less data, or the link is measurably slow. */
function prefersLessData(): boolean {
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike })
    .connection;
  if (!connection) return false;
  return (
    connection.saveData === true ||
    (connection.effectiveType !== undefined && SLOW_CONNECTIONS.has(connection.effectiveType))
  );
}

/** Art direction for the film: one encode per frame shape. */
export interface HeroFilmSources {
  /** 1280x720, 30 fps, no audio track. Served to landscape viewports. */
  landscape: string;
  /**
   * A 9:16 centre crop of the same film at the source's full height
   * (404x720), served to portrait viewports. On a phone, `object-cover` would
   * otherwise discard about three quarters of every landscape frame the
   * reader still paid to download.
   */
  portrait: string;
}

export interface HeroFilmProps {
  /** The two encodes, served from `public/`. */
  sources: HeroFilmSources;
  /**
   * Still that paints the fold: frame zero of the landscape encode. The
   * portrait encode is a centre crop of the same frames, and the poster is
   * itself centre-cropped by `object-cover` on a portrait screen, so one still
   * matches both and nothing jumps at the handover.
   */
  poster: string;
  /** Describes the still, not the film; it is the image a reader lands on. */
  posterAlt: string;
}

/**
 * The fold's film.
 *
 * Three things separate this from the usual `autoplay loop muted playsinline`
 * background video, and all three are deliberate:
 *
 * 1. **The poster carries the fold, not the video.** The landscape mp4 is
 *    about 2.8 MB (the portrait one about 1.2 MB); a reader on a hotel wifi
 *    would otherwise stare at a black box while it arrives. So the still is a real `next/image` (optimised, responsive,
 *    `preload` + eager + high priority, i.e. the LCP candidate), and the
 *    `<video>` is `preload="none"` so it cannot compete for that first
 *    round-trip. The video fades over the still only once it has a frame to
 *    show. Because the still IS frame zero of the film, the handover is
 *    invisible.
 *
 * 2. **Reduced motion means no autoplay.** Not "a shorter animation": no
 *    playback at all until asked. Those readers get the photograph and a play
 *    control, which is the catalogued guidance for decorative motion at this
 *    scale. The same holds for Data Saver and for a connection the browser
 *    measures as 3G or slower: the film is decoration, so it waits to be
 *    asked rather than spending someone's mobile data.
 *
 * 3. **It stops when nobody is watching.** Scrolled past (IntersectionObserver)
 *    or tab hidden (`visibilitychange`) both pause it, so a looping film is
 *    not decoded for an hour behind someone's other work.
 *
 * ---
 * **Hydration contract.** Nothing here branches the *markup* on a client-only
 * signal. `reduce`, `onScreen` and `tabVisible` all start at the value the
 * server assumes, the `<video>` carries no `autoPlay` attribute at all, and
 * playback is started imperatively from an effect. So the server HTML and the
 * first client render are byte-identical on every machine, and only the
 * subsequent *behaviour* differs, the same rule `components/motion/reveal.tsx`
 * documents, applied to a media element instead of a transform. The choice
 * between the two encodes follows the same rule: it is made by the browser
 * from static `<source media>` markup, never by script, and with
 * `preload="none"` neither file is requested until `play()` is called.
 */
export function HeroFilm({ sources, poster, posterAlt }: HeroFilmProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [intent, setIntent] = useState<Intent>("auto");
  const [onScreen, setOnScreen] = useState(true);

  const reduce = useSyncExternalStore(
    subscribeReduce,
    () => window.matchMedia(REDUCE_QUERY).matches,
    serverFalse,
  );
  const tabVisible = useSyncExternalStore(
    subscribeVisibility,
    () => !document.hidden,
    serverTrue,
  );

  /** True once a frame has actually been decoded; only then do we cross-fade. */
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  // -------------------------------------------------------------- off-screen
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      // A quarter of the fold still showing counts as watching; below that the
      // reader has moved on and the decoder should stop.
      { threshold: 0.25 },
    );
    io.observe(host);
    return () => io.disconnect();
  }, []);

  // ------------------------------------------------------------ the one driver
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Both preferences are re-read live here rather than trusted from the
    // render. `useSyncExternalStore` still holds the SERVER snapshot on the
    // hydration pass, so this effect's first run would otherwise see
    // `reduce === false` and fire off a multi-megabyte request for precisely the
    // reader who asked for less motion. Measured: one mp4 request before the
    // store corrected itself. The store values stay in the dependency list, so
    // a reader flipping either preference mid-visit still re-runs this.
    //
    // Data Saver and a slow connection are read the same way, live, and only
    // gate the automatic start: a reader who presses play has asked, so
    // `intent === "play"` still plays. There is no subscription to the
    // connection's `change` event on purpose; a link that improves mid-visit
    // should not suddenly start a film the reader has been reading past.
    const reduced = reduce || window.matchMedia(REDUCE_QUERY).matches;
    const visible = tabVisible && !document.hidden;
    const wanted =
      intent === "play" || (intent === "auto" && !reduced && !prefersLessData());

    if (wanted && onScreen && visible) {
      // Re-asserted every time: some browsers drop the property on a
      // re-attached element, and an unmuted autoplay is rejected outright.
      video.muted = true;
      // A rejected play() is normal (data saver, low power mode, a policy we
      // do not control). The control stays on screen, so it is recoverable.
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [intent, reduce, onScreen, tabVisible]);

  return (
    <div ref={hostRef} className="absolute inset-0 overflow-hidden bg-ink-950">
      {/* The fold's actual paint. `preload` injects the <link> in <head>;
          eager + high tell the browser this is the one image that matters. */}
      <Image
        src={poster}
        alt={posterAlt}
        fill
        preload
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        className="object-cover"
      />

      {/* No `src` attribute: the browser picks the first `<source>` whose
          `media` matches, once, when playback first needs data. Portrait comes
          first because the unconditional landscape entry would match
          everywhere. Square counts as portrait, where the 9:16 crop loses
          less of the frame than a 16:9 one would. */}
      <video
        ref={videoRef}
        width={1280}
        height={720}
        loop
        muted
        playsInline
        preload="none"
        aria-hidden
        tabIndex={-1}
        onPlaying={() => setReady(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className={cn(
          "absolute inset-0 size-full object-cover",
          "transition-opacity duration-700 ease-[var(--ease-flat)] motion-reduce:transition-none",
          ready ? "opacity-100" : "opacity-0",
        )}
      >
        <source src={sources.portrait} type="video/mp4" media="(max-aspect-ratio: 1/1)" />
        <source src={sources.landscape} type="video/mp4" />
      </video>

      {/* Scrims. A flat wash holds the whole frame down far enough that ivory
          clears AA over the bright paddy and open sky the film cuts through,
          then `scrim-copy` deepens the band the copy actually sits in, and a
          top gradient gives the floating header something to sit on. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-ink-950/45" />
      <div aria-hidden className="scrim-copy pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink-950/75 to-transparent"
      />

      {/* Credit and transport, kept in the upper corner: the copy column is
          bottom-anchored, so this is the one region of the film no text
          crosses at any width. */}
      <div className="absolute right-4 top-24 z-10 flex items-center gap-3 md:right-8 md:top-28">
        <button
          type="button"
          onClick={() => setIntent(playing ? "pause" : "play")}
          aria-label={playing ? "Pause the film" : "Play the film"}
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full",
            "border border-ivory-50/30 bg-ink-950/35 text-ivory-50 backdrop-blur-sm",
            "transition-colors duration-[var(--dur-base)] ease-[var(--ease-flat)]",
            "hover:border-brass-300 hover:text-brass-300",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-300",
          )}
        >
          {playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
        </button>
      </div>
    </div>
  );
}
