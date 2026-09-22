# Yening — Parallel Build Contract

Read this before writing any code. The foundation (Phase 0) is **done and builds clean**.
Your job is one vertical slice. Staying inside your slice is what makes the parallel build work.

## Project
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 (CSS-first tokens) · Framer Motion ·
Lenis · React Three Fiber · TanStack Query · react-hook-form + zod · Vercel AI SDK · sonner · lucide-react.

Root: `/Users/khumanthemlanthoibameitei/Documents/MY2026/MyGithubProject/YeningTourismSprint/Tourism_Yening_Sprint`
Reference prototype to mine for content/feature parity (READ ONLY, never edit):
`/Users/khumanthemlanthoibameitei/Documents/MY2026/MyGithubProject/YeningTourismSprint/TripTreat`

## READ-ONLY to every agent (never edit, only import)
- `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`
- `src/app/globals.css` — all design tokens live here
- `src/app/layout.tsx`, `src/components/providers.tsx`
- `src/types/index.ts` — the domain contract
- `src/lib/utils.ts`, `src/lib/nav.ts`
- `src/lib/data/index.ts` and everything under `src/lib/data/seed/`
- `src/components/ui/*` — existing files. You MAY add a **new** file here only if no other slice
  would plausibly need the same name; prefer putting slice-specific components in your own folder.
- `src/components/layout/*`, `src/components/motion/*`

If you need a change to a read-only file, do NOT make it — report it in your final message instead.

## Data
Import **only** from `@/lib/data`:
```ts
import { getHotspots, getHotspotBySlug, getHomestays, getExperiences,
         getEateries, getTours, getTransportOptions, getFestivals,
         getTestimonials, globalSearch } from "@/lib/data";
```
These are `async` and are being backed by seed data right now by another agent; they may return
**empty arrays while you work — that is expected and not a bug**. Write code that renders correctly
for both an empty and a full dataset (real empty states, no crashes on `rows[0]`).
Never import from `@/lib/data/seed/*` directly. Never hardcode listings inside components.

## Design system — use the tokens, never raw hex
Palette (Tailwind classes generated from tokens): `bg-primary` (Loktak deep teal), `bg-secondary`
(phumdi moss), `bg-accent` (Kangla gold), `text-highlight` (Shirui lily blush), plus the raw scales
`loktak-900/800/700/600`, `phumdi-600/500/400`, `shirui-300/400/500`, `leirum-700/600/500`,
`kangla-600/500/400`, `cream-50/100/200`, `ink-900/700/500`. Semantic: `background`, `foreground`,
`surface`, `surface-raised`, `surface-sunken`, `border`, `border-strong`, `muted`, `muted-foreground`,
`success`, `warning`, `destructive`, `ring`.

Fonts: `font-display` (Fraunces — all headings), `font-sans` (Geist — body), `font-mayek`
(Noto Sans Meetei Mayek — Meitei script accents only).

Utilities already defined: `.shell` (page container), `.text-display`, `.text-headline`, `.eyebrow`,
`.glass`, `.grain`, `.mask-phumdi`, `.blob-phumdi`, `.weave-rule`, `.mist-top`,
`.animate-float-slow`, `.animate-drift`.

Shared components: `Button` (variants primary/accent/outline/ghost/glass/link/destructive; sizes
sm/md/lg/pill/icon), `Card` + parts, `Badge`, `Input`, `Textarea`, `Skeleton`, `Dialog`, `Tabs`,
`Accordion`, `Select`, `Label`, `Separator`, `Avatar`, and layout `Section` (`@/components/layout/section`),
`Reveal` / `RevealText` (`@/components/motion/reveal`).

Because the header is fixed and transparent at the top of the page, **every route that is not the
landing page must start its first section with top padding of at least `pt-28 md:pt-32`.**

## Quality bar (this is a hackathon *production* site, not a mock)
- **Server Components by default.** `"use client"` only where interactivity truly needs it — push it
  down to the smallest leaf. Fetch data in the server component and pass it down.
- **Images:** always `next/image` with real `sizes`, `alt`, and `priority` only on an LCP image.
  Photos live in `public/file-uploads/` (218 real Manipur photos). Reference them as `/file-uploads/<name>`.
- **Motion:** Framer Motion, duration ≤ 600ms, ease `[0.22, 1, 0.36, 1]`. Every animation must have a
  `prefers-reduced-motion` path (use the `Reveal` helpers or `useReducedMotion`).
- **Accessibility (WCAG 2.1 AA):** semantic landmarks, one `h1` per page, labelled form controls,
  `aria-label` on icon-only buttons, visible focus, keyboard-operable everything, alt text that
  describes the photo rather than repeating the title.
- **SEO:** every route exports `metadata` (or `generateMetadata` for dynamic routes) with a real
  title and description. Dynamic routes export `generateStaticParams` where the dataset allows.
- **States:** real loading (`loading.tsx` with Skeletons), empty and error states. `notFound()` for
  missing slugs.
- **Mobile first.** Must work at 375px with no horizontal scroll.
- No `any`. No unused imports. No `console.log`.

## Definition of done
From the project root, both must pass clean:
```
npx tsc --noEmit
npx next build
```
Run them yourself and fix everything before you report. If `next build` fails for a reason clearly
outside your slice, say so explicitly in your report rather than editing another slice's files.

## Report back
List the files you created, the routes you added, and anything you need from another slice.
