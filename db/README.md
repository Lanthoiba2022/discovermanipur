# Yening — database and auth (Neon)

The app runs entirely on local seed data until these credentials exist. Nothing
below is required to build or demo the site — `next build` succeeds with zero
environment variables set, every page falls back to the bundled seed content,
and auth falls back to a labelled local demo session.

Database: **Lakebase Postgres on Neon**. Identity: **Neon Auth** (Managed
Better Auth), whose users and sessions live in the same database under the
`neon_auth` schema.

## 1. Credentials
Put these in `.env.local` (see `.env.example`), and in the Vercel project for
every environment:

```
DATABASE_URL=...            # pooled (-pooler host) — app traffic
DATABASE_URL_UNPOOLED=...   # direct — migrations and seeding
NEON_AUTH_BASE_URL=...      # Console → Auth → Configuration
NEON_AUTH_COOKIE_SECRET=... # openssl rand -base64 32
```

All four are server-only. `neon env pull` writes the first three.

## 2. Schema and migrations (Drizzle)
The schema is TypeScript: **`src/lib/db/schema.ts` is the source of truth**,
and Drizzle Kit (`drizzle.config.ts`) owns the migrations in `drizzle/`.

```
npm run db:generate   # after editing schema.ts: writes the next drizzle/NNNN_*.sql
npm run db:migrate    # apply pending drizzle/ migrations (direct connection)
npm run db:studio     # browse the data
```

Review every generated SQL file before applying it, and run it on a Neon
branch of production first. Drizzle does not model functions, triggers or
extensions; for those (or for a data change) write a custom migration with
`npx drizzle-kit generate --custom --name <what>`.

- `drizzle/0000_baseline.sql` — the whole schema as of the move to Drizzle,
  generated from `schema.ts` plus the hand-added `pg_trgm`/`pgcrypto`
  extensions, `touch_updated_at()` function and its 12 triggers. Checked by
  building an empty database from it and diffing the catalog against
  production: columns, constraints, indexes, triggers and enums identical.
  Production already had this schema, so the baseline is recorded there as
  applied in `drizzle.__drizzle_migrations` rather than run.
- `profiles.id` references `neon_auth."user"(id)`, so Neon Auth must be
  enabled on a branch before the baseline can run. `neon_auth.user` is
  declared in `src/lib/db/neon-auth.ts` for the foreign key only; it is kept
  out of `schema.ts`'s exports so Drizzle Kit never tries to manage it.
- `db/migrations/` is **frozen history**: the hand-written SQL (0001–0011)
  that built production, recorded in the legacy `public.schema_migrations`
  table. Don't edit or add to it. The gaps (0002, 0004) are the Supabase-only
  RLS and grant files removed in the move to Neon; 0008–0011 carry the 2026
  research data, which no Drizzle migration repeats.

For a new environment, prefer a **Neon branch** of production over a fresh
database: it arrives with the schema, the live rows and its own isolated Auth.

### Ordering: 0007 onwards
`sort_weight` decides which cohort leads every listing — 100 for the 2026
research rows, 0 for everything that came before. `sortRows` in
`src/lib/data/index.ts` orders `sortWeight desc, featured desc`, and an explicit
user sort (price, rating) overrides the cohort entirely. See
`data/research/SEEDING.md`.

### Photos: `photo_refs` vs `images`
`images` holds files we host and may cache. `photo_refs` holds Google Places
references, which are licensed for **display only** — the image bytes must not
be stored, so `/api/place-photo` resolves them per request and keeps
`GOOGLE_API_KEY` server-side. The photographer attribution that ships with each
ref has to be rendered wherever the photo appears. Use `src/lib/data/photos.ts`
rather than reading either column directly.

## 3. Seed the catalogue and content
`npm run db:seed` pushes `src/lib/data/seed/*` plus the FAQ, photo-credit and
immersive modules into the database through Drizzle (run by `tsx`), so every
seed row is type-checked against its table. It upserts on a natural key, so
re-running reconciles rather than duplicating — **and overwrites any live edit
to a matching row**. The live rows were copied from Supabase and differ from
the seed files; do not run this against production to "refresh" it.

## 4. How the app reads it
- `src/lib/db/index.ts` — `getDb()`: a Drizzle instance over one server-only
  `pg` pool on the pooled URL, registered with Vercel's `attachDatabasePool`.
  Returns `null` when unconfigured.
- `src/lib/data/catalogue.ts` — catalogue. Whole-table Drizzle selects; each
  row mapper gets the table's inferred row type. The filter/sort/search logic
  runs in memory in `index.ts`.
- `src/lib/data/content.ts` — editorial content. FAQs use Drizzle's relational
  query (`db.query.faq_groups.findMany({ with: { faq_items } })`, relations in
  `src/lib/db/relations.ts`).
- Both fall back to the seed modules when the database is unconfigured *or* a
  query fails. Content should go stale before it goes blank.
- node-postgres does not go through Next's patched `fetch`, so these reads are
  not captured by the build's fetch cache, and catalogue pages stay statically
  generated because nothing here reads cookies.

### What is deliberately NOT in the database
Structure, as opposed to content:

- `src/lib/nav.ts` — mirrors the route tree
- `CATEGORY_LABELS`, `SEASON_LABELS`, `MONTHS` in `components/places/taxonomy.ts`
  — keyed off TypeScript union types, so a row could never add a member
- the filter definitions — bound to URL search params
- `LandmarkId` and the Kangla camera/target values consumed by
  `kangla-canvas.tsx` — bound to the shipped 3D assets

Icons are stored as lucide-react *names*; `src/lib/icons.ts` maps them back to
components. A component reference cannot survive a round trip through jsonb, so
content chooses from a fixed icon vocabulary.

## Auth
- `src/lib/auth/server.ts` — `createNeonAuth`; `src/app/api/auth/[...path]` is
  the same-origin proxy the browser client talks to.
- `src/proxy.ts` — Neon's middleware on `/account/*` (server-side guard and
  session refresh) and `/auth/callback` (completes the magic-link return trip).
- `src/lib/auth/profile.ts` — Server Actions that read and write
  `public.profiles` for the session's user only. The row is created on first
  read; there is no trigger on `neon_auth`, which Neon manages.
- Magic Link is a Neon Auth plugin that is **off by default** per branch.
  Enable it in Console → Auth → Plugins, and use custom SMTP in production
  (the shared sender is for development).
- Every origin the app is served from must be a trusted domain in Neon Auth
  (`neon neon-auth domain add https://…`). Localhost is allowed by default.

## Security notes
- There is no Row Level Security. The app connects as the table owner, so every
  rule RLS used to enforce is now code:
  - public catalogue reads filter `is_active` (homestays, crafts) and
    `approved` (testimonials) — see `catalogue.ts`;
  - user-owned writes resolve the user from the session cookie inside a Server
    Action and never trust an id from the client — see `profile.ts`;
  - nothing lets a user set their own `profiles.role`.
  Bookings, host applications, saved items and itineraries are still
  browser-local; wiring them to their tables must follow the same pattern.
- `DATABASE_URL*` carry the owner password. Never prefix them with
  `NEXT_PUBLIC_` or import `@/lib/db` into a client component.
