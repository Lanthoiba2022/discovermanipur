# Yening — Manipur Tourism Platform
## Implementation / Build Plan

**Codename:** Yening (ꯌꯦꯅꯤꯡ — "to explore / to wander")
**Event:** Re-Imagining Manipur Hackathon 2026 · World Tourism Day 2026
**Supersedes:** TripTreat (Vite SPA prototype, ~22k LOC)

---

## 1. Tech stack decision

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + React 19 + TypeScript** | Confirmed the user's instinct. Server Components cut the client bundle that made TripTreat slow; route-level streaming; built-in `next/image` (the single biggest perf win over TripTreat's raw `<img>` hero); file-based routing replaces react-router; API routes host the AI endpoints without a separate Supabase Edge Function deploy. |
| Styling | **Tailwind CSS v4 + CSS custom-property design tokens** | v4's CSS-first config makes a Manipur-specific token palette trivial to theme and dark-mode. |
| Components | **shadcn/ui (Radix)** | Already the TripTreat vocabulary — port cost ~0, accessibility for free. |
| Animation | **Framer Motion (`motion`) + Lenis smooth scroll + GSAP ScrollTrigger** for the landing scroll narrative | Motion for component transitions; ScrollTrigger for the long-scroll story sections. |
| 3D / shaders | **React Three Fiber + drei + `@react-three/postprocessing`**, shader gradient in the hero | R3F is the only sane way to keep 3D inside React's tree and lazy-load it per-route. |
| Data | **Supabase** (Postgres + Auth + Storage + RLS + PostGIS) | Keeps the TripTreat schema lineage; Postgres full-text search removes the hardcoded filtering. |
| Server state | **TanStack Query v5** + Server Components for first paint | |
| Forms | react-hook-form + zod | Already in use. |
| AI | **Anthropic Claude (`claude-sonnet-5`) via Vercel AI SDK v5**, streaming | Replaces the decision-tree chatbot with a real streaming, tool-calling agent. |
| Maps | MapLibre GL + open tiles | No billing key needed for a hackathon demo. |
| Deploy | Vercel | |

**Rejected:** Astro (too much client interactivity), SvelteKit (team familiarity), keeping Vite (loses SSR/image pipeline).

---

## 2. Design direction

**Concept — "Land of Jewels, in layers."** The site unfolds Manipur the way the valley reveals itself: mist, water, hills, weave.

- **Palette (tokens):** `loktak` deep teal `#0B3B3C` · `phumdi` moss `#4A7C59` · `shirui` lily blush `#E8C5C5` · `leirum` dusk violet `#3E3054` · `kangla` gold `#C9A227` · `cream` `#FAF6EC` · ink `#12100E`.
- **Typography:** display *Fraunces* (optical-size variable, soft serif — the woven/organic feel) · body *Geist Sans* · Meitei Mayek accents via *Noto Sans Meetei Mayek* for section eyebrows.
- **Motifs:** the *phumdi* (floating island) as a repeating organic blob mask; *Kangla* dragon linework as section dividers; handloom stripe geometry for grid rhythm.
- **Inspiration mapping:** layered scroll reveal → landing.love travel entries; oversized typographic hero with video mask → awwwards travel winners; card-to-page shared-element morph → designspells; editorial whitespace on content pages → minimal.gallery.
- **Motion rules:** every reveal ≤ 600ms, ease `[0.22,1,0.36,1]`; full `prefers-reduced-motion` fallbacks; nothing blocks LCP.

---

## 3. Feature scope (everything TripTreat had, plus)

**Ported & upgraded:** homestays + details/booking · experiences · eateries + table reservation · tours · transport · hotspots (60+ real spots already researched) · AI itinerary planner · auth + profile · host onboarding + applications · admin dashboard · store · testimonials · about/contact/FAQ/legal.

**New:** streaming AI concierge with tool-calling · real Postgres search + filters · interactive map · multilingual (EN / Meiteilon / Hindi) · accessibility pass (WCAG 2.1 AA) · festival & seasonal calendar · responsible-tourism layer · **AR/VR 3D spot tour (last phase)**.

