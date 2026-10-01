-- ============================================================================
-- 0011 — a stand-in photo for Ango Ching
--
-- Ango Ching is the one seeded place with no photograph anywhere: Wikimedia
-- Commons has nothing, Openverse has nothing, and the Google Places entry
-- ("Ango Ching Range") carries zero photos. With an empty `images` and empty
-- `photo_refs` the card fell through to the shared placeholder, so the page
-- showed the Kangla Sha guardians — a fort in Imphal — under an Ukhrul hill.
-- A visibly wrong photo is worse than a generic one.
--
-- So: an existing, already-hosted photograph of the Ukhrul hills stands in.
-- It is the right district and the right kind of landscape.
--
-- The alt text says "in Ukhrul district, near Ango Ching" and NOT "Ango Ching".
-- That distinction matters — a screen-reader user should not be told they are
-- looking at a photograph of the hill when nobody has one. `credit` carries the
-- CC BY 2.0 attribution the licence requires; the file is already listed in
-- src/lib/data/photo-credits.ts, so the credit was written once and is reused.
--
-- Scoped to this single slug on purpose. Every other row either has its own
-- photography or real Places references.
-- ============================================================================

update public.hotspots
   set images = '[{
         "src": "/file-uploads/ukhrul-hill-haze.webp",
         "alt": "Layered hills fading into blue haze above a village in Ukhrul district, near Ango Ching",
         "credit": "Photo: shankar s. / Wikimedia Commons, CC BY 2.0"
       }]'::jsonb
 where slug = 'ango-ching'
   and jsonb_array_length(images) = 0;
