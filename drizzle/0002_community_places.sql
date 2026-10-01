CREATE TYPE "public"."community_place_category" AS ENUM('attraction', 'eatery', 'stay', 'craft');--> statement-breakpoint
CREATE TYPE "public"."community_place_status" AS ENUM('pending', 'published', 'held', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."photo_licence" AS ENUM('own-work', 'cc-by-4.0', 'cc-by-sa-4.0', 'cc0');--> statement-breakpoint
CREATE TYPE "public"."submitter_relationship" AS ENUM('none', 'owner', 'connected');--> statement-breakpoint
CREATE TABLE "community_place_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid,
	"uploaded_by" uuid,
	"storage_key" text NOT NULL,
	"thumb_key" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"bytes" integer NOT NULL,
	"alt" text,
	"licence" "photo_licence" NOT NULL,
	"author" text NOT NULL,
	"source_url" text,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"removed_at" timestamp with time zone,
	"discarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_place_photos_storage_key_key" UNIQUE("storage_key"),
	CONSTRAINT "community_place_photos_dimensions_check" CHECK ((width > 0) AND (height > 0) AND (bytes > 0))
);
--> statement-breakpoint
CREATE TABLE "community_place_votes" (
	"place_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_place_votes_pkey" PRIMARY KEY("place_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "community_places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"submitted_by" uuid,
	"name" text NOT NULL,
	"category" "community_place_category" NOT NULL,
	"district" text NOT NULL,
	"location" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"description" text NOT NULL,
	"practical_details" text,
	"sources" text[] DEFAULT '{}'::text[] NOT NULL,
	"relationship" "submitter_relationship" NOT NULL,
	"status" "community_place_status" DEFAULT 'pending' NOT NULL,
	"upvote_count" integer DEFAULT 0 NOT NULL,
	"voting_ends_at" timestamp with time zone NOT NULL,
	"published_at" timestamp with time zone,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_places_slug_key" UNIQUE("slug"),
	CONSTRAINT "community_places_upvote_count_check" CHECK (upvote_count >= 0),
	CONSTRAINT "community_places_coordinates_paired" CHECK ((lat IS NULL) = (lng IS NULL)),
	CONSTRAINT "community_places_published_at_set" CHECK ((status <> 'published') OR (published_at IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "community_place_photos" ADD CONSTRAINT "community_place_photos_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "public"."community_places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_place_photos" ADD CONSTRAINT "community_place_photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_place_votes" ADD CONSTRAINT "community_place_votes_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "public"."community_places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_place_votes" ADD CONSTRAINT "community_place_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_places" ADD CONSTRAINT "community_places_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_places" ADD CONSTRAINT "community_places_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_place_photos_place_idx" ON "community_place_photos" USING btree ("place_id","sort_order");--> statement-breakpoint
CREATE INDEX "community_place_photos_uploader_idx" ON "community_place_photos" USING btree ("uploaded_by","created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "community_place_votes_user_idx" ON "community_place_votes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "community_places_name_district_key" ON "community_places" USING btree (lower("name"),"district") WHERE status <> 'rejected';--> statement-breakpoint
CREATE INDEX "community_places_status_idx" ON "community_places" USING btree ("status","voting_ends_at");--> statement-breakpoint
CREATE INDEX "community_places_published_idx" ON "community_places" USING btree ("published_at" DESC NULLS LAST) WHERE status = 'published';--> statement-breakpoint
CREATE INDEX "community_places_submitter_idx" ON "community_places" USING btree ("submitted_by","created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "community_places_name_trgm_idx" ON "community_places" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
-- Hand-added (Drizzle does not model triggers): keep updated_at current, as
-- the baseline does for the other tables.
CREATE TRIGGER "community_places_touch" BEFORE UPDATE ON "public"."community_places" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();
