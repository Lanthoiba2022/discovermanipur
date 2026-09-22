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
