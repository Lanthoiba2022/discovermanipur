# Seeding the 2026 research findings

The research rows reach the database as plain SQL in `db/research-seed/`. Nothing
existing is modified or deleted. `db/README.md` has the commands to load them.

| File | What |
|---|---|
| `db/research-seed/0008_seed_2026_research.sql` | 236 rows: 57 hotspots, 36 homestays, 143 eateries. Generated; don't hand-edit. |
| `db/research-seed/0009_backfill_photos_and_promote.sql` | Photo refs for 28 pre-existing hotspots; promotes the 2 slugs 0008 skipped as duplicates. |
| `db/research-seed/0010_backfill_distances.sql` | Straight-line `distance_km` from Imphal for research rows inserted with 0. |
| `db/research-seed/0011_ango_ching_stand_in_photo.sql` | A stand-in photo for the one place with none. |

The columns these rows use (`sort_weight`, `photo_refs`, `verification`, `sources`)
are part of the Drizzle schema in `src/lib/db/schema.ts`.

Regenerate 0008 after changing the research JSON:

```bash
python3 data/research/scripts/build_seed_sql.py
```

## Ordering — new findings first

`sort_weight` is an integer cohort. Higher sorts first, ahead of `featured`.

- **100** — the 2026 research rows, inserted by 0008
- **0** — everything already in the table, via the column default

`sortRows` in `src/lib/data/index.ts` orders `sortWeight desc, featured desc`.
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
not touch it. Re-running the whole file is a no-op.

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

## Before publishing a row

Nothing here is `phone-verified`. The `verification` column records how well
attested each row is — `official`, `corroborated`, `single-source`. Only a human
who actually rang the business may set `phone-verified`; no importer should.

Read `data/research/README.md` first. In particular: get host consent before
publishing personal mobile numbers, and re-check the eateries — the Imphal F&B
scene turned over heavily after 2023.
