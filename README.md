# Discover Manipur

[![CI](https://github.com/Lanthoiba2022/Manipur-Tourism-2026/actions/workflows/ci.yml/badge.svg)](https://github.com/Lanthoiba2022/Manipur-Tourism-2026/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Hacktoberfest](https://img.shields.io/badge/Hacktoberfest-2026-orange.svg)](CONTRIBUTING.md#hacktoberfest)
[![Discord](https://img.shields.io/badge/chat-Discord-5865F2.svg)](https://discord.gg/hgGfm6UpU)

An open-source, community-built guide to Manipur, *the land of jewels*. It brings the
state's places, homestays, eateries, experiences, tours, transport, festivals and craft
makers into one catalogue that anyone can browse, correct and add to.

It is for two kinds of people:

- **Visitors** planning a trip, who need honest, sourced information about where to go,
  how to get there and what it costs.
- **People who live in Manipur**, discovering corners of their own state and adding the
  places they know.

The codebase is called *Yening* internally (package name `yening`). The site is free to
use and has no paid tier.

> **Not an official government service.** Discover Manipur is an independent community
> project. It is not run by, or speaking for, the Government of Manipur or its Department
> of Tourism. Always confirm permits, timings and fees with the official source before you
> travel.

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Optional services](#optional-services)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Data and content](#data-and-content)
- [Contributing and Hacktoberfest](#contributing-and-hacktoberfest)
- [Community](#community)
- [Security](#security)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Features

| Route | What it is |
| --- | --- |
| `/` | Home: featured places, seasons, crafts and festivals |
| `/hotspots`, `/hotspots/[slug]` | Places to visit across the 16 districts, with timings, fees, how to reach, accessibility notes and sources |
| `/homestays`, `/eateries`, `/experiences`, `/tours`, `/transport`, `/festivals` | The other catalogue verticals, each with an index (filters, sorting) and a detail page |
| `/store`, `/store/[slug]` | Handloom and craft makers |
| `/search` | Search across the whole catalogue |
| `/plan` | Trip planner. The AI concierge is switched off by default; the page then shows a sample conversation built from the real catalogue |
| `/explore/kangla` | Kangla Fort in a tilted 3D satellite view (Google Maps 3D), with the fort's landmarks pinned and narration for some of them. See [docs/kangla-map-explorer.md](docs/kangla-map-explorer.md) |
| `/account/*` | Profile, saved listings, bookings and saved itineraries |
| `/host`, `/host/apply`, `/host/guidelines` | Information for homestay owners, eateries and guides, and the host application form |
| `/host/dashboard` | Host dashboard (host or admin role) |
| `/admin/*` | Listings, bookings and host applications (admin role) |
| `/faq`, `/about`, `/contact`, `/responsible-travel`, `/accessibility`, `/privacy`, `/terms` | Editorial and policy pages |

What is still incomplete, and open for contributors, is listed in
[docs/GOOD_FIRST_ISSUES.md](docs/GOOD_FIRST_ISSUES.md). In short: bookings, saved items,
itineraries and host applications are stored in the browser only, and the admin and host
dashboards show sample data.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions), React 19, TypeScript (strict)
- Tailwind CSS v4, Radix UI primitives, Framer Motion, GSAP, Lenis
- [Neon](https://neon.tech) Postgres with [Drizzle ORM](https://orm.drizzle.team), and Neon Auth for accounts
- Vercel AI SDK for the concierge (Google Gemini or Anthropic Claude)
- Google Maps JavaScript API (3D) for the Kangla map; Three.js for the Kangla landmark models
- Brevo for transactional email (sign-up verification codes)

## Quick start

You need **Node.js 20.9 or newer** (Next.js 16's minimum) and npm. No accounts, keys or
database are required.

```bash
git clone https://github.com/Lanthoiba2022/Manipur-Tourism-2026.git
cd Manipur-Tourism-2026
npm ci
npm run dev
```

Open <http://localhost:3000>.

With no environment variables set, the app still builds and runs:

- The catalogue is read from the seed data bundled in `src/lib/data/seed/`.
- In development, sign-in uses a local session that lives only in your browser, so you
  can try accounts, saved items and bookings. A production build without auth
  configured switches sign-in off instead. The admin and host dashboards check roles on
  the server, so they need real auth (Neon) and a role set with `db:set-role`.
- The AI concierge shows a recorded sample instead of answering live.
- The Kangla map asks for a `GOOGLE_API_KEY`; everything else on that page still works.

## Optional services

Copy the template and fill in only what you need. Every variable is optional, and
[.env.example](.env.example) explains each one.

```bash
cp .env.example .env.local
```

| Variable | Scope | What it unlocks |
| --- | --- | --- |
| `DATABASE_URL` | server | Neon Postgres (pooled URL). The catalogue is read from the database instead of the seed files; needed for `db:*` scripts |
| `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` | server | Real accounts through Neon Auth. The secret must be 32+ characters (`openssl rand -base64 32`) |
| `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | server | Sends sign-up verification codes |
| `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` | server | A model for the AI concierge |
| `AI_CHAT_ENABLED` | server | Set to `true` (with a model key) to turn the live concierge on |
| `GEMINI_MODEL` | server | Override the Gemini model (default `gemini-2.5-flash`) |
| `GOOGLE_API_KEY` | browser | Maps JavaScript API and Map Tiles API for `/explore/kangla`. Sent to the browser, so restrict it by HTTP referrer and to those two APIs |
| `GOOGLE_PLACES_API_KEY` | server | Places API (New) for listing photos via `/api/place-photo`. Falls back to `GOOGLE_API_KEY`; a separate key is safer |
| `CONTACT_INBOX_EMAIL` | server | Delivers `/contact` messages through Brevo (needs the Brevo variables too) |

Rules that matter:

- Server-only values must never get a `NEXT_PUBLIC_` prefix or be imported into a client
  component.
- Keep the Maps key separate from your Gemini key. A Maps key restricted to Maps APIs will
  not work for Gemini.
- `/explore/kangla` is prerendered, so changing the Maps key needs a rebuild. The key is
  referrer-restricted, so run the dev server on the port your key allows (3000 by default).

Full database and auth setup, including the Neon Auth webhook and the order to switch
things on, is in [db/README.md](db/README.md).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generates route types (`next typegen`), then TypeScript with no emit |
| `npm run db:generate` | Write the next migration from `src/lib/db/schema.ts` into `drizzle/` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Browse the database in Drizzle Studio |
| `npm run db:seed` | Push the seed files into the database. Overwrites matching rows |
| `npm run db:set-role -- <email> <user\|host\|admin>` | Give an account a role. The app never lets anyone change their own role |
| `npm run photos:ttl` | Probe how long Google Places photo URLs stay valid |
| `npm run audio:kangla` | Regenerate the Kangla narration audio |

The `db:*`, `photos:ttl` and `audio:kangla:openai` scripts read `.env.local`.

## Project structure

```
src/app/            Routes, layouts, Route Handlers (api/) and Server Actions
src/components/     UI, grouped by feature (ui/ holds the shared primitives)
src/lib/data/       The data layer: catalogue reads, seed fallback, photo credits
src/lib/data/seed/  Bundled seed content, one file per vertical
src/lib/db/         Drizzle schema, relations and the server-only database client
src/lib/auth/       Neon Auth, the session data-access layer and the local fallback session
src/lib/host/       Role checks (requireAdmin, requireHost) and dashboard sample data
src/lib/booking/    Pricing, bookings and the saved list (browser storage for now)
src/lib/ai/         Concierge model config, prompt, tools, itinerary schema and fallbacks
src/lib/immersive/  Kangla landmarks, bounds and narration
src/types/          Shared TypeScript types
drizzle/            Drizzle migrations (the live migration history)
db/                 Database and auth setup guide; optional research-data SQL (db/research-seed/)
scripts/            Seeding, roles, asset generation and browser checks
data/research/      The 2026 research pass: sourced listings and photo indexes
docs/               Feature documentation and the contributor task list
public/             Images, 3D models, audio and video
```

## Data and content

- **Seed files vs the database.** `src/lib/data/seed/*.ts` is the bundled catalogue. When
  `DATABASE_URL` is set, the app reads the Neon database instead, and falls back to the
  seed files if a query fails. A database can also load the verified 2026 research
  listings from `data/research/` (about 240 hotspots, homestays and eateries) with the SQL
  in `db/research-seed/`; those are not in the seed files yet, so a zero-config local run
  shows a smaller catalogue than the live site.
- **Editing content.** Change the seed file and open a pull request. Merging it does not
  change the live site by itself: the live site reads its database, and a maintainer
  applies the change there. `npm run db:seed` overwrites every matching row, so it is for
  your own database, not for refreshing production (see [db/README.md](db/README.md)).
  If you only want to report a mistake, use the *Content correction* issue form.
- **Sources.** Research listings record their sources and verification. Please include
  a public source for any fact you add.
- **Photos and credit.** Only use photos you have the right to use. Wikimedia Commons
  photos are credited in `src/lib/data/photo-credits.ts` and shown on `/terms`. Google
  Places photos are display-only: they are fetched per request through
  `/api/place-photo`, never stored, and shown with their attribution. See
  [data/research/PHOTOS.md](data/research/PHOTOS.md).
- **Map data.** Map imagery is attributed to its providers on the map itself. The Kangla
  3D models are approximate, photo-referenced reconstructions, not surveys; see
  [docs/kangla-immersive.md](docs/kangla-immersive.md).

## Contributing and Hacktoberfest

Contributions of all sizes are welcome: code, content corrections, new places, photos you
own, translations and accessibility fixes.

1. Read [CONTRIBUTING.md](CONTRIBUTING.md).
2. Pick a task from [docs/GOOD_FIRST_ISSUES.md](docs/GOOD_FIRST_ISSUES.md) or the issue
   tracker, and ask to be assigned.
3. Fork, branch, and open a pull request against `main`.

During Hacktoberfest, maintainers add the `hacktoberfest-accepted` label to pull requests
that are merged or approved. Low-effort pull requests are labelled `spam` or `invalid`.
The rules are in [CONTRIBUTING.md](CONTRIBUTING.md#hacktoberfest).

Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Community

Join the [Discord](https://discord.gg/hgGfm6UpU) to ask questions, discuss ideas and find
something to work on.

## Security

Please do not report security problems in public issues. Use GitHub's private
vulnerability reporting; [SECURITY.md](SECURITY.md) has the details.

## License

Released under the MIT License. See the [LICENSE](LICENSE) file. Photographs credited to
third parties stay under their own licences, as recorded in
`src/lib/data/photo-credits.ts`.

## Acknowledgements

Discover Manipur began at *Re-Imagining Manipur: Hackathon 2026*. Thanks to MTIF and the
Departments of Tourism and IT, Government of Manipur, for that opportunity. Thanks also
to the photographers on Wikimedia Commons whose work is credited on the site, the
OpenStreetMap contributors, and everyone who has corrected or added a listing.
