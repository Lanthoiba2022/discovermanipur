-- Baseline: the schema as of the move to Drizzle, generated from
-- src/lib/db/schema.ts (itself introspected from the live Neon database) plus
-- the pieces Drizzle cannot model, added by hand below. It builds an empty
-- database from nothing; on the database that db/migrations/0001–0011 already
-- built, it is recorded as applied instead of run (see db/README.md).
--
-- Needs Neon Auth enabled on the branch: profiles.id references neon_auth.user.
-- Contains no data — catalogue rows come from a Neon branch or `npm run db:seed`.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "pg_trgm";--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."booking_kind" AS ENUM('homestay', 'experience', 'tour', 'transport', 'table');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."faq_audience" AS ENUM('traveller', 'host');--> statement-breakpoint
CREATE TYPE "public"."host_type" AS ENUM('homestay', 'eatery', 'guide', 'experience');--> statement-breakpoint
CREATE TYPE "public"."source_verification" AS ENUM('official', 'corroborated', 'single-source', 'phone-verified', 'unverified');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'host', 'admin');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "booking_kind" NOT NULL,
	"ref_id" uuid NOT NULL,
	"ref_title" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"guests" integer NOT NULL,
	"total_price" integer NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_guests_check" CHECK (guests > 0),
	CONSTRAINT "bookings_total_price_check" CHECK (total_price >= 0),
	CONSTRAINT "booking_dates_ordered" CHECK ((end_date IS NULL) OR (end_date > start_date))
);
--> statement-breakpoint
CREATE TABLE "crafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"maker_id" uuid,
	"name" text NOT NULL,
	"meitei_name" text,
	"description" text NOT NULL,
	"story" text,
	"category" text NOT NULL,
	"price" integer NOT NULL,
	"price_note" text,
	"maker" text NOT NULL,
	"maker_story" text,
	"location" text NOT NULL,
	"district" text NOT NULL,
	"phone" text,
	"website" text,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"materials" text[] DEFAULT '{}'::text[] NOT NULL,
	"made_to_order" boolean DEFAULT false NOT NULL,
	"lead_time_days" integer,
	"gi_tagged" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crafts_slug_key" UNIQUE("slug"),
	CONSTRAINT "crafts_price_check" CHECK (price >= 0)
);
--> statement-breakpoint
CREATE TABLE "eateries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"cuisines" text[] DEFAULT '{}'::text[] NOT NULL,
	"location" text NOT NULL,
	"district" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"price_range" smallint NOT NULL,
	"timings" text,
	"phone" text,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rating" numeric(2, 1) DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"signature_dishes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"accepts_reservations" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sort_weight" integer DEFAULT 0 NOT NULL,
	"photo_refs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification" "source_verification" DEFAULT 'unverified' NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "eateries_slug_key" UNIQUE("slug"),
	CONSTRAINT "eateries_price_range_check" CHECK ((price_range >= 1) AND (price_range <= 3))
);
--> statement-breakpoint
CREATE TABLE "experiences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"host_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"host" text NOT NULL,
	"location" text NOT NULL,
	"district" text NOT NULL,
	"duration_hours" numeric(4, 1) NOT NULL,
	"price_per_person" integer NOT NULL,
	"group_size_max" integer DEFAULT 10 NOT NULL,
	"languages" text[] DEFAULT '{}'::text[] NOT NULL,
	"includes" text[] DEFAULT '{}'::text[] NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rating" numeric(2, 1) DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sort_weight" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "experiences_slug_key" UNIQUE("slug"),
	CONSTRAINT "experiences_price_per_person_check" CHECK (price_per_person >= 0)
);
--> statement-breakpoint
CREATE TABLE "faq_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"audience" "faq_audience" DEFAULT 'traveller' NOT NULL,
	"label" text NOT NULL,
	"blurb" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "faq_groups_audience_slug_key" UNIQUE("audience","slug")
);
--> statement-breakpoint
CREATE TABLE "faq_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "faq_items_group_id_question_key" UNIQUE("group_id","question")
);
--> statement-breakpoint
CREATE TABLE "festivals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"meitei_name" text,
	"description" text NOT NULL,
	"month" text NOT NULL,
	"typical_dates" text,
	"location" text NOT NULL,
	"district" text NOT NULL,
	"significance" text,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sort_weight" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "festivals_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "homestays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"host_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"host_name" text NOT NULL,
	"host_story" text,
	"host_avatar" text,
	"location" text NOT NULL,
	"district" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"price_per_night" integer NOT NULL,
	"max_guests" integer NOT NULL,
	"bedrooms" integer DEFAULT 1 NOT NULL,
	"bathrooms" integer DEFAULT 1 NOT NULL,
	"amenities" text[] DEFAULT '{}'::text[] NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rating" numeric(2, 1) DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"house_rules" text[] DEFAULT '{}'::text[] NOT NULL,
	"cancellation_policy" text,
	"featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sort_weight" integer DEFAULT 0 NOT NULL,
	"photo_refs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification" "source_verification" DEFAULT 'unverified' NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "homestays_slug_key" UNIQUE("slug"),
	CONSTRAINT "homestays_price_per_night_check" CHECK (price_per_night >= 0),
	CONSTRAINT "homestays_max_guests_check" CHECK (max_guests > 0)
);
--> statement-breakpoint
CREATE TABLE "host_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"host_type" "host_type" NOT NULL,
	"property_name" text NOT NULL,
	"property_address" text NOT NULL,
	"district" text NOT NULL,
	"description" text NOT NULL,
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotspots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"meitei_name" text,
	"tagline" text NOT NULL,
	"description" text NOT NULL,
	"history" text,
	"category" text NOT NULL,
	"district" text NOT NULL,
	"location" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"best_time" text,
	"best_seasons" text[] DEFAULT '{}'::text[] NOT NULL,
	"entry_fee" text,
	"timings" text,
	"how_to_reach" text,
	"distance_km" numeric(6, 1) DEFAULT 0 NOT NULL,
	"duration_hours" numeric(4, 1) DEFAULT 2 NOT NULL,
	"tips" text[] DEFAULT '{}'::text[] NOT NULL,
	"accessibility" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"panorama_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sort_weight" integer DEFAULT 0 NOT NULL,
	"photo_refs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification" "source_verification" DEFAULT 'unverified' NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "hotspots_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "immersive_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scene" text DEFAULT 'kangla-fort' NOT NULL,
	"title" text NOT NULL,
	"href" text NOT NULL,
	"note" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "immersive_sources_scene_title_key" UNIQUE("scene","title")
);
--> statement-breakpoint
CREATE TABLE "immersive_stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scene" text DEFAULT 'kangla-fort' NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"subtitle" text NOT NULL,
	"image" text NOT NULL,
	"alt" text NOT NULL,
	"description" text NOT NULL,
	"look_for" text NOT NULL,
	"reconstruction" text NOT NULL,
	"camera" jsonb NOT NULL,
	"target" jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "immersive_stops_scene_slug_key" UNIQUE("scene","slug")
);
--> statement-breakpoint
CREATE TABLE "photo_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file" text NOT NULL,
	"alt" text NOT NULL,
	"subject" text NOT NULL,
	"author" text NOT NULL,
	"licence" text NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "photo_credits_file_key" UNIQUE("file")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_items" (
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_items_pkey" PRIMARY KEY("user_id","kind","slug")
);
--> statement-breakpoint
CREATE TABLE "saved_itineraries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"days" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"travel_month" text,
	"estimated_cost_inr" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_itineraries_estimated_cost_inr_check" CHECK ((estimated_cost_inr IS NULL) OR (estimated_cost_inr >= 0))
);
--> statement-breakpoint
CREATE TABLE "site_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"payload" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_sections_key_key" UNIQUE("key"),
	CONSTRAINT "site_sections_payload_is_array" CHECK (jsonb_typeof(payload) = 'array'::text)
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"origin" text NOT NULL,
	"avatar" text,
	"quote" text NOT NULL,
	"rating" smallint NOT NULL,
	"trip_type" text NOT NULL,
	"approved" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "testimonials_rating_check" CHECK ((rating >= 1) AND (rating <= 5))
);
--> statement-breakpoint
CREATE TABLE "tours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"duration_days" integer NOT NULL,
	"price_per_person" integer NOT NULL,
	"group_size_max" integer DEFAULT 12 NOT NULL,
	"difficulty" text NOT NULL,
	"themes" text[] DEFAULT '{}'::text[] NOT NULL,
	"districts_covered" text[] DEFAULT '{}'::text[] NOT NULL,
	"itinerary" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"includes" text[] DEFAULT '{}'::text[] NOT NULL,
	"excludes" text[] DEFAULT '{}'::text[] NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"departure_dates" text[] DEFAULT '{}'::text[] NOT NULL,
	"rating" numeric(2, 1) DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sort_weight" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "tours_slug_key" UNIQUE("slug"),
	CONSTRAINT "tours_duration_days_check" CHECK (duration_days > 0),
	CONSTRAINT "tours_price_per_person_check" CHECK (price_per_person >= 0)
);
--> statement-breakpoint
CREATE TABLE "transport_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"mode" text NOT NULL,
	"operator" text NOT NULL,
	"description" text NOT NULL,
	"seats" integer DEFAULT 4 NOT NULL,
	"price_per_day" integer,
	"price_per_km" integer,
	"routes" text[] DEFAULT '{}'::text[] NOT NULL,
	"includes" text[] DEFAULT '{}'::text[] NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rating" numeric(2, 1) DEFAULT 0 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sort_weight" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "transport_options_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crafts" ADD CONSTRAINT "crafts_maker_id_fkey" FOREIGN KEY ("maker_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq_items" ADD CONSTRAINT "faq_items_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."faq_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homestays" ADD CONSTRAINT "homestays_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "host_applications" ADD CONSTRAINT "host_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_itineraries" ADD CONSTRAINT "saved_itineraries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_user_idx" ON "bookings" USING btree ("user_id","start_date" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "crafts_category_idx" ON "crafts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "crafts_district_idx" ON "crafts" USING btree ("district");--> statement-breakpoint
CREATE INDEX "crafts_featured_idx" ON "crafts" USING btree ("featured") WHERE featured;--> statement-breakpoint
CREATE INDEX "crafts_name_trgm_idx" ON "crafts" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "eateries_district_idx" ON "eateries" USING btree ("district");--> statement-breakpoint
CREATE INDEX "eateries_sort_idx" ON "eateries" USING btree ("sort_weight" DESC NULLS FIRST,"featured" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "experiences_category_idx" ON "experiences" USING btree ("category");--> statement-breakpoint
CREATE INDEX "faq_groups_audience_idx" ON "faq_groups" USING btree ("audience","sort_order");--> statement-breakpoint
CREATE INDEX "faq_items_group_idx" ON "faq_items" USING btree ("group_id","sort_order");--> statement-breakpoint
CREATE INDEX "homestays_active_idx" ON "homestays" USING btree ("is_active") WHERE is_active;--> statement-breakpoint
CREATE INDEX "homestays_district_idx" ON "homestays" USING btree ("district");--> statement-breakpoint
CREATE INDEX "homestays_price_idx" ON "homestays" USING btree ("price_per_night");--> statement-breakpoint
CREATE INDEX "homestays_sort_idx" ON "homestays" USING btree ("sort_weight" DESC NULLS FIRST,"featured" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "host_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "hotspots_category_idx" ON "hotspots" USING btree ("category");--> statement-breakpoint
CREATE INDEX "hotspots_district_idx" ON "hotspots" USING btree ("district");--> statement-breakpoint
CREATE INDEX "hotspots_featured_idx" ON "hotspots" USING btree ("featured") WHERE featured;--> statement-breakpoint
CREATE INDEX "hotspots_name_trgm_idx" ON "hotspots" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "hotspots_sort_idx" ON "hotspots" USING btree ("sort_weight" DESC NULLS FIRST,"featured" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "saved_itineraries_user_idx" ON "saved_itineraries" USING btree ("user_id","created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "transport_options_sort_idx" ON "transport_options" USING btree ("sort_weight" DESC NULLS FIRST,"featured" DESC NULLS FIRST);--> statement-breakpoint
-- Drizzle does not model functions or triggers; these keep updated_at honest.
CREATE OR REPLACE FUNCTION "public"."touch_updated_at"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "profiles_touch" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();--> statement-breakpoint
CREATE TRIGGER "homestays_touch" BEFORE UPDATE ON "public"."homestays" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();--> statement-breakpoint
CREATE TRIGGER "bookings_touch" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();--> statement-breakpoint
CREATE TRIGGER "applications_touch" BEFORE UPDATE ON "public"."host_applications" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();--> statement-breakpoint
CREATE TRIGGER "crafts_touch" BEFORE UPDATE ON "public"."crafts" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();--> statement-breakpoint
CREATE TRIGGER "saved_itineraries_touch" BEFORE UPDATE ON "public"."saved_itineraries" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();--> statement-breakpoint
CREATE TRIGGER "faq_groups_touch" BEFORE UPDATE ON "public"."faq_groups" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();--> statement-breakpoint
CREATE TRIGGER "faq_items_touch" BEFORE UPDATE ON "public"."faq_items" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();--> statement-breakpoint
CREATE TRIGGER "photo_credits_touch" BEFORE UPDATE ON "public"."photo_credits" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();--> statement-breakpoint
CREATE TRIGGER "site_sections_touch" BEFORE UPDATE ON "public"."site_sections" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();--> statement-breakpoint
CREATE TRIGGER "immersive_stops_touch" BEFORE UPDATE ON "public"."immersive_stops" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();--> statement-breakpoint
CREATE TRIGGER "immersive_sources_touch" BEFORE UPDATE ON "public"."immersive_sources" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();
