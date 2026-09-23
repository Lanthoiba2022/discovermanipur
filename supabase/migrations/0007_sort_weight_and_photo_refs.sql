-- ============================================================================
-- 0007 — ordering weight + external photo references
--
-- Two additive changes. Nothing existing is modified or deleted; every current
-- row keeps its content and lands on the defaults below, which reproduce today's
-- behaviour exactly.
--
-- 1. sort_weight
--    The catalogue had no ordering column — `index.ts` sorted on `featured`
--    alone, so there was no way to put one cohort ahead of another. The 2026
--    research pass added ~150 verified listings that should lead the UI, with
--    the original seed following. A weight does that without touching a single
--    existing row: new findings are inserted at 100, everything already in the
--    table stays at 0, and the sort reads weight first, then featured.
--
--    Deliberately an integer rather than a boolean "is_new": cohorts accumulate.
--    A third pass can sit at 200 without another migration.
--
-- 2. photo_refs
--    Google Places photos are licensed for display but NOT for storing the image
--    bytes — see data/research/PHOTOS.md. So they cannot live in `images`, which
--    holds paths to files we host. They are held here as references and resolved
--    at request time by /api/place-photo, which keeps the API key server-side.
--
--    Shape (jsonb array):
--      [{ "provider": "google-places",
--         "ref": "places/<place_id>/photos/<photo_id>",
--         "width": 4800, "height": 3388,
--         "attribution": [{ "name": "...", "uri": "..." }] }]
--
--    `attribution` is a condition of the Google Maps Platform terms, not a
--    courtesy: render it wherever the photo is rendered.
-- ============================================================================

-- ------------------------------------------------------------ sort_weight ---
alter table public.hotspots          add column if not exists sort_weight integer not null default 0;
alter table public.homestays         add column if not exists sort_weight integer not null default 0;
alter table public.eateries          add column if not exists sort_weight integer not null default 0;
alter table public.transport_options add column if not exists sort_weight integer not null default 0;
alter table public.experiences       add column if not exists sort_weight integer not null default 0;
alter table public.festivals         add column if not exists sort_weight integer not null default 0;
alter table public.tours             add column if not exists sort_weight integer not null default 0;

comment on column public.hotspots.sort_weight is
  'Display cohort. Higher sorts first, before `featured`. 0 = original 2025 seed, 100 = verified 2026 research pass.';

-- Composite so the common "weight desc, featured desc" read is a single index scan.
create index if not exists hotspots_sort_idx          on public.hotspots          (sort_weight desc, featured desc);
create index if not exists homestays_sort_idx         on public.homestays         (sort_weight desc, featured desc);
create index if not exists eateries_sort_idx          on public.eateries          (sort_weight desc, featured desc);
create index if not exists transport_options_sort_idx on public.transport_options (sort_weight desc, featured desc);

-- ------------------------------------------------------------- photo_refs ---
alter table public.hotspots  add column if not exists photo_refs jsonb not null default '[]'::jsonb;
alter table public.homestays add column if not exists photo_refs jsonb not null default '[]'::jsonb;
alter table public.eateries  add column if not exists photo_refs jsonb not null default '[]'::jsonb;

comment on column public.hotspots.photo_refs is
  'External photo references resolved at request time (Google Places). NOT self-hosted files — those go in `images`. Each entry carries the attribution that must be displayed alongside it.';

-- --------------------------------------------------------------- provenance --
-- Where a row came from and when it was last checked against a live source.
-- The research datasets carry a verification level per record and none of it was
-- phone-verified; recording that here stops "sourced from a government list" and
-- "someone called and confirmed" from becoming indistinguishable later.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'source_verification') then
    create type source_verification as enum ('official', 'corroborated', 'single-source', 'phone-verified', 'unverified');
  end if;
end $$;

alter table public.hotspots  add column if not exists verification source_verification not null default 'unverified';
alter table public.homestays add column if not exists verification source_verification not null default 'unverified';
alter table public.eateries  add column if not exists verification source_verification not null default 'unverified';

alter table public.hotspots  add column if not exists sources jsonb not null default '[]'::jsonb;
alter table public.homestays add column if not exists sources jsonb not null default '[]'::jsonb;
alter table public.eateries  add column if not exists sources jsonb not null default '[]'::jsonb;

comment on column public.hotspots.verification is
  'How well attested this row is. ''phone-verified'' may only be set by a human who actually called.';
