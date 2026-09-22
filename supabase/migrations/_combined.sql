-- ===========================================================================
-- Yening — all migrations, concatenated in order, for a one-shot apply.
-- Generated 2026-09-21. Source of truth remains the numbered files.
-- Run once against an EMPTY project (0001 uses bare CREATE TYPE/TABLE).
-- ===========================================================================

-- ─────────────────────────────────────────────── 0001_schema.sql ───
-- ============================================================================
-- Yening — core schema
-- Manipur tourism platform. Postgres 15+ (Supabase).
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ----------------------------------------------------------------- enums ---
create type user_role       as enum ('user', 'host', 'admin');
create type booking_status  as enum ('pending', 'confirmed', 'completed', 'cancelled');
create type booking_kind    as enum ('homestay', 'experience', 'tour', 'transport', 'table');
create type host_type       as enum ('homestay', 'eatery', 'guide', 'experience');
create type application_status as enum ('pending', 'approved', 'rejected');

-- --------------------------------------------------------------- profiles ---
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  first_name  text,
  last_name   text,
  phone       text,
  avatar_url  text,
  role        user_role not null default 'user',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- places ----
-- Editorial catalogue. Seeded from src/lib/data/seed, then owned by the DB.
create table public.hotspots (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  meitei_name   text,
  tagline       text not null,
  description   text not null,
  history       text,
  category      text not null,
  district      text not null,
  location      text not null,
  lat           double precision not null,
  lng           double precision not null,
  images        jsonb not null default '[]'::jsonb,
  best_time     text,
  best_seasons  text[] not null default '{}',
  entry_fee     text,
  timings       text,
  how_to_reach  text,
  distance_km   integer not null default 0,
  duration_hours numeric(4,1) not null default 2,
  tips          text[] not null default '{}',
  accessibility jsonb not null default '{}'::jsonb,
  tags          text[] not null default '{}',
  featured      boolean not null default false,
  panorama_url  text,
  created_at    timestamptz not null default now()
);

create table public.homestays (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  host_id         uuid references public.profiles(id) on delete set null,
  title           text not null,
  description     text not null,
  host_name       text not null,
  host_story      text,
  host_avatar     text,
  location        text not null,
  district        text not null,
  lat             double precision not null,
  lng             double precision not null,
  price_per_night integer not null check (price_per_night >= 0),
  max_guests      integer not null check (max_guests > 0),
  bedrooms        integer not null default 1,
  bathrooms       integer not null default 1,
  amenities       text[] not null default '{}',
  images          jsonb not null default '[]'::jsonb,
  rating          numeric(2,1) not null default 0,
  review_count    integer not null default 0,
  house_rules     text[] not null default '{}',
  cancellation_policy text,
  featured        boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.experiences (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  host_id         uuid references public.profiles(id) on delete set null,
  title           text not null,
  description     text not null,
  category        text not null,
  host            text not null,
  location        text not null,
  district        text not null,
  duration_hours  numeric(4,1) not null,
  price_per_person integer not null check (price_per_person >= 0),
  group_size_max  integer not null default 10,
  languages       text[] not null default '{}',
  includes        text[] not null default '{}',
  images          jsonb not null default '[]'::jsonb,
  rating          numeric(2,1) not null default 0,
  review_count    integer not null default 0,
  featured        boolean not null default false,
  created_at      timestamptz not null default now()
);

create table public.eateries (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  description   text not null,
  cuisines      text[] not null default '{}',
  location      text not null,
  district      text not null,
  lat           double precision not null,
  lng           double precision not null,
  price_range   smallint not null check (price_range between 1 and 3),
  timings       text,
  phone         text,
  images        jsonb not null default '[]'::jsonb,
  rating        numeric(2,1) not null default 0,
  review_count  integer not null default 0,
  signature_dishes jsonb not null default '[]'::jsonb,
  accepts_reservations boolean not null default false,
  featured      boolean not null default false,
  created_at    timestamptz not null default now()
);

create table public.tours (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  description     text not null,
  duration_days   integer not null check (duration_days > 0),
  price_per_person integer not null check (price_per_person >= 0),
  group_size_max  integer not null default 12,
  difficulty      text not null,
  themes          text[] not null default '{}',
  districts_covered text[] not null default '{}',
  itinerary       jsonb not null default '[]'::jsonb,
  includes        text[] not null default '{}',
  excludes        text[] not null default '{}',
  images          jsonb not null default '[]'::jsonb,
  departure_dates text[] not null default '{}',
  rating          numeric(2,1) not null default 0,
  review_count    integer not null default 0,
  featured        boolean not null default false,
  created_at      timestamptz not null default now()
);

create table public.transport_options (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  mode          text not null,
  operator      text not null,
  description   text not null,
  seats         integer not null default 4,
  price_per_day integer,
  price_per_km  integer,
  routes        text[] not null default '{}',
  includes      text[] not null default '{}',
  images        jsonb not null default '[]'::jsonb,
  rating        numeric(2,1) not null default 0,
  featured      boolean not null default false,
  created_at    timestamptz not null default now()
);

create table public.festivals (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  meitei_name   text,
  description   text not null,
  month         text not null,
  typical_dates text,
  location      text not null,
  district      text not null,
  significance  text,
  images        jsonb not null default '[]'::jsonb,
  featured      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------- bookings ----
create table public.bookings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        booking_kind not null,
  ref_id      uuid not null,
  ref_title   text not null,
  start_date  date not null,
  end_date    date,
  guests      integer not null check (guests > 0),
  total_price integer not null check (total_price >= 0),
  status      booking_status not null default 'pending',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint booking_dates_ordered check (end_date is null or end_date > start_date)
);

create table public.host_applications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  host_type        host_type not null,
  property_name    text not null,
  property_address text not null,
  district         text not null,
  description      text not null,
  status           application_status not null default 'pending',
  admin_notes      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.saved_items (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null,
  slug       text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, slug)
);

