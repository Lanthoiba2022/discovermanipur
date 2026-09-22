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
