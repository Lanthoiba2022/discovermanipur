# Seeding the 2026 research findings

Two migrations. Nothing existing is modified or deleted.

| File | What |
|---|---|
| `db/migrations/0007_sort_weight_and_photo_refs.sql` | Adds `sort_weight`, `photo_refs`, `verification`, `sources`. All additive with defaults that reproduce today's behaviour. |
| `db/migrations/0008_seed_2026_research.sql` | 236 rows — 57 hotspots, 36 homestays, 143 eateries. Generated; don't hand-edit. |
| `db/migrations/0009_backfill_photos_and_promote.sql` | Photo refs for 28 pre-existing hotspots; promotes the 2 slugs 0008 skipped as duplicates. |

## Applied

All three ran against project `rxljucilcqzbutbvheqn` on 2026-09-23.

| Table | Before | After | 2026 cohort | Original, untouched |
|---|---|---|---|---|
| hotspots | 54 | 109 | 57 | 52 |
| homestays | 20 | 56 | 36 | 20 |
| eateries | 16 | 159 | 143 | 16 |

Verified through the anon key, not just the admin connection — `sort_weight`,
`photo_refs` and `verification` all read back through PostgREST, so there is no
grant or RLS gap.

Apply:

```bash
# Already applied to production (these files are frozen pre-Drizzle history).
# To apply REGENERATED research data now, wrap it in a Drizzle custom migration:
npx drizzle-kit generate --custom --name research_refresh   # then paste the SQL in
npm run db:migrate
```

Regenerate 0008 after changing the research JSON:

```bash
python3 data/research/scripts/build_seed_sql.py
```

## Ordering — new findings first

`sort_weight` is an integer cohort. Higher sorts first, ahead of `featured`.

- **100** — the 2026 research rows, inserted by 0008
- **0** — everything already in the table, via the column default

`sortRows` in `src/lib/data/index.ts` now orders `sortWeight desc, featured desc`.
Rows from the bundled seed modules have no weight, and `?? 0` puts them in the same
cohort as the old database rows — so the database path and the seed-fallback path
order identically.

An explicit user sort (price, rating) overrides the cohort completely. Someone who
asked for "cheapest first" means it; silently pinning one cohort on top would just
read as a broken sort.

It's an integer rather than an `is_new` boolean because cohorts accumulate — a
third pass can sit at 200 without another migration.

## Why re-running is safe

Every statement is `insert ... on conflict (slug) do nothing`. An existing slug is
left exactly as it is. If the original seed already holds `loktak-lake`, 0008 will
not touch it. Re-running the whole migration is a no-op.

## Photos

`photo_refs` holds Google Places references, not image bytes — storing the bytes
would breach the Maps terms. `/api/place-photo?ref=...` resolves one at request
time and redirects to the signed URL, keeping `GOOGLE_API_KEY` server-side.

Render through `src/lib/data/photos.ts`:

```ts
import { leadPhoto, creditLine } from "@/lib/data/photos";

const photo = leadPhoto(hotspot, hotspot.name);
// photo.src -> /api/place-photo?ref=...
// creditLine(photo) -> "Photo: Aswin Rai / Google Maps"
```

**`creditLine` must be rendered wherever a Places photo is.** That is a licence
condition, not a courtesy. `resolvePhotos` puts our own `images` first, so a
listing with self-hosted photography never pays the API cost or shows the overlay.

Without `GOOGLE_API_KEY` the route 404s and cards fall back to the placeholder —
the site still runs on a machine with no Google credentials.

## What was deliberately left out

12 records were skipped rather than defaulted into the database — see
`seed-skipped.json`:

- **10 with no coordinates.** Purul, Kisha Khou, Ango Ching, Zeiladzang and others
  have no reliable Maps pin. `lat`/`lng` are NOT NULL and a wrong pin is worse than
  no row, so they wait for a real coordinate.
- **2 low-confidence matches.** The retry pass resolved "Zeiladzang Village" to
  *Zeilad Lake* and "Kaihlam Caves" to *Khangkhui Mangsor Cave* — different places
  in different districts. The generator refuses `match_confidence: "low"` for
  coordinates for exactly this reason.

District was resolved from locality first, then PIN prefix, then free text. The PIN
table is short on purpose: a wrong district is a wrong filter, a wrong map cluster
and a wrong "near you", so anything ambiguous was skipped instead of guessed.

## Before this is public

Nothing here is `phone-verified`. The `verification` column records how well
attested each row is — `official`, `corroborated`, `single-source`. Only a human
who actually rang the business may set `phone-verified`; no importer should.

Read `data/research/README.md` first. In particular: get host consent before
publishing personal mobile numbers, and re-check the eateries — the Imphal F&B
scene turned over heavily after 2023.

## Known build issue: Turbopack + next/font on a cold cache

`next build` (Turbopack, the Next 16 default) fails if `.next` has been deleted:

```
Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'
next/font/google queries have exactly one entry
```

It is not a code problem. Fonts are reachable, `npm install` does not fix it, and
the same source builds cleanly with:

```bash
next build --webpack
```

The failure is masked while `.next` holds a warm font cache, so it only appears
on a clean checkout or a CI runner — which is exactly where it matters. Either
pin the build to `--webpack` in `package.json` or keep a warm cache in CI until
the upstream Turbopack font bug is fixed.
