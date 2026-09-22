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
