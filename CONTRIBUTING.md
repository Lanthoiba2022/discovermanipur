# Contributing to Discover Manipur

Thanks for helping. Discover Manipur is a community guide to Manipur for visitors and for
people who live here, and it gets better with every correction, new place and fix.

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). By
contributing, you agree that your contributions are licensed under the MIT License (see
the [LICENSE](LICENSE) file).

## Contents

- [Ways to contribute](#ways-to-contribute)
- [Development setup](#development-setup)
- [Workflow: fork, branch, pull request](#workflow-fork-branch-pull-request)
- [Commit messages](#commit-messages)
- [What CI checks](#what-ci-checks)
- [Code guidelines](#code-guidelines)
- [Content: places, listings and corrections](#content-places-listings-and-corrections)
- [Photos and attribution](#photos-and-attribution)
- [Hacktoberfest](#hacktoberfest)
- [Using AI assistants](#using-ai-assistants)
- [Getting help](#getting-help)

## Ways to contribute

- **Fix a bug or build a feature.** Start with [docs/GOOD_FIRST_ISSUES.md](docs/GOOD_FIRST_ISSUES.md)
  or the open issues.
- **Correct a listing.** Wrong timings, fees, a place that has closed: use the
  *Content correction* issue form, or edit the seed file directly (see below).
- **Suggest a new place**, homestay, eatery, experience or craft maker with the
  *Suggest a new place* issue form.
- **Contribute photos** you took yourself, or that carry a reuse licence.
- **Translate** into Meiteilon (Meetei Mayek), Hindi or other languages of Manipur.
- **Improve accessibility** or documentation.

## Development setup

Requirements: Node.js 20.9 or newer, npm, and Git.

```bash
# 1. Fork the repository on GitHub, then:
git clone https://github.com/<your-username>/discovermanipur.git
cd discovermanipur
git remote add upstream https://github.com/Lanthoiba2022/discovermanipur.git

# 2. Install exactly what the lockfile says
npm ci

# 3. Run it
npm run dev        # http://localhost:3000
```

No environment variables are needed. Without them the catalogue comes from
`src/lib/data/seed/`, sign-in uses a browser-only local session in development, and the
AI concierge shows a recorded sample. To work on the database, auth, the AI concierge or
the Kangla map, copy `.env.example` to `.env.local` and fill in only what you need; the
[README](README.md#optional-services) lists what each variable unlocks and
[db/README.md](db/README.md) covers database and auth setup.

Never commit `.env.local` or any key, token or password. If you leak one by accident,
tell a maintainer privately and rotate it.

## Workflow: fork, branch, pull request

1. **Find or open an issue first**, and comment to ask to be assigned. This avoids two
   people doing the same work. Small typo fixes in code comments do not need an issue,
   but see the Hacktoberfest rules below.
2. **Sync and branch** from the latest `main`:
   ```bash
   git fetch upstream
   git switch -c fix/homestay-price-format upstream/main
   ```
   Name branches `type/short-description`, for example `feat/host-applications-db`,
   `fix/kangla-mobile-overflow`, `content/ukhrul-eateries`, `docs/contributing`.
3. **Keep it focused.** One issue per pull request. Do not mix refactors, formatting
   changes and features.
4. **Run the checks locally** (see [What CI checks](#what-ci-checks)).
5. **Open a pull request against `main`** and fill in the template: what changed, the
   linked issue (`Closes #123`), and screenshots for any UI change (desktop and mobile).
6. **Respond to review.** Push follow-up commits to the same branch. Maintainers squash
   or merge when it is ready.

Pull requests that are inactive for 14 days after a review request may be closed; you can
always reopen them.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org), as the existing history
does:

```
feat: add district filter to eateries
fix: keep Kangla camera inside the fort on Safari pinch
docs: explain the seed fallback
content: correct Loktak boat timings
```

Common types: `feat`, `fix`, `docs`, `content`, `refactor`, `perf`, `test`, `chore`,
`ci`. An optional scope is fine (`fix(auth): ...`). Write the subject in the imperative,
lower case, without a trailing full stop.

## What CI checks

Every pull request runs [.github/workflows/ci.yml](.github/workflows/ci.yml) with **no
secrets**, the same way a fresh clone builds:

```bash
npm ci
npm run lint
npm run typecheck     # runs `next typegen` first (PageProps, LayoutProps)
npm run build
```

Run these before you push. The app is designed to build with an empty environment; if
your change only builds with a key or a database, it will fail CI. There is no automated
test suite yet (adding one is on the [task list](docs/GOOD_FIRST_ISSUES.md)).

## Code guidelines

This is **Next.js 16**, which differs from older versions you may know. Read the
relevant guide in `node_modules/next/dist/docs/` before using an API you are unsure of.
For example, `middleware.ts` is now `src/proxy.ts`, and `params` / `searchParams` are
async.

**General**

- TypeScript is `strict`. Avoid `any`; types live in `src/types/`.
- Import with the `@/` alias (`@/lib/data`, `@/components/ui/button`).
- Style with Tailwind classes and the existing primitives in `src/components/ui/`.
  Follow the look of the surrounding components rather than adding a new style.
- Validate input with `zod`, on the client for convenience and again on the server.
- Nothing may throw at import time because a variable is missing. Check configuration
  at request time and fall back gracefully, as `src/lib/db`, `src/lib/auth/env.ts` and
  `src/lib/ai/config.ts` do.

**Server and client components**

- Components are Server Components by default. Add `"use client"` only when a component
  needs state, effects or browser APIs, and keep that boundary as low in the tree as you
  can.
- Never import `@/lib/db`, read a server-only variable, or use a secret in a client
  component. Values with a `NEXT_PUBLIC_` prefix are shipped to every visitor.
- Routes and components read catalogue data through `@/lib/data`, never from
  `@/lib/data/seed/*` directly. That module handles the database-or-seed decision.

**Auth and roles (please read before touching anything protected)**

- **Every protected page checks the role itself.** Each page under `src/app/admin/`
  calls `requireAdmin(path)` and the host dashboard calls `requireHost(path)`
  (`src/lib/host/role.ts`, built on `requireRole` in `src/lib/auth/dal.ts`). A check in a
  layout is not enough: layouts do not re-run on client navigation, and hiding
  `{children}` does not stop the page rendering. `src/proxy.ts` is only an early,
  optimistic check.
- **Server Actions and Route Handlers are public endpoints.** Anyone can call them with
  any input. Validate every argument, check the session inside the action, and check
  that the user may act on that row.
- **Never trust an id from the client.** Resolve the user from the session cookie on the
  server (see `src/lib/auth/profile.ts`). Do not accept `userId`, `role` or `hostId`
  from a form.
- **Roles are never self-assigned.** The only place the app writes `profiles.role` is
  an admin approving a host application, which promotes a `user` to `host` inside an
  admin-only action. Every other change goes through `npm run db:set-role`. Keep it
  that way.
- There is no Row Level Security: the app connects as the table owner, so these checks
  in code are the only protection.
- Every export of a `"use server"` file becomes a callable endpoint. Keep helpers that
  must not be called from the browser out of those files (see the note at the top of
  `src/lib/auth/dal.ts`).

**Database**

- `src/lib/db/schema.ts` is the source of truth. After changing it, run
  `npm run db:generate`, review the SQL it writes to `drizzle/`, and commit both.
- Never edit a migration that has already been applied; add a new one.
- `db/research-seed/0008_seed_2026_research.sql` is generated from the maintainers'
  research data, which is not in the repository. Do not edit it by hand; report a
  mistake in it with the *Content correction* issue form.

**Accessibility**

The site targets WCAG 2.1 AA. Use semantic HTML, label every control, give images
meaningful `alt` text (or `alt=""` if decorative), keep focus visible, and respect
`prefers-reduced-motion` for animation.

## Content: places, listings and corrections

Catalogue content lives in `src/lib/data/seed/`, one file per vertical (`hotspots.ts`,
`homestays.ts`, `eateries.ts`, `experiences.ts`, `tours.ts`, `transport.ts`,
`festivals.ts`, `crafts.ts`). Types are in `src/types/index.ts`.

To add or fix a listing:

1. Edit the right seed file. Give a new entry a unique `id` and a URL-safe `slug`, and
   fill every required field of its type; `npm run typecheck` will tell you what is
   missing.
2. Add public sources (official tourism pages, news, the place's own site or map listing)
   in the pull request description, and in the `sources` field where the type has one.
3. Write plainly and factually. No marketing copy, no invented hosts, prices or reviews.
   Mark anything uncertain, and tell travellers to confirm timings and permits locally.
4. Open a pull request with the `content:` commit type.

The live site reads from a database, not from the seed files. After your pull request
is merged, a maintainer applies the change to the live database, so it appears on the
site after that step rather than immediately on merge. (`npm run db:seed` overwrites
every matching row, so use it only against your own database.) Listings that exist only
in the live database (the 2026 research rows) come from `db/research-seed/`; for those, a *Content correction* issue is the quickest route. If you do not want to edit code, the *Content correction* and
*Suggest a new place* issue forms are just as useful.

Please do not add personal phone numbers, home addresses or emails of private
individuals. Business contact details that the business publishes itself are fine.

## Photos and attribution

- Only add a photo if **you took it**, or it has a licence that allows reuse (for example
  CC BY, CC BY-SA, CC0 or public domain). "Found it on Google, Instagram or a blog" is
  not a licence. Crediting a photo does not make it usable if its licence does not allow
  it.
- Every third-party photo needs an entry in `src/lib/data/photo-credits.ts` with author,
  licence and source page. Those credits are shown on `/terms`.
- **Open the image before you use it.** Check that it really shows the place in
  Manipur. Commons files are often filed under subjects they do not show.
- Google Places photos are display-only. They must stay as references (`photoRefs`),
  never be downloaded into the repository, and always be shown with their attribution.
- Resize large photos for the web (around 2000 px on the long edge, WebP preferred) and
  remove location metadata from photos of private homes.

## Hacktoberfest

We take part in [Hacktoberfest](https://hacktoberfest.com). To make your contribution
count and keep reviews manageable:

- **Ask to be assigned** on an issue before you start, and wait for a maintainer to
  confirm. Unassigned work that duplicates someone else's may be closed.
- **One issue per pull request.**
- Maintainers add the **`hacktoberfest-accepted`** label to pull requests that are
  merged or approved.
- Pull requests that only farm contributions are labelled **`spam`** or **`invalid`**
  and closed. Examples: whitespace or formatting-only changes, renaming variables,
  fixing a single typo in the README, adding your name to a list, machine-generated
  changes nobody checked, or copying another contributor's open pull request.
- Content contributions count. A well-sourced new place, a verified correction or a
  licensed photo set is a real contribution.
- Look for issues labelled `good first issue` or `help wanted` (and `content`, `i18n` or
  `accessibility` for those areas), or the list in
  [docs/GOOD_FIRST_ISSUES.md](docs/GOOD_FIRST_ISSUES.md).

## Using AI assistants

You may use AI coding assistants. You are responsible for everything you submit:

- Read, understand and test every line before you open the pull request. Be ready to
  explain it in review.
- Check that facts about places (timings, fees, history) come from a real source. Models
  invent plausible details; we do not publish invented ones.
- Do not paste secrets, `.env.local` or other people's personal data into an assistant.
- [AGENTS.md](AGENTS.md) holds the Next.js 16 rules for agents. Point your assistant at
  it and at `node_modules/next/dist/docs/`.

## Getting help

- Ask on [Discord](https://discord.gg/hgGfm6UpU), or comment on the issue you are working
  on.
- Report security problems privately, as described in [SECURITY.md](SECURITY.md), not in a
  public issue.
