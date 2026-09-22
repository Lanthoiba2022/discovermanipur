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
