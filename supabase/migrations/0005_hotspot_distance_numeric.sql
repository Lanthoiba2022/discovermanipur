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
