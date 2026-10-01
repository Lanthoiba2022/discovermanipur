# Contributor task list

Hacktoberfest-sized work, found by reading the code. Each task says why it matters, where
to start, and how hard it is:

- **good first issue**: small and self-contained; a good way to learn the codebase.
- **intermediate**: touches several files or needs some Next.js / database knowledge.
- **advanced**: design work across the stack. Discuss the approach on the issue or on
  [Discord](https://discord.gg/hgGfm6UpU) before writing code.

Before starting, find (or open) the matching GitHub issue and ask to be assigned. Read
[CONTRIBUTING.md](../CONTRIBUTING.md) first, especially the auth rules: every protected
page calls `requireAdmin` / `requireHost` itself, Server Actions are public endpoints, and
the user always comes from the session, never from a client-supplied id.

## Contents

- [Persistence: move browser-only data to the database](#persistence-move-browser-only-data-to-the-database)
- [Community-sourced listings](#community-sourced-listings)
- [Content and photos](#content-and-photos)
- [Accessibility](#accessibility)
- [Languages](#languages)
- [Testing and tooling](#testing-and-tooling)
- [Platform and hardening](#platform-and-hardening)
- [Kangla](#kangla)

---

## Persistence: move browser-only data to the database

Today several features store data in `localStorage`, so it is lost when a visitor changes
browser, and admins and hosts cannot see it. The tables already exist in
`src/lib/db/schema.ts`; the call sites are already `async`, so the change is mostly
behind each module. Follow the pattern in `src/lib/auth/profile.ts`: a Server Action that
resolves the user from the session and checks ownership. Keep the browser-only behaviour
when `DATABASE_URL` or Neon Auth is not configured, so a fresh clone still works.

### Save bookings to `public.bookings`
- **Why:** bookings vanish with the browser, and no host or admin ever sees them.
- **Where:** `src/lib/booking/bookings.ts` (browser storage), `src/lib/booking/schemas.ts`,
  `src/components/experiences/booking-panel.tsx`, `src/app/account/bookings/`,
  `bookings` in `src/lib/db/schema.ts`.
- **Difficulty:** advanced. Prices must be recomputed on the server
  (`src/lib/booking/pricing.ts`), never taken from the client.

### Save the wishlist to `public.saved_items`
- **Why:** saved places do not follow the user across devices.
- **Where:** `src/lib/booking/wishlist.ts`, `src/app/account/saved/`, `saved_items` in the schema.
- **Difficulty:** intermediate.

### Save itineraries to `public.saved_itineraries`
- **Why:** same as above, for trip plans from `/plan`.
- **Where:** `src/lib/itineraries/store.ts`, `src/lib/itineraries/mapping.ts`,
  `src/app/account/itineraries/`, `saved_itineraries` in the schema.
- **Difficulty:** intermediate.

### Submit host applications to `public.host_applications`
- **Why:** the host application form shows a reference number but sends nothing
  anywhere. Photos stay in memory and are discarded.
- **Where:** `onSubmit` in `src/components/host/apply-wizard.tsx` (it sets
  `userId: "pending-auth"`), `src/lib/host/application-schema.ts`, `host_applications` in
  the schema.
- **Difficulty:** intermediate (without photo upload); photo storage is a separate,
  advanced task that needs a storage provider decision.

### Wire the admin dashboard and application review to real data
- **Why:** `/admin`, `/admin/bookings` and `/admin/applications` render sample data, and
  approve/reject only changes local state.
- **Where:** `src/lib/host/mock-data.ts` (its header explains the swap),
  `src/app/admin/page.tsx`, `src/app/admin/bookings/page.tsx`,
  `src/app/admin/applications/page.tsx`, `src/components/admin/applications-table.tsx`.
- **Difficulty:** advanced. Approve/reject must be an admin-only Server Action that
  re-checks the role inside the action. Decide with maintainers whether approval also
  grants the `host` role (today only `npm run db:set-role` does that).
- **Depends on:** the bookings and host applications tasks above.

### Persist listing moderation
- **Why:** on `/admin/listings` the feature and activate toggles show a toast but do not
  save.
- **Where:** `src/components/admin/listings-table.tsx`, `src/app/admin/listings/page.tsx`,
  `featured` / `is_active` columns in the schema.
- **Difficulty:** intermediate.

### Wire the host dashboard to the host's own listings and bookings
- **Why:** `/host/dashboard` shows the same sample data to every host.
- **Where:** `src/app/host/dashboard/page.tsx`, `src/lib/host/mock-data.ts`,
  `src/lib/host/types.ts`.
- **Difficulty:** advanced. Listings need an owner column first (a schema change with
  `npm run db:generate`).

## Community-sourced listings

The project's direction is a guide that the public keeps up to date: anyone can suggest a
new place (an attraction, cafe, homestay, craft maker or traditional wear shop), and the
community verifies it.

### Place submissions with community verification
- **Why:** this is how the catalogue grows beyond what maintainers can research.
- **Proposed rules (to refine on the issue):**
  - A signed-in user submits a place with category, district, location, description,
    public sources and photos with their licence (the same fields as the
    *Suggest a new place* issue form, `.github/ISSUE_TEMPLATE/new_place.yml`).
  - The submission is visible to verified users, who can upvote it.
  - If it reaches a minimum number of upvotes from distinct verified users (for example
    10) within 48 hours, it is published.
  - Otherwise it is hidden from public view and held for manual review by an admin.
  - Owners can submit their own business but must say so.
- **Where:** new tables in `src/lib/db/schema.ts`, Server Actions for submit and vote,
  a review queue under `src/app/admin/`, and the data layer in `src/lib/data/`.
- **Difficulty:** advanced. Split it into smaller issues: schema and submission form;
  voting with one vote per user; the 48-hour rule as a scheduled job; the admin queue;
  abuse controls (rate limits, duplicate detection).

### Genuine reviews from verified visitors
- **Why:** `review_count` and ratings exist on listings, and `testimonials` holds curated
  quotes, but there is no way for visitors to leave a review.
- **Where:** `src/lib/db/schema.ts`, `src/components/homestays/rating-summary.tsx`,
  `src/lib/data/catalogue.ts`.
- **Difficulty:** advanced. Needs moderation and a rule for who may review (for example
  only after a booking).

## Content and photos

Content work counts as much as code. See the photo rules in
[CONTRIBUTING.md](../CONTRIBUTING.md#photos-and-attribution).

### Replace illustrative seed listings with researched ones
- **Why:** without a database the app shows the bundled seed. The homestay, eatery and
  transport seed files still contain illustrative businesses and hosts that do not
  exist, while real, sourced records sit in
  `db/research-seed/0008_seed_2026_research.sql`. A fresh clone should show real places.
- **Where:** `src/lib/data/seed/homestays.ts`, `eateries.ts`, `transport.ts`;
  `db/research-seed/0008_seed_2026_research.sql`.
- **Difficulty:** good first issue per vertical (pick a district at a time), intermediate
  if you script the conversion.

### Fill photo gaps and low-resolution covers
- **Why:** many hotspot, eatery, festival and experience covers are about 400 px wide and
  look soft on modern screens; some listings have one photo or none. A few older
  homestay images are generic stock that does not show Manipur.
- **Where:** `images` in `src/lib/data/seed/*.ts`, `public/file-uploads/`,
  `src/lib/data/photo-credits.ts`.
- **Difficulty:** good first issue. Only your own photos or openly licensed ones, each
  credited, and open every image to check it shows the right place.

### Improve alt text on catalogue photos
- **Why:** the accessibility statement lists short or vague alt text as a known gap.
- **Where:** `alt` fields in `src/lib/data/seed/*.ts` and `src/lib/data/photo-credits.ts`.
- **Difficulty:** good first issue. Describe what the photo shows, not what the place is
  famous for.

### Verify and refresh listing facts
- **Why:** timings, fees and transport prices change. Listings should carry a source and
  a recent check.
- **Where:** `entryFee`, `timings`, `howToReach`, `sources`, `verification` in the seed
  files and `src/types/index.ts`.
- **Difficulty:** good first issue, one district or vertical at a time, with sources.

## Accessibility

The site targets WCAG 2.1 AA; `src/app/accessibility/page.tsx` lists the known gaps.

### Keyboard and screen-reader support for the catalogue map
- **Where:** `src/components/map/hotspot-map.tsx`, `src/components/map/map-panel.tsx`.
- **Difficulty:** intermediate.

### Text date entry alongside the calendar
- **Where:** `src/components/booking/stay-date-picker.tsx`.
- **Difficulty:** intermediate.

### A plain summary view for AI itineraries
- **Why:** streamed itineraries are verbose with a screen reader.
- **Where:** `src/components/ai/itinerary-timeline.tsx`, `src/app/plan/plan-client.tsx`.
- **Difficulty:** intermediate.

### Automated accessibility checks
- **Why:** catch regressions on every pull request.
- **Where:** a new CI job next to `.github/workflows/ci.yml` running axe against the built
  site.
- **Difficulty:** intermediate. Adding a dev dependency needs maintainer agreement on the
  issue.

## Languages

### Interface translation: Meiteilon (Meetei Mayek) and Hindi
- **Why:** the interface is English only. Many people in Manipur would rather read
  Meiteilon, and many domestic visitors Hindi. The fonts are already loaded
  (`src/app/fonts.ts`: Noto Sans Meetei Mayek, Noto Serif Devanagari).
- **Where:** start with the shared chrome: `src/lib/nav.ts`,
  `src/components/layout/site-header.tsx`, `src/components/layout/site-footer.tsx`.
- **Difficulty:** advanced to set up (routing and message files, agreed on the issue);
  good first issue afterwards for each page translated. Translations should be checked by
  a fluent speaker; machine translation alone will not be merged.

### Meitei names for more listings
- **Why:** listings can show a `meiteiName` next to the English name, but many do not
  have one.
- **Where:** `meiteiName` in `src/lib/data/seed/hotspots.ts` and `festivals.ts`.
- **Difficulty:** good first issue for fluent speakers.

## Testing and tooling

### Add a unit test setup and first tests
- **Why:** there are no automated tests. Pure functions are a safe place to start.
- **Where:** `src/lib/booking/pricing.ts` (`quoteStay`), filtering and sorting in
  `src/lib/data/index.ts`, `src/lib/auth/email-policy.ts`, the zod schemas in
  `src/lib/booking/schemas.ts` and `src/app/contact/schema.ts`.
- **Difficulty:** good first issue once a runner is agreed (propose one on the issue, for
  example Vitest), then add `npm test` to CI.

### Browser checks for the Kangla 3D map
- **Why:** the map has many interactions (camera fence, toggles, zoom, landmark panel)
  that are easy to break, and there is no automated test for them.
- **Where:** `/explore/kangla`, `src/components/explore/kangla-google-3d.tsx` (it already
  exposes probe hooks for tests). The behaviours to cover are listed under "Manual checks"
  in `docs/kangla-map-explorer.md`.
- **Difficulty:** intermediate. Needs a Google Maps key, so it runs locally, not in CI.

### Smoke-test every route in CI
- **Why:** catch pages that crash with an empty environment.
- **Where:** a script that starts `npm run start` after the build and requests each route
  from `src/app/sitemap.ts`, checking for a 200.
- **Difficulty:** intermediate.

### Pin the Node.js version
- **Why:** CI and contributors should use the same Node version. `package.json` already
  has `"engines": { "node": ">=20.9.0" }`, but there is no `.nvmrc` and CI hard-codes
  Node 24.
- **Where:** add an `.nvmrc`, then point `.github/workflows/ci.yml` at it with
  `node-version-file`.
- **Difficulty:** good first issue.

## Platform and hardening

### Shared rate-limit store
- **Why:** the per-IP limits on the AI concierge, sign-in, the photo proxy and the
  contact form are kept in memory, so each server instance counts separately. A shared
  store makes them hold across instances, which the concierge needs before it is
  switched back on in production.
- **Where:** `src/lib/security/rate-limit.ts` (swap the in-memory map for a shared store
  such as Upstash Redis or Vercel KV, keeping the same interface); callers are in
  `src/app/api/*` and `src/app/contact/actions.ts`.
- **Difficulty:** intermediate.

### Database full-text search
- **Why:** search loads whole tables and filters in memory. The database already has
  `pg_trgm` indexes on names.
- **Where:** `src/lib/data/index.ts` (`globalSearch`), `src/components/search/actions.ts`,
  `drizzle/0000_baseline.sql`.
- **Difficulty:** advanced. Keep the in-memory path as the seed fallback.

### Work offline in the hills
- **Why:** mobile data is patchy in many districts. Saved places and itineraries should
  be readable offline.
- **Where:** a service worker and web app manifest under `src/app/`.
- **Difficulty:** advanced.

## Kangla

### Narration for the remaining landmarks
- **Why:** three of the eight landmarks on `/explore/kangla` have narration
  (guardians, Pakhangba, western gate). The others have none.
- **Where:** `src/lib/immersive/narration.ts`, `src/lib/immersive/kangla-places.ts`,
  `public/audio/kangla/{en,hi,mni}/`, generator scripts `scripts/generate-kangla-audio*.{py,mjs}`.
- **Difficulty:** intermediate. Scripts need review by a fluent speaker and a reliable
  historical source.

### Bring back the landmark studio, or remove it
- **Why:** the Three.js landmark studies are unreachable since `/immersive/kangla-fort`
  started redirecting to the map, but their code and models still ship in the repo.
- **Where:** `src/app/immersive/kangla-fort/page.tsx`, `src/components/immersive/`,
  `public/models/kangla/`; background in [kangla-immersive.md](kangla-immersive.md).
- **Difficulty:** intermediate. Agree on the direction on the issue first.
