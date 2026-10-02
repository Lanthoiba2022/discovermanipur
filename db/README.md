# Database and auth (Neon + Drizzle)

Database: **Postgres on Neon**. Identity: **Neon Auth** (Managed Better Auth),
whose users and sessions live in the same database under the `neon_auth`
schema. Schema and migrations: **Drizzle**.

None of this is needed to build or run the site locally. `next build` succeeds
with no environment variables set: every page falls back to the bundled seed
content, and auth falls back to browser-only local accounts. Production builds
disable sign-in when Neon Auth is missing.

## 1. Credentials
Put these in `.env.local` (see `.env.example`), and in your host's environment
settings for each deployment:

```
DATABASE_URL=...            # pooled (-pooler host): app, migrations, seeding
NEON_AUTH_BASE_URL=...      # Console → Auth → Configuration
NEON_AUTH_COOKIE_SECRET=... # openssl rand -base64 32
```

All three are server-only.

## 2. A new database, from scratch

1. Create a Neon project (or a branch) and **enable Neon Auth on it first**.
   `profiles.id` references `neon_auth."user"(id)`, so the schema cannot be
   created until the `neon_auth` schema exists.
2. Set the credentials above.
3. Create the schema and load the seed content:
   ```
   npm run db:migrate    # apply drizzle/ migrations
   npm run db:seed       # push src/lib/data/seed/* and the content modules
   ```
4. Optional: load the 2026 research catalogue (about 240 verified hotspots,
   homestays and eateries). It must run after
   `db:seed`, because 0009 backfills rows the seed creates:
   ```
   for f in db/research-seed/*.sql; do
     psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
   done
   ```
   Every file is idempotent (`on conflict do nothing`, or updates guarded so
   they never overwrite later edits), so re-running is safe.
5. Sign in once on the site, then make yourself an admin:
   ```
   npm run db:set-role -- you@example.com admin
   ```

## 3. Schema and migrations (Drizzle)
The schema is TypeScript: **`src/lib/db/schema.ts` is the source of truth**,
and Drizzle Kit (`drizzle.config.ts`) owns the migrations in `drizzle/`.

```
npm run db:generate   # after editing schema.ts: writes the next drizzle/NNNN_*.sql
npm run db:migrate    # apply pending drizzle/ migrations
npm run db:studio     # browse the data
```

Review every generated SQL file before applying it, and run it on a Neon
branch first. Drizzle does not model functions, triggers or extensions; for
those (or for a data change) write a custom migration with
`npx drizzle-kit generate --custom --name <what>`. Never edit a migration that
has already been applied anywhere; add a new one.

- `drizzle/0000_baseline.sql` is the whole schema: the tables generated from
  `schema.ts`, plus the hand-added `pg_trgm`/`pgcrypto` extensions,
  `touch_updated_at()` function and its triggers. It contains no data.
- `neon_auth.user` is declared in `src/lib/db/neon-auth.ts` for the foreign key
  only. It is kept out of `schema.ts`'s exports so Drizzle Kit never tries to
  manage a schema that belongs to Neon.
- `drizzle.config.ts` filters out the `schema_migrations` table, a ledger left
  in older databases by the SQL runner used before Drizzle.

### `db/research-seed/`
Data, not schema. Nothing applies these files automatically.

| File | What |
|---|---|
| `0008_seed_2026_research.sql` | The 2026 research rows (`sort_weight = 100`). Generated from the maintainers' research data (not in the repository); do not edit by hand. |
| `0009_backfill_photos_and_promote.sql` | Google Places photo refs for seed hotspots, and two slugs 0008 skipped as duplicates. |
| `0010_backfill_distances.sql` | Haversine `distance_km` for research rows inserted with 0. |
| `0011_ango_ching_stand_in_photo.sql` | A district-appropriate stand-in photo for the one place with none. |

### Ordering
`sort_weight` decides which cohort leads every listing: 100 for the 2026
research rows, 0 for everything else. `sortRows` in `src/lib/data/index.ts`
orders `sortWeight desc, featured desc`, and an explicit user sort (price,
rating) overrides the cohort entirely.

### Photos: `photo_refs` vs `images`
`images` holds files we host and may cache. `photo_refs` holds Google Places
references, which are licensed for **display only**: the image bytes must not
be stored, so `/api/place-photo` resolves them per request and keeps
`GOOGLE_API_KEY` server-side. The photographer attribution that ships with each
ref has to be rendered wherever the photo appears. Use `src/lib/data/photos.ts`
rather than reading either column directly.

## 4. Seeding
`npm run db:seed` pushes `src/lib/data/seed/*` plus the FAQ, photo-credit and
immersive modules into the database through Drizzle (run by `tsx`), so every
seed row is type-checked against its table. It upserts on a natural key, so
re-running reconciles rather than duplicating, **and overwrites any live edit
to a matching row**. Production content has been edited since it was seeded
and differs from the seed files, so never run this against production to
"refresh" it.

