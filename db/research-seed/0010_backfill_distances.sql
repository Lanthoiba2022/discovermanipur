-- ============================================================================
-- Yening — backfill hotspots.distance_km for the 2026 research rows
--
-- WHY
--   The 2026 research batch (seeded by 0008/0009, identified by sort_weight =
--   100) was inserted with lat/lng straight from the Google Places API but
--   with distance_km left at the column default of 0. Every card for those
--   hotspots therefore rendered "0 m from Imphal".
--
-- WHAT
--   Recompute distance_km as the great-circle (haversine) distance from the
--   Imphal city centre (24.8170 N, 93.9368 E) to each hotspot's lat/lng, in
--   pure SQL — this database has no PostGIS and no earthdistance extension.
--   Mean Earth radius 6371 km. The result is rounded to the nearest whole
--   kilometre; the column is numeric(6,1) (see src/lib/db/schema.ts),
--   so whole values are stored as e.g. 97.0.
--
--   The acos() argument is clamped to [-1, 1]: floating-point rounding can
--   push it a hair past 1.0 for a point sitting on the origin, which would
--   raise "input is out of range".
--
-- SCOPE — why `sort_weight = 100 AND distance_km = 0`
--   The original hand-curated seed rows (sort_weight = 0) have distances that
--   were checked by road/reality, not by straight-line maths, and must not be
--   overwritten. Restricting to sort_weight = 100 protects them. The extra
--   `distance_km = 0` guard keeps this idempotent and leaves alone any 2026
--   row that already received a real distance.
-- ============================================================================

update public.hotspots
set distance_km = round(
      (
        6371 * acos(
          least(1.0, greatest(-1.0,
            cos(radians(24.8170)) * cos(radians(lat))
              * cos(radians(lng) - radians(93.9368))
            + sin(radians(24.8170)) * sin(radians(lat))
          ))
        )
      )::numeric,
      0
    )
where sort_weight = 100
  and distance_km = 0
  and lat is not null
  and lng is not null;
