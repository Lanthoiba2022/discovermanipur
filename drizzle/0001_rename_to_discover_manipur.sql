-- Rename the product from "Manipur Tourism" to "Discover Manipur" in the
-- editorial content served from the database (the code and seed files were
-- renamed in the same change).
--
-- Phrase-level on purpose. "Manipur Tourism" is ALSO the name of the real
-- state government department, and many rows cite it as a source
-- ("Registered with Manipur Tourism", "listed by Manipur Tourism", "the
-- Government of Manipur and Manipur Tourism for permits"). Those must keep
-- the real name, so only the exact phrases that mean this site are replaced.
-- Every statement is a no-op when re-run.

-- FAQ: three questions, and the parts of four answers that name the site.
UPDATE "public"."faq_items"
   SET "question" = replace("question", 'Manipur Tourism', 'Discover Manipur')
 WHERE "question" IN (
   'What does Manipur Tourism actually take?',
   'Does Manipur Tourism tell me which places are accessible?',
   'Can I book through Manipur Tourism?'
 );--> statement-breakpoint
UPDATE "public"."faq_items"
   SET "answer" = replace(replace(replace("answer",
         'Manipur Tourism is a demonstration project', 'Discover Manipur is a demonstration project'),
         'Manipur Tourism is a demonstration site', 'Discover Manipur is a demonstration site'),
         'Manipur Tourism mediates', 'Discover Manipur mediates')
 WHERE "answer" LIKE '%Manipur Tourism is a demonstration%'
    OR "answer" LIKE '%Manipur Tourism mediates%';--> statement-breakpoint
UPDATE "public"."faq_groups"
   SET "blurb" = replace("blurb", 'booking on Manipur Tourism means', 'booking on Discover Manipur means')
 WHERE "blurb" LIKE '%booking on Manipur Tourism means%';--> statement-breakpoint

-- Host page blocks (/host).
UPDATE "public"."site_sections"
   SET "payload" = replace(replace(replace("payload"::text,
         'A Manipur Tourism photographer', 'A Discover Manipur photographer'),
         'the Manipur Tourism district team', 'the Discover Manipur district team'),
         'Manipur Tourism keeps 10%', 'Discover Manipur keeps 10%')::jsonb
 WHERE "payload"::text LIKE '%A Manipur Tourism photographer%'
    OR "payload"::text LIKE '%the Manipur Tourism district team%'
    OR "payload"::text LIKE '%Manipur Tourism keeps 10\%%';--> statement-breakpoint

-- The site's own (fictional) desk and cab brand, not the department.
UPDATE "public"."experiences"
   SET "host" = replace("host", 'Manipur Tourism cultural desk', 'Discover Manipur cultural desk')
 WHERE "host" LIKE 'Manipur Tourism cultural desk%';--> statement-breakpoint
UPDATE "public"."transport_options"
   SET "operator" = 'Discover Manipur Verified Cabs'
 WHERE "operator" = 'Manipur Tourism Verified Cabs';--> statement-breakpoint

-- Self-check: abort (and roll back) if the site's name survives anywhere in
-- these tables, other than the one deliberate government reference.
DO $$
DECLARE leftover int;
BEGIN
  SELECT count(*) INTO leftover FROM (
    SELECT replace("question" || ' ' || "answer", 'the Government of Manipur and Manipur Tourism for permits', '') AS t FROM "public"."faq_items"
    UNION ALL SELECT coalesce("blurb", '') || ' ' || "label" FROM "public"."faq_groups"
    UNION ALL SELECT "payload"::text FROM "public"."site_sections"
    UNION ALL SELECT "host" FROM "public"."experiences"
    UNION ALL SELECT "operator" FROM "public"."transport_options"
  ) x WHERE t LIKE '%Manipur Tourism%';
  IF leftover > 0 THEN
    RAISE EXCEPTION 'rename_to_discover_manipur: % row(s) still name "Manipur Tourism" as the site', leftover;
  END IF;
END $$;