## 5. How the app reads it
- `src/lib/db/index.ts`: `getDb()`, a Drizzle instance over one server-only
  `pg` pool on the pooled URL, registered with Vercel's `attachDatabasePool`.
  Returns `null` when unconfigured.
- `src/lib/data/catalogue.ts`: the catalogue. Whole-table Drizzle selects; each
  row mapper gets the table's inferred row type. The filter/sort/search logic
  runs in memory in `index.ts`.
- `src/lib/data/content.ts`: editorial content. FAQs use Drizzle's relational
  query (`db.query.faq_groups.findMany({ with: { faq_items } })`, relations in
  `src/lib/db/relations.ts`).
- Both fall back to the seed modules when the database is unconfigured *or* a
  query fails. Content should go stale before it goes blank.
- Both go through `sharedRead` in `src/lib/data/cache.ts`, Next's data cache,
  keyed by deployment. A build or a running deployment reads each table once,
  not once per page or per visit. An edit made in the app (admin moderation,
  a host pausing a listing) clears it with `updateTag`. **An edit made outside
  the app (Neon console, `db:seed`) shows after the next deploy.** Any new code
  that writes a catalogue table must call `updateTag(CATALOGUE_TAG)`.
- Catalogue pages stay statically generated because nothing here reads
  cookies and the cache has no time-based revalidate.

### What is deliberately NOT in the database
Structure, as opposed to content:

- `src/lib/nav.ts`: mirrors the route tree
- `CATEGORY_LABELS`, `SEASON_LABELS`, `MONTHS` in `components/places/taxonomy.ts`:
  keyed off TypeScript union types, so a row could never add a member
- the filter definitions: bound to URL search params
- `LandmarkId` and the Kangla camera/target values consumed by
  `kangla-canvas.tsx`: bound to the shipped 3D assets

Icons are stored as lucide-react *names*; `src/lib/icons.ts` maps them back to
components. A component reference cannot survive a round trip through jsonb, so
content chooses from a fixed icon vocabulary.

## Auth
Email + password only, `@gmail.com` addresses only, email verified with a
6-digit code delivered through Brevo.

- `src/lib/auth/server.ts`: `createNeonAuth`; `src/app/api/auth/[...path]` is
  the same-origin proxy the browser client talks to.
- `src/proxy.ts`: Neon's middleware on `/account/*` (server-side guard and
  session refresh).
- `src/lib/auth/profile.ts`: Server Actions that read and write
  `public.profiles` for the session's user only. The row is created on first
  read; there is no trigger on `neon_auth`, which Neon manages.
- `src/app/api/webhooks/neon-auth/route.ts`: the Neon Auth webhook. It
  verifies Neon's Ed25519 signature, then:
  - `user.before_create`: refuses any non-`@gmail.com` signup
    (`src/lib/auth/email-policy.ts`, shared with the form). This is the real
    gate: it runs inside Neon Auth, so it also stops signups sent straight to
    the Neon Auth URL. It is **fail-closed**: if the endpoint is down, every
    signup fails.
  - `send.otp`: emails the code through Brevo (`src/lib/email/brevo.ts`).
    Subscribing to it switches off Neon's own email for codes.
- `@neondatabase/auth` THROWS on any failed request and renames Better Auth's
  error codes (`EMAIL_NOT_VERIFIED` → `email_not_confirmed`). Every client
  call in `src/lib/auth/actions.ts` goes through `attempt()` for that reason;
  keep new calls on it.

### Turning it on (order matters)
1. Deploy the code with `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` set. The
   sender must be verified in Brevo (Senders & Domains).
2. Webhooks: Console → Auth → Configuration → Webhooks, or:
   `neon neon-auth config webhook update --enabled --url https://<site>/api/webhooks/neon-auth --enabled-events user.before_create,send.otp --timeout 5`
3. Require verification: Console → Auth → Email & password → "Verify at
   sign-up", method **code**, or:
   `neon neon-auth config email-password update --enabled --require-email-verification`
   The app requests the code itself after sign-up, so leave "send verification
   email on sign-up" off, or users get two codes.
4. Add every site origin as a trusted domain (Console → Auth → Domains).
   Localhost is allowed.

Doing 2 before 1 breaks every signup (fail-closed), and Neon stops emailing
codes the moment `send.otp` is subscribed. The webhook URL must be public
HTTPS (Neon rejects localhost), so local development against a branch with
webhooks on needs a tunnel (ngrok), or a Neon branch without them.

## Security notes
- The app connects as the table owner and the database has no row-level
  security, so every access rule lives in code:
  - public catalogue reads filter `is_active` (homestays, crafts) and
    `approved` (testimonials); see `catalogue.ts`;
  - user-owned writes resolve the user from the session cookie inside a Server
    Action and never trust an id from the client; see `profile.ts`;
  - nothing lets a user set their own `profiles.role`; only
    `npm run db:set-role` changes it.
  Bookings, saved items, itineraries and community places all follow this
  pattern; new user-owned tables must too.
- `DATABASE_URL` carries the owner password. Never prefix it with
  `NEXT_PUBLIC_` or import `@/lib/db` into a client component.