create table public.testimonials (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  origin    text not null,
  avatar    text,
  quote     text not null,
  rating    smallint not null check (rating between 1 and 5),
  trip_type text not null,
  approved  boolean not null default true,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------- indexes ---
create index hotspots_district_idx     on public.hotspots (district);
create index hotspots_category_idx     on public.hotspots (category);
create index hotspots_featured_idx     on public.hotspots (featured) where featured;
create index hotspots_name_trgm_idx    on public.hotspots using gin (name gin_trgm_ops);
create index homestays_district_idx    on public.homestays (district);
create index homestays_price_idx       on public.homestays (price_per_night);
create index homestays_active_idx      on public.homestays (is_active) where is_active;
create index experiences_category_idx  on public.experiences (category);
create index eateries_district_idx     on public.eateries (district);
create index bookings_user_idx         on public.bookings (user_id, start_date desc);
create index applications_status_idx   on public.host_applications (status);

-- --------------------------------------------------------------- triggers --
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch  before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger homestays_touch before update on public.homestays
  for each row execute function public.touch_updated_at();
create trigger bookings_touch  before update on public.bookings
  for each row execute function public.touch_updated_at();
create trigger applications_touch before update on public.host_applications
  for each row execute function public.touch_updated_at();

-- New auth user -> profile row.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────── 0002_rls.sql ───
-- ============================================================================
-- Yening — Row Level Security
-- Catalogue tables are world-readable; everything user-owned is locked to the
-- owner, with an admin escape hatch via a SECURITY DEFINER role check.
-- ============================================================================

-- Avoids the classic recursive-policy trap of selecting profiles inside a
-- profiles policy.
create or replace function public.current_role_is(target user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = target
  );
$$;

alter table public.profiles          enable row level security;
alter table public.hotspots          enable row level security;
alter table public.homestays         enable row level security;
alter table public.experiences       enable row level security;
alter table public.eateries          enable row level security;
alter table public.tours             enable row level security;
alter table public.transport_options enable row level security;
alter table public.festivals         enable row level security;
alter table public.bookings          enable row level security;
alter table public.host_applications enable row level security;
alter table public.saved_items       enable row level security;
alter table public.testimonials      enable row level security;

-- ------------------------------------------------------------- catalogue ---
-- Public read for anon + authenticated; writes are admin-only.
do $$
declare t text;
begin
  foreach t in array array[
    'hotspots','experiences','eateries','tours','transport_options','festivals'
  ] loop
    execute format(
      'create policy %I_public_read on public.%I for select using (true)', t, t);
    execute format(
      'create policy %I_admin_write on public.%I for all
         using (public.current_role_is(''admin''))
         with check (public.current_role_is(''admin''))', t, t);
  end loop;
end $$;

-- Homestays: public reads only the active ones; the owning host and admins see
-- and manage their own rows regardless.
create policy homestays_public_read on public.homestays
  for select using (is_active or host_id = auth.uid() or public.current_role_is('admin'));

create policy homestays_host_insert on public.homestays
  for insert with check (host_id = auth.uid() and public.current_role_is('host'));

create policy homestays_host_update on public.homestays
  for update using (host_id = auth.uid() or public.current_role_is('admin'))
  with check (host_id = auth.uid() or public.current_role_is('admin'));

create policy homestays_host_delete on public.homestays
  for delete using (host_id = auth.uid() or public.current_role_is('admin'));

-- Approved testimonials are public; admins manage.
create policy testimonials_public_read on public.testimonials
  for select using (approved or public.current_role_is('admin'));
create policy testimonials_admin_write on public.testimonials
  for all using (public.current_role_is('admin'))
  with check (public.current_role_is('admin'));

-- -------------------------------------------------------------- profiles ---
create policy profiles_read_own on public.profiles
  for select using (id = auth.uid() or public.current_role_is('admin'));

create policy profiles_update_own on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- Role escalation guard: a user may not change their own role.
create or replace function public.guard_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.current_role_is('admin') then
    raise exception 'insufficient privilege to change role';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_role_change();

create policy profiles_admin_all on public.profiles
  for all using (public.current_role_is('admin'))
  with check (public.current_role_is('admin'));

-- -------------------------------------------------------------- bookings ---
create policy bookings_read_own on public.bookings
  for select using (user_id = auth.uid() or public.current_role_is('admin'));

create policy bookings_insert_own on public.bookings
  for insert with check (user_id = auth.uid());

create policy bookings_update_own on public.bookings
  for update using (user_id = auth.uid() or public.current_role_is('admin'))
  with check (user_id = auth.uid() or public.current_role_is('admin'));

-- ---------------------------------------------------------- applications ---
create policy applications_read_own on public.host_applications
  for select using (user_id = auth.uid() or public.current_role_is('admin'));

create policy applications_insert_own on public.host_applications
  for insert with check (user_id = auth.uid());

-- Only admins may move an application through its workflow.
create policy applications_admin_update on public.host_applications
  for update using (public.current_role_is('admin'))
  with check (public.current_role_is('admin'));

-- ----------------------------------------------------------- saved items ---
create policy saved_own on public.saved_items
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─────────────────────────────────────────────── 0003_crafts_and_itineraries.sql ───
-- ============================================================================
-- Yening — crafts marketplace + saved itineraries
-- Restores two features carried over from the TripTreat prototype.
-- ============================================================================

-- ----------------------------------------------------------------- crafts ---
-- Yening takes no payment and no commission: a listing carries the maker's own
-- contact details and an enquiry goes straight to the artisan. There is
-- deliberately no order/cart/payment table here.
create table public.crafts (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  maker_id      uuid references public.profiles(id) on delete set null,
  name          text not null,
  meitei_name   text,
  description   text not null,
  story         text,
  category      text not null,
  price         integer not null check (price >= 0),
  price_note    text,
  maker         text not null,
  maker_story   text,
  location      text not null,
  district      text not null,
  phone         text,
  website       text,
  images        jsonb not null default '[]'::jsonb,
  materials     text[] not null default '{}',
  made_to_order boolean not null default false,
  lead_time_days integer,
  gi_tagged     boolean not null default false,
  featured      boolean not null default false,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index crafts_category_idx on public.crafts (category);
create index crafts_district_idx on public.crafts (district);
create index crafts_featured_idx on public.crafts (featured) where featured;
create index crafts_name_trgm_idx on public.crafts using gin (name gin_trgm_ops);

create trigger crafts_touch before update on public.crafts
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------ saved itineraries ---
create table public.saved_itineraries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  days          jsonb not null default '[]'::jsonb,
  travel_month  text,
  estimated_cost_inr integer check (estimated_cost_inr is null or estimated_cost_inr >= 0),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index saved_itineraries_user_idx
  on public.saved_itineraries (user_id, created_at desc);

create trigger saved_itineraries_touch before update on public.saved_itineraries
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------------------- RLS ---
alter table public.crafts            enable row level security;
alter table public.saved_itineraries enable row level security;

-- Crafts are catalogue: world-readable when active; the owning maker and
-- admins additionally see and manage their own rows.
create policy crafts_public_read on public.crafts
  for select using (is_active or maker_id = auth.uid() or public.current_role_is('admin'));

create policy crafts_maker_insert on public.crafts
  for insert with check (maker_id = auth.uid() and public.current_role_is('host'));

create policy crafts_maker_update on public.crafts
  for update using (maker_id = auth.uid() or public.current_role_is('admin'))
  with check (maker_id = auth.uid() or public.current_role_is('admin'));

create policy crafts_maker_delete on public.crafts
  for delete using (maker_id = auth.uid() or public.current_role_is('admin'));

-- A saved itinerary is private to the traveller who saved it. Note there is no
-- admin read policy here on purpose: an itinerary is personal travel planning,
-- and operations has no reason to read it.
create policy saved_itineraries_own on public.saved_itineraries
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─────────────────────────────────────────────── 0004_grants.sql ───
-- ============================================================================
-- Yening — API role grants
-- Restores the grants Supabase normally applies by default. Tables created
-- through the Management API (rather than the dashboard SQL editor) land with
-- only REFERENCES/TRIGGER/TRUNCATE for anon/authenticated/service_role, so
-- PostgREST answers "permission denied" for every table.
--
-- These grants are deliberately coarse: Row Level Security (0002, 0003) is what
-- actually gates access. That is the standard Supabase model and the one the
-- policies in this project were written against — anon holds INSERT here, but
-- no catalogue policy lets it through, and every table has RLS enabled.
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- Future tables inherit the same, so later migrations do not repeat this.
alter default privileges in schema public
  grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;

-- ─────────────────────────────────────────────── 0005_hotspot_distance_numeric.sql ───
-- ============================================================================
-- Yening — hotspots.distance_km must allow sub-kilometre distances
-- Three central-Imphal landmarks sit under 1 km from the city centre
-- (Ima Keithel 0.5, Shaheed Minar 0.8, Manipur State Museum 1.5). The column
-- was `integer`, so seeding them either failed or silently rounded 0.5 to 0.
-- The TypeScript type was always `number`; the column was the odd one out.
-- ============================================================================

alter table public.hotspots
  alter column distance_km type numeric(6,1) using distance_km::numeric(6,1);

alter table public.hotspots
  alter column distance_km set default 0;

-- ─────────────────────────────────────────────── 0006_site_content.sql ───
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

