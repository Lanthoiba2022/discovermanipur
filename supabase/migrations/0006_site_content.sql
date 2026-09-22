-- ============================================================================
-- Yening — editorial site content
-- Everything that reads as *content* rather than *structure* moves out of the
-- component tree and into here, so it can be corrected without a deploy.
--
-- Deliberately NOT in the database: the nav tree (it mirrors the route
-- structure), the category/season/month label maps (they are keyed off
-- TypeScript union types, so a row could never add a member), and the filter
-- definitions (they are bound to URL search params). Those are structure.
--
-- Icons are stored as lucide-react *names*. A component reference cannot
-- serialise, so the name -> component map stays in code and the choice of icon
-- travels with the content.
-- ============================================================================

-- ------------------------------------------------------------------- faqs ---
-- Two audiences share one shape: travellers (the /faq browser, grouped) and
-- prospective hosts (a flat list on /host).
create type faq_audience as enum ('traveller', 'host');

create table public.faq_groups (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null,
  audience   faq_audience not null default 'traveller',
  label      text not null,
  blurb      text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (audience, slug)
);

create table public.faq_items (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.faq_groups(id) on delete cascade,
  question   text not null,
  -- Plain prose: this is also rendered into the FAQPage JSON-LD.
  answer     text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, question)
);

create index faq_items_group_idx on public.faq_items (group_id, sort_order);
create index faq_groups_audience_idx on public.faq_groups (audience, sort_order);

-- ---------------------------------------------------------- photo credits ---
-- CC BY and CC BY-SA both require attribution, so this is a licence
-- obligation, not decoration. `file` is the name inside public/file-uploads.
create table public.photo_credits (
  id         uuid primary key default gen_random_uuid(),
  file       text not null unique,
  alt        text not null,
  subject    text not null,
  author     text not null,
  licence    text not null,
  source     text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------- site sections ---
-- Heterogeneous page blocks, each keyed ("about.themes", "home.stats"). The
-- payload is an array of objects whose shape differs per key, which is exactly
-- the case jsonb exists for — one table beats a dozen near-empty ones.
create table public.site_sections (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  label       text not null,
  description text,
  payload     jsonb not null default '[]'::jsonb,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint site_sections_payload_is_array check (jsonb_typeof(payload) = 'array')
);

-- --------------------------------------------------------------- immersive ---
-- The Kangla Fort 3D walkthrough. Camera and target are [x, y, z] triples.
create table public.immersive_stops (
  id             uuid primary key default gen_random_uuid(),
  scene          text not null default 'kangla-fort',
  slug           text not null,
  name           text not null,
  short_name     text not null,
  subtitle       text not null,
  image          text not null,
  alt            text not null,
  description    text not null,
  look_for       text not null,
  -- What is faithful to the reference photograph and what is interpretive.
  -- This is an honesty note shown to visitors, not internal metadata.
  reconstruction text not null,
  camera         jsonb not null,
  target         jsonb not null,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (scene, slug)
);

create table public.immersive_sources (
  id         uuid primary key default gen_random_uuid(),
  scene      text not null default 'kangla-fort',
  title      text not null,
  href       text not null,
  note       text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scene, title)
);

-- ---------------------------------------------------------------- triggers ---
create trigger faq_groups_touch        before update on public.faq_groups
  for each row execute function public.touch_updated_at();
create trigger faq_items_touch         before update on public.faq_items
  for each row execute function public.touch_updated_at();
create trigger photo_credits_touch     before update on public.photo_credits
  for each row execute function public.touch_updated_at();
create trigger site_sections_touch     before update on public.site_sections
  for each row execute function public.touch_updated_at();
create trigger immersive_stops_touch   before update on public.immersive_stops
  for each row execute function public.touch_updated_at();
create trigger immersive_sources_touch before update on public.immersive_sources
  for each row execute function public.touch_updated_at();

-- --------------------------------------------------------------------- RLS ---
-- All of this is published editorial copy: world-readable, admin-writable.
-- Same posture as the catalogue tables in 0002.
alter table public.faq_groups        enable row level security;
alter table public.faq_items         enable row level security;
alter table public.photo_credits     enable row level security;
alter table public.site_sections     enable row level security;
alter table public.immersive_stops   enable row level security;
alter table public.immersive_sources enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'faq_groups','faq_items','photo_credits','site_sections',
    'immersive_stops','immersive_sources'
  ] loop
    execute format(
      'create policy %I_public_read on public.%I for select using (true)', t, t);
    execute format(
      'create policy %I_admin_write on public.%I for all
         using (public.current_role_is(''admin''))
         with check (public.current_role_is(''admin''))', t, t);
  end loop;
end $$;
