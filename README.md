# Yening — Manipur Tourism

A production-grade tourism platform for Manipur, *The Land of Jewels*. Yening brings the
state's hotspots, homestays, eateries, festivals, tours, transport and craft makers into one
catalogue, adds an AI travel concierge that builds day-by-day itineraries, and puts a real
3D map and photo-referenced 3D reconstruction of Kangla Fort in the browser.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Neon (Lakebase Postgres + Neon Auth) with Drizzle ORM,
MapLibre GL and Three.js.

---

## Highlights

**Full travel catalogue.** Seven browsable verticals — hotspots, homestays, eateries,
experiences, tours, transport, festivals and a crafts marketplace — each with index and
detail pages, filtering, search and photo provenance. 236 listings come from a verified
2026 research pass (57 hotspots, 36 homestays, 143 eateries) with sources recorded per row.

**AI travel concierge.** A streaming chat assistant (Vercel AI SDK + Claude) with tool access
to the live catalogue, producing structured, schema-validated itineraries that link back to
real listings. Also available as a standalone planner at `/plan`.

**Kangla 3D map explorer** (`/explore/kangla`). MapTiler vector tiles through MapLibre GL,
with the camera clamped to a ~1.4 × 1.6 km box around the moated enclosure. Building
extrusions are generated from OpenStreetMap footprints and labelled by height provenance —
buildings with no recorded height are shaded differently and disclosed in the legend, so the
map never claims a roof it does not know.

**Kangla immersive experience** (`/immersive/kangla-fort`). Three separately explorable
Three.js landmark studies — the Kangla Sha / Uttra pavilion, the western gateway and
Pakhangba Laishang. Three.js loads only on demand; photographs and narration work fully
without WebGL. The UI discloses that this is an approximate, photo-referenced
reconstruction rather than a scanned digital twin, and links its references.

**Accounts, bookings and hosting.** Neon Auth (email/password, magic links), saved listings, saved
itineraries, a booking flow, a host application and dashboard, and an admin area for
listings, bookings and applications.

**Graceful degradation by design.** The app builds and runs with **zero environment
variables**. Without a database it falls back to bundled seed content and a clearly labelled
local demo session; without an AI key the concierge streams a canned response and a real
sample itinerary, so the interface never appears broken.

---

## Getting started

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Use port 3000 specifically — the Kangla map key is
origin-restricted to it.

### Configuration

All environment variables are optional. Copy the template and fill in what you need:

```bash
cp .env.example .env.local
```

| Variable | Scope | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | **server only** | Neon pooled connection string — app reads and writes |
| `DATABASE_URL_UNPOOLED` | **server only** | Neon direct connection — migrations and seeding |
| `NEON_AUTH_BASE_URL` | **server only** | Neon Auth URL for the branch |
| `NEON_AUTH_COOKIE_SECRET` | **server only** | Signs the session cookie cache (32+ chars) |
| `ANTHROPIC_API_KEY` | **server only** | AI concierge |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical origin for metadata and sitemaps |
| `MAP_TILER_API_KEY` | browser | Kangla map tiles; protected by an origin allowlist |
| `GOOGLE_API_KEY` | browser | Maps Platform key, origin-restricted |

Server-only keys must never be prefixed with `NEXT_PUBLIC_` or imported into a client
component. `/explore/kangla` is prerendered, so a map key change requires a rebuild, not
just a restart.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run db:generate` | Write the next migration from `src/lib/db/schema.ts` |
| `npm run db:migrate` | Apply pending `drizzle/` migrations to Neon |
| `npm run db:studio` | Browse the database in Drizzle Studio |
| `npm run db:seed` | Push seed content to Neon (overwrites matching live rows) |
| `npm run audio:kangla` | Regenerate Kangla narration audio |

Note that catalogue content is read from Neon when configured — editing the seed files
alone does not change a live database until `npm run db:seed` runs.

---

## Project structure

```
src/app/          App Router routes, layouts and API handlers
src/components/   UI components (Radix primitives + Tailwind)
src/lib/ai/       Concierge model config, prompt, tools and itinerary schema
src/lib/data/     Catalogue access and seed content
src/lib/auth/     Neon Auth, profiles and the local demo session fallback
src/lib/db/       Drizzle schema, relations and the server-only database client
src/lib/immersive/  Kangla places, bounds and generated building data
src/lib/maps/     Map loaders and helpers
drizzle/          Drizzle Kit migrations (the live migration history)
db/               Database and auth setup guide; frozen pre-Drizzle SQL
scripts/          Seeding, asset generation and verification scripts
data/research/    2026 research pass: sources, raw notes and photo indexes
docs/             Kangla map and immersive experience documentation
public/           Images, 3D models, audio and video
```

---

## Database

`db/README.md` documents the setup. The schema is `src/lib/db/schema.ts`; Drizzle Kit
generates migrations into `drizzle/` (`npm run db:generate`) and applies them
(`npm run db:migrate`). The app connects as the table owner, so there is no Row
Level Security: visibility and ownership checks live in the queries and Server Actions (see
`db/README.md`).

---

## Further reading

- [`docs/kangla-map-explorer.md`](docs/kangla-map-explorer.md) — how the 3D map is built, what is real data versus assumption, and the automated checks
- [`docs/kangla-immersive.md`](docs/kangla-immersive.md) — the 3D reconstruction, its references and its stated accuracy limits
- [`db/README.md`](db/README.md) — database and auth setup, migration order
- [`data/research/README.md`](data/research/README.md) — the 2026 research pass and its sources

---

## Accuracy and attribution

Listings carry source and verification metadata. Map imagery is attributed to MapTiler and
OpenStreetMap, photographs to their contributors, and the Kangla 3D scenes state plainly
where geometry is interpreted rather than surveyed.