---

## 4. Build phases

| Phase | Content | Parallel? |
|---|---|---|
| **0 — Foundation** | Next.js scaffold, tokens, fonts, Tailwind v4, shadcn base, data-layer contracts + typed seed data, layout shell | Sequential (owner: lead) |
| **1 — Landing** | Hero (shader + video mask), scroll narrative, featured rails, footer | Agent A |
| **2 — Discovery** | Hotspots, experiences, eateries, tours, transport + filters/search | Agents B, C |
| **3 — Booking & accounts** | Homestays, detail pages, booking flow, auth, profile, bookings | Agent D |
| **4 — AI concierge** | Streaming chat, itinerary generator, tool-calls | Agent E |
| **5 — Host & admin** | Become-a-host, applications, admin dashboard | Agent F |
| **6 — Content & trust** | About, contact, FAQ, legal, responsible tourism | Agent G |
| **7 — Supabase wiring** | Migrations, RLS, seed import, swap data layer from local → DB | Lead (needs credentials) |
| **8 — AR/VR** | R3F 360° / photogrammetry spot tours, WebXR entry | Last, after all of the above |
| **9 — Polish** | Perf budget (LCP <2.0s, CLS <0.05), a11y audit, i18n pass, SEO/OG | Lead |

**Parallelism contract:** each agent owns a disjoint set of route folders and component folders. Shared files (`globals.css`, `package.json`, `lib/`, `components/ui/`) are written in Phase 0 and are **read-only** to agents.

---

## 5. Data layer contract

All content is served through `src/lib/data/*` which exposes async functions (`getHotspots()`, `getHomestays()`, …) returning types from `src/types`. Phase 0 backs these with typed seed modules ported from TripTreat's researched data; Phase 7 swaps the bodies to Supabase queries with **zero call-site changes**. This is what lets Phases 1–6 run in parallel before credentials arrive.

---

## 6. Credentials needed from the user

`NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY` · `ANTHROPIC_API_KEY` (optional: `MAPTILER_KEY`). The build runs on seed data until these land.

---

## 7. Build status — 2026-09-20

Phases 0–6 are **built and verified**. Phase 7 (Supabase) is written and waiting on credentials.
Phase 8 (AR/VR) now has its first prototype at `/immersive/kangla-fort`: three photo-referenced Kangla exterior studies, desktop 3D, reference-photo comparison, and capability-gated WebXR AR/VR. These are approximate reconstructions, not photogrammetry. Physical-device XR verification remains outstanding. See `docs/kangla-immersive.md` for references, implementation details and checks.

### Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npx next build` | clean — 179 static pages |
| `npx eslint .` | 0 errors, 3 warnings (all `react-hooks/incompatible-library` on react-hook-form's `watch()` — inherent to RHF) |
| HTTP sweep, 37 routes | all 200 |
| Unknown slugs | true 404 (see below) |
| Mobile overflow, 33 routes @375px | zero horizontal scroll |
| Hydration, normal + reduced motion | zero console errors |
| Dark mode | verified, incl. re-stepped chart palette |

### Catalogue
54 hotspots (all 16 districts) · 20 homestays · 18 experiences · 16 eateries · 10 tours ·
10 transport options · 12 festivals · 10 testimonials. 200 unique image paths, all verified present
on disk. No duplicate slugs.

### Defects found and fixed during integration

1. **Soft 404s (app-wide, SEO).** Unknown slugs returned HTTP 200 with the 404 body, because every
   detail route ships a `loading.tsx`; the Suspense boundary flushed a 200 before `notFound()` threw.
   Crawlers would have indexed any garbage URL. Fixed with `dynamicParams = false` on all seven
   `[slug]` routes — the catalogue is finite and fully enumerated, so Next now rejects unknown slugs
   at the routing layer. Verified by status code before and after.
2. **Dark-mode chart palette.** The admin chart colours were hardcoded hex validated only against the
   light surface, on the assumption the app was light-only — but the header has a theme toggle.
   Moved to `--chart-1..4` tokens in `globals.css` with a second set of steps for the dark surface.
3. **Hydration mismatch, reduced motion (two causes).** `useReducedMotion()` is null during SSR, so
   branching on it during render desynced server and client: the stat counters rendered `0` vs the
   final value (text mismatch), and `Reveal`/`RevealText`/`LayersNarrative` swapped element structure
   (HTML mismatch). Fixed via a `useMounted()` hook (`src/lib/use-mounted.ts`, `useSyncExternalStore`)
   and by keeping motion components' markup identical in both modes.
4. **Mobile horizontal overflow, 3 routes.** `/festivals` and `/faq` had `overflow-x-auto` rails inside
   grid children lacking `min-w-0`. `/admin/applications` was subtler: the table's `sr-only` `<caption>`
   is absolutely positioned, and with no positioned scroll container its containing block resolved
   further up the tree, escaping the scroller and widening the document to the table's full width.
5. **Deprecated `next/image` `priority`.** Migrated 19 files to `preload`, including the card
   components' own prop names, so the codebase speaks one vocabulary.
6. **Doubled brand in titles.** `/plan`, `/about`, `/host` carried the brand in the page title while
   the root template also appends `· Yening`.

### Integration wiring done by the lead
Concierge widget mounted in the root layout · search combobox wired into the header behind ⌘K ·
`MediaGallery` promoted to `src/components/shared/` · `middleware` → `proxy` (Next 16) confirmed ·
active-route marking added to the nav.

### Known seams, deliberately left
- **Auth is mock-backed.** Single swap point: the body of `getSessionUser()` in `src/lib/host/role.ts`
  for admin/host role, and `src/lib/auth/*` for sessions. `/admin` prerenders static today because the
  mock role is constant; it becomes dynamic automatically once the lookup reads cookies.
- **Contact form does not send.** One marked `TODO(send)` in `src/app/contact/actions.ts`.
- **Bookings, wishlist, host applications** are local/mock with Supabase-shaped async signatures.
- **AI runs without a key**, returning a friendly unconfigured message plus a sample itinerary.

---

## 8. Feature-parity audit vs TripTreat — closed

Prompted by a direct question: *was every TripTreat feature carried over?* A route-by-route and
component-by-component comparison found **two genuine gaps**, both now closed.

| TripTreat | Yening | Status |
|---|---|---|
| `/store` + `OrderDialog` | `/store`, `/store/[slug]` | **Was missing — now built** |
| `planned_tours` + `PlannedTours` + chatbot "Save" | `/account/itineraries` + save from the concierge | **Was missing — now built** |
| `VideoSection` | hero video + the layered scroll narrative | Covered differently, by design |
| all other 21 routes and every component-level feature | ported and upgraded | Covered |

### The store is positioned deliberately
TripTreat's order dialog went nowhere. Rather than fake a checkout, `/store` states plainly that
**Yening takes no payment and no commission**: each listing carries the maker's own contact details
and an enquiry goes straight to the artisan. This is honest about what the prototype can do, keeps
money and relationship local, and serves the Heritage & Culture and Sustainable Tourism themes.
Seeded contact numbers are explicit placeholders and are labelled as such in the UI.

Crafts are a first-class catalogue entity — `Craft` in `src/types`, served through `@/lib/data`
(`getCrafts` / `getCraftBySlug` / `getCraftCategories`), included in global search, the header and
footer nav, the sitemap, `supabase/migrations/0003_crafts_and_itineraries.sql` (with RLS) and the
seed script. Not a hardcoded array.

### Saved itineraries
`src/lib/itineraries/store.ts` mirrors the `src/lib/auth/session-store.ts` pattern
(`useSyncExternalStore` + guarded localStorage), with Supabase-shaped async signatures. The DB table
is a superset of the prototype's `planned_tours`, which stored the plan as plain text; here `days` is
structured jsonb, so stops keep their slugs and link back into the catalogue.

### One reported defect that did not reproduce
An agent reported that `/auth` tabs were unclickable at 375px, blocked by an image overlay. Checked
against a clean build: the panel is `display: none` with zero width at that breakpoint, hit-testing
returns the tab itself, and clicking switches the form correctly. The agent had also reported `.next`
contention between parallel agents producing 404'd CSS chunks — with CSS missing, `hidden lg:block`
does not apply and the image *would* cover the tabs. Correct symptom, wrong cause. No fix needed.

### Verification after the additions
`tsc` clean · `next build` clean · ESLint 0 errors / 3 inherent RHF warnings · new routes 200 ·
`/store/<unknown>` a true 404 · sitemap 154 URLs incl. 6 crafts · 20 routes checked at 375px with
zero overflow and exactly one `h1` each.

**Totals:** 40 routes · 111 components · ~31k LOC.

---

## 9. Phase 8 — AR/VR: Kangla (finished)

Started in a separate Codex session and left incomplete mid-integration. Picked up from that
session's transcript (`~/.codex/sessions/2026/09/20/…`) and the work already on disk, and finished.

### What was already there
Three Blender-built landmarks — Kangla Sha (the paired guardians before the Uttra), the western
gateway, and Pakhangba Laishang — authored by `assets/blender/kangla/build_kangla.py` with scanned
brick/plaster/ground textures, exported to GLB, plus the full web viewer: model/photograph compare,
orbit + daylight controls, narrated field notes with speech synthesis, landmark progress, and
**WebXR for both VR and AR** (AR with hit-test reticle placement, and an honest fallback message when
the device or HTTPS context cannot support it). Already linked from the landing page and the Kangla
hotspot page, and already in the sitemap.

### What was unfinished, and what I did
The compression pass had completed for one asset and stopped. `guardians.glb` was optimized;
`western-gate.glb` and `pakhangba.glb` were still at full export size — a ~34 MB payload.

- Reinstalled the glTF toolchain **outside the repo** via the script's own `GLTF_TOOLS_DIR` hook, so
  build-only tools do not enter `package.json`.
- Ran `assets/blender/kangla/optimize.mjs` over the two remaining assets (dedup, prune, WebP texture
  compression at 1024², Meshopt geometry).

| Asset | Exported | Shipped | Saving |
|---|---|---|---|
| guardians | 20.7 MB | 5.8 MB | 72% |
| western-gate | 17.9 MB | 5.3 MB | 70% |
| pakhangba | 11.6 MB | 3.2 MB | 72% |
| **total (incl. 1.9 MB HDR)** | **50 MB** | **16.3 MB** | **~71%** |

Landmarks load individually, so a visitor downloads ~3–6 MB plus the environment map, and only after
pressing "Enter 3D experience" — nothing heavy loads on arrival.

### Verified
All three scenes re-checked in a browser against a production build **after** re-encoding — geometry,
textures, materials and lighting intact in each, "3 of 3 discovered" progress working. Route 200,
all four asset URLs 200, `tsc` clean, ESLint 0 errors, `next build` clean, and no horizontal overflow
at 375px with exactly one `h1`.

Also added `*.blend1` to `.gitignore` — Blender auto-backups, 39 MB of pure duplication.

### Checked, not a defect
The fixed header appears to overlap the page heading in a screenshot taken after clicking into the
experience. It does not: the click scrolls the page ~160 px. At rest the `h1` sits at 212 px, below
the header, and the route already carries the standard `pt-28 md:pt-32`.

### Honest note on realism
The feedback that drove the Blender rebuild was that the first attempt looked cartoonish. Materials,
masonry, roofing and planting now read convincingly. The **Kangla Sha sculptures remain the weakest
element** — the forms are approximate rather than a faithful likeness of the real guardians. Closing
that gap properly needs either photogrammetry from on-site photography or a sculpt against tighter
reference than was available here. The page is labelled a "reconstruction" throughout, which is the
honest framing for what it is.
