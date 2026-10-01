import localFont from "next/font/local";

/**
 * Self-hosted fonts, from the Fontsource npm packages (same OFL files Google
 * Fonts serves, pinned by package-lock.json).
 *
 * Why not `next/font/google`: it downloads font CSS from Google on every
 * build and dev compile, and about 1 response in 60 comes back with
 * extensionless `fonts.gstatic.com/l/font?kit=…&skey=…` URLs. Both Turbopack
 * ("next/font/google queries have exactly one entry") and webpack fail on
 * those, a random hard build failure that a rebuild "fixes". Open upstream:
 * https://github.com/vercel/next.js/issues/99114. Local files never touch the
 * network, so the build is hermetic.
 *
 * Subsets: `next/font/local` cannot give each file its own `unicode-range`,
 * so Latin and Latin Extended are separate families chained in one CSS
 * variable (see `fontVariables`). The browser takes each character from the
 * first family that has it, so the extended file loads only for the handful
 * of names that need it (š, ň, ă, ą, ǝ in photo credits today). The Latin
 * family alone is preloaded and carries the size-matched fallback.
 */

// Paths are spelled out in full: next/font only accepts literal option values,
// which it reads at compile time.

// Body voice. Figtree is a humanist geometric: tall x-height, round open
// bowls, no quirky letterforms to trip over. It is the half of the system
// doing the actual reading work, so it also carries the micro-labels.
// Variable weight 300–900, upright + italic.
const figtreeLatin = localFont({
  src: [
    { path: "../../node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2", weight: "300 900", style: "normal" },
    { path: "../../node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-italic.woff2", weight: "300 900", style: "italic" },
  ],
  display: "swap",
  adjustFontFallback: "Arial",
});
const figtreeExt = localFont({
  src: [
    { path: "../../node_modules/@fontsource-variable/figtree/files/figtree-latin-ext-wght-normal.woff2", weight: "300 900", style: "normal" },
    { path: "../../node_modules/@fontsource-variable/figtree/files/figtree-latin-ext-wght-italic.woff2", weight: "300 900", style: "italic" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

// Display voice. Newsreader is a low-contrast oldstyle drawn for long-form
// reading, warm where a didone is sharp. Its `opsz` axis is the point: the
// same family opens up at hero scale and tightens at pull-quote scale, so
// headings stay calm instead of brittle. The `opsz` files carry opsz + wght
// 200–800, upright + italic.
const newsreaderLatin = localFont({
  src: [
    { path: "../../node_modules/@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2", weight: "200 800", style: "normal" },
    { path: "../../node_modules/@fontsource-variable/newsreader/files/newsreader-latin-opsz-italic.woff2", weight: "200 800", style: "italic" },
  ],
  display: "swap",
  adjustFontFallback: "Times New Roman",
});
const newsreaderExt = localFont({
  src: [
    { path: "../../node_modules/@fontsource-variable/newsreader/files/newsreader-latin-ext-opsz-normal.woff2", weight: "200 800", style: "normal" },
    { path: "../../node_modules/@fontsource-variable/newsreader/files/newsreader-latin-ext-opsz-italic.woff2", weight: "200 800", style: "italic" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

// Mono is reserved for genuinely machine-ish text (booking references,
// coordinates, application ids), never for decorative labels.
// Latin only, 400 + 500.
export const mono = localFont({
  variable: "--font-mono",
  src: [
    { path: "../../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  display: "swap",
  // Metric-matching a monospace face to Arial would be wrong; the CSS stack
  // falls back to ui-monospace instead.
  adjustFontFallback: false,
});

// The hero cycles the state's name through the three scripts it is actually
// written in, so Devanagari needs a real face. Without one मणिपुर falls back
// to a system font and sits visibly apart from the other two. A serif, to
// answer Newsreader rather than fight it.
export const devanagari = localFont({
  variable: "--font-devanagari",
  src: [
    {
      path: "../../node_modules/@fontsource-variable/noto-serif-devanagari/files/noto-serif-devanagari-devanagari-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  display: "swap",
  adjustFontFallback: false,
});

// Meetei Mayek: the state's own script, variable weight (covers 400 + 600).
export const mayek = localFont({
  variable: "--font-mayek",
  src: [
    {
      path: "../../node_modules/@fontsource-variable/noto-sans-meetei-mayek/files/noto-sans-meetei-mayek-meetei-mayek-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  display: "swap",
  adjustFontFallback: false,
});

/** `'Primary', 'Primary Fallback'` → its two parts. */
function families(font: { style: { fontFamily: string } }) {
  const [primary, ...rest] = font.style.fontFamily.split(",").map((s) => s.trim());
  return { primary, fallback: rest.join(", ") };
}

function chain(latin: typeof figtreeLatin, ext: typeof figtreeExt) {
  const l = families(latin);
  return [l.primary, families(ext).primary, l.fallback].filter(Boolean).join(", ");
}

/** The CSS variables `globals.css` reads, set inline on `<html>`. */
export const fontVariables = {
  "--font-figtree": chain(figtreeLatin, figtreeExt),
  "--font-newsreader": chain(newsreaderLatin, newsreaderExt),
} as Record<string, string>;

/** Classes that define the single-family variables (mono, scripts). */
export const fontVariableClasses = [mono.variable, devanagari.variable, mayek.variable].join(" ");
