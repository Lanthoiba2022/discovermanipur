import { SearchInput } from "@/components/search/search-input";

import { CategoryRail } from "./category-rail";
import { FilmCredit } from "./film-credit";
import { HeroFilm } from "./hero-film";
import { RotatingWordmark } from "./rotating-wordmark";

const VIDEO_SRC = "/videos/ManipurHorizontalVideo.mp4";
/**
 * Frame zero of `VIDEO_SRC`, exported at 1920×1080. Using a still cut from the
 * film itself, rather than a library photograph, is what makes the handover
 * from poster to playback invisible.
 */
const POSTER_SRC = "/videos/manipur-hero-poster.jpg";

const POSTER_ALT =
  "Cloud spilling over a forested ridge in the Manipur hills at first light.";

/**
 * The landing fold.
 *
 * Built to the national tourism board's institutional rhythm (a full-bleed
 * film, the place name floating over it, one question, one search field, and a
 * rail of subjects along the bottom edge), because that sequence is what makes
 * a tourism site read as a government front door rather than a travel blog.
 * The voice underneath it is ours: an oldstyle wordmark instead of a geometric
 * sans, brass instead of saffron, and a film that asks permission before it
 * moves.
 *
 * A Server Component. The only client code in the fold is the film's transport
 * (`HeroFilm`) and the search combobox, both of which are leaves.
 *
 * Two structural details the rest of the page depends on:
 *
 * - `min-h-[100svh]`, never `100vh`. On mobile Safari and Chrome the `vh` unit
 *   measures the viewport *without* the retracting browser chrome, so a `100vh`
 *   fold is taller than the screen and the category rail starts life below the
 *   fold it belongs to.
 * - `data-hero-tone="dark"`, which `globals.css` reads with `body:has(…)` to
 *   flip the fixed header's wordmark to ivory on the very first paint. It has
 *   to live on this section; there is no JavaScript fallback.
 *
 * `overflow-hidden` is deliberately absent: the search field's suggestion
 * listbox drops out of the section's box, and clipping it here would cut the
 * list in half. `isolate z-10` keeps the whole fold (listbox included) above
 * the bands that follow it without going anywhere near the header's `z-50`.
 */
export function LandingHero() {
  return (
    <section
      aria-labelledby="hero-title"
      data-hero-tone="dark"
      className="relative isolate z-10 flex min-h-[100svh] flex-col bg-ink-950"
    >
      <HeroFilm
        src={VIDEO_SRC}
        poster={POSTER_SRC}
        posterAlt={POSTER_ALT}
      />

      <div className="shell relative flex flex-1 flex-col items-center justify-end pb-10 pt-36 text-center md:pb-14 md:pt-44">
        {/* The wordmark already cycles through the scripts, so the eyebrow
            only has to place the state. */}
        <p className="mb-7 flex items-center justify-center gap-4 text-ivory-50/85">
          <span aria-hidden className="h-px w-8 bg-brass-300/50" />
          <span className="eyebrow">North East India</span>
          <span aria-hidden className="h-px w-8 bg-brass-300/50" />
        </p>

        <h1 id="hero-title" className="text-display text-ivory-50">
          <RotatingWordmark />
          <span className="mt-3 block font-display text-[clamp(1.375rem,0.95rem+1.7vw,2.5rem)] font-light italic leading-tight text-brass-300">
            the land of jewels
          </span>
        </h1>

        <p className="text-lead mx-auto mt-8 max-w-[46ch] text-balance text-ivory-50/85">
          Water that grows its own islands. Hills that keep their own weather.
          A lily that waits all year to open.
        </p>

        {/* The board's fold puts one short question above its search field:
            the whole institutional trick is that the page asks first and
            offers a field second, rather than presenting a bare search box. */}
        <p className="mt-12 font-display text-[clamp(1.25rem,0.95rem+1.1vw,1.875rem)] font-normal leading-snug text-ivory-50">
          Where would you like to begin?
        </p>

        <div className="relative mt-5 w-full">
          <SearchInput
            size="lg"
            label="Search places, stays, experiences and food in Manipur"
            placeholder="Loktak, Shirui lily, Ima Keithel, chak-hao…"
            /* The field's own surface token is white on the light theme, which
               is all the separation it needs from the film. In dark mode that
               token resolves to near-black and the field all but vanishes
               against the footage, so the wrapper lends it a hairline there.
               The ring traces the input exactly and leaves the suggestion
               listbox, which is absolutely positioned out of this box,
               untouched. */
            className="mx-auto w-full max-w-2xl rounded-[var(--radius)] text-left dark:ring-1 dark:ring-ivory-50/25"
          />

        </div>
      </div>

      {/* Film credit, bottom-left of the fold.
          It sits ABOVE the category rail's top rule rather than inside the
          rail band: the rule reads as the floor of the fold, and a credit
          below it looked like part of the navigation. The rail is a fixed
          48px, so `bottom-14` clears it by 8px at every width. */}
      <FilmCredit
        handle="raj_thwdam"
        className="absolute bottom-14 left-4 z-20 md:left-8"
      />

      <CategoryRail />
    </section>
  );
}
