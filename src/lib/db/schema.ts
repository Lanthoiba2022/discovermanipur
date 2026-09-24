import { pgTable, foreignKey, uuid, text, timestamp, index, unique, doublePrecision, jsonb, numeric, boolean, integer, check, date, smallint, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

import { neonAuthUser } from "./neon-auth"

/**
 * The app's tables, as Drizzle sees them. This file is the source of truth for
 * the schema: change it, then `npm run db:generate` writes the migration.
 *
 * Generated from the live database with `drizzle-kit pull` (casing preserved,
 * so keys are the snake_case column names the row mappers in src/lib/data
 * already read) and then hand-tended. Drizzle cannot express what lives
 * outside tables — the `touch_updated_at` trigger function, its per-table
 * triggers and the `pg_trgm` extension. Those are in the baseline migration
 * `drizzle/0000_baseline.sql`; add new ones with `drizzle-kit generate --custom`.
 *
 * `numeric` columns use number mode (JS numbers both ways). Most `timestamptz`
 * columns use `mode: 'string'` — raw Postgres text, which nothing reads —
 * except `profiles`, which uses `Date` because its `created_at` is shown.
 */

export const application_status = pgEnum("application_status", ['pending', 'approved', 'rejected'])
export const booking_kind = pgEnum("booking_kind", ['homestay', 'experience', 'tour', 'transport', 'table'])
export const booking_status = pgEnum("booking_status", ['pending', 'confirmed', 'completed', 'cancelled'])
export const faq_audience = pgEnum("faq_audience", ['traveller', 'host'])
export const host_type = pgEnum("host_type", ['homestay', 'eatery', 'guide', 'experience'])
export const source_verification = pgEnum("source_verification", ['official', 'corroborated', 'single-source', 'phone-verified', 'unverified'])
export const user_role = pgEnum("user_role", ['user', 'host', 'admin'])


export const profiles = pgTable("profiles", {
	id: uuid().primaryKey().notNull(),
	email: text().notNull(),
	first_name: text(),
	last_name: text(),
	phone: text(),
	avatar_url: text(),
	role: user_role().default('user').notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [neonAuthUser.id],
			name: "profiles_id_fkey"
		}).onDelete("cascade"),
]);

export const hotspots = pgTable("hotspots", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	name: text().notNull(),
	meitei_name: text(),
	tagline: text().notNull(),
	description: text().notNull(),
	history: text(),
	category: text().notNull(),
	district: text().notNull(),
	location: text().notNull(),
	lat: doublePrecision().notNull(),
	lng: doublePrecision().notNull(),
	images: jsonb().default([]).notNull(),
	best_time: text(),
	best_seasons: text().array().default(sql`'{}'::text[]`).notNull(),
	entry_fee: text(),
	timings: text(),
	how_to_reach: text(),
	distance_km: numeric({ mode: "number", precision: 6, scale: 1 }).default(sql`0`).notNull(),
	duration_hours: numeric({ mode: "number", precision: 4, scale: 1 }).default(sql`2`).notNull(),
	tips: text().array().default(sql`'{}'::text[]`).notNull(),
	accessibility: jsonb().default({}).notNull(),
	tags: text().array().default(sql`'{}'::text[]`).notNull(),
	featured: boolean().default(false).notNull(),
	panorama_url: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	sort_weight: integer().default(0).notNull(),
	photo_refs: jsonb().default([]).notNull(),
	verification: source_verification().default('unverified').notNull(),
	sources: jsonb().default([]).notNull(),
}, (table) => [
	index("hotspots_category_idx").using("btree", table.category),
	index("hotspots_district_idx").using("btree", table.district),
	index("hotspots_featured_idx").using("btree", table.featured).where(sql`featured`),
	index("hotspots_name_trgm_idx").using("gin", table.name.op("gin_trgm_ops")),
	index("hotspots_sort_idx").using("btree", table.sort_weight.desc().nullsFirst(), table.featured.desc().nullsFirst()),
	unique("hotspots_slug_key").on(table.slug),
]);

export const homestays = pgTable("homestays", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	host_id: uuid(),
	title: text().notNull(),
	description: text().notNull(),
	host_name: text().notNull(),
	host_story: text(),
	host_avatar: text(),
	location: text().notNull(),
	district: text().notNull(),
	lat: doublePrecision().notNull(),
	lng: doublePrecision().notNull(),
	price_per_night: integer().notNull(),
	max_guests: integer().notNull(),
	bedrooms: integer().default(1).notNull(),
	bathrooms: integer().default(1).notNull(),
	amenities: text().array().default(sql`'{}'::text[]`).notNull(),
	images: jsonb().default([]).notNull(),
	rating: numeric({ mode: "number", precision: 2, scale: 1 }).default(sql`0`).notNull(),
	review_count: integer().default(0).notNull(),
	house_rules: text().array().default(sql`'{}'::text[]`).notNull(),
	cancellation_policy: text(),
	featured: boolean().default(false).notNull(),
	is_active: boolean().default(true).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	sort_weight: integer().default(0).notNull(),
	photo_refs: jsonb().default([]).notNull(),
	verification: source_verification().default('unverified').notNull(),
	sources: jsonb().default([]).notNull(),
}, (table) => [
	index("homestays_active_idx").using("btree", table.is_active).where(sql`is_active`),
	index("homestays_district_idx").using("btree", table.district),
	index("homestays_price_idx").using("btree", table.price_per_night),
	index("homestays_sort_idx").using("btree", table.sort_weight.desc().nullsFirst(), table.featured.desc().nullsFirst()),
	foreignKey({
			columns: [table.host_id],
			foreignColumns: [profiles.id],
			name: "homestays_host_id_fkey"
		}).onDelete("set null"),
	unique("homestays_slug_key").on(table.slug),
	check("homestays_price_per_night_check", sql`price_per_night >= 0`),
	check("homestays_max_guests_check", sql`max_guests > 0`),
]);

export const experiences = pgTable("experiences", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	host_id: uuid(),
	title: text().notNull(),
	description: text().notNull(),
	category: text().notNull(),
	host: text().notNull(),
	location: text().notNull(),
	district: text().notNull(),
	duration_hours: numeric({ mode: "number", precision: 4, scale: 1 }).notNull(),
	price_per_person: integer().notNull(),
	group_size_max: integer().default(10).notNull(),
	languages: text().array().default(sql`'{}'::text[]`).notNull(),
	includes: text().array().default(sql`'{}'::text[]`).notNull(),
	images: jsonb().default([]).notNull(),
	rating: numeric({ mode: "number", precision: 2, scale: 1 }).default(sql`0`).notNull(),
	review_count: integer().default(0).notNull(),
	featured: boolean().default(false).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	sort_weight: integer().default(0).notNull(),
}, (table) => [
	index("experiences_category_idx").using("btree", table.category),
	foreignKey({
			columns: [table.host_id],
			foreignColumns: [profiles.id],
			name: "experiences_host_id_fkey"
		}).onDelete("set null"),
	unique("experiences_slug_key").on(table.slug),
	check("experiences_price_per_person_check", sql`price_per_person >= 0`),
]);

export const bookings = pgTable("bookings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	user_id: uuid().notNull(),
	kind: booking_kind().notNull(),
	ref_id: uuid().notNull(),
	ref_title: text().notNull(),
	start_date: date().notNull(),
	end_date: date(),
	guests: integer().notNull(),
	total_price: integer().notNull(),
	status: booking_status().default('pending').notNull(),
	notes: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("bookings_user_idx").using("btree", table.user_id, table.start_date.desc().nullsFirst()),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [profiles.id],
			name: "bookings_user_id_fkey"
		}).onDelete("cascade"),
	check("bookings_guests_check", sql`guests > 0`),
	check("bookings_total_price_check", sql`total_price >= 0`),
	check("booking_dates_ordered", sql`(end_date IS NULL) OR (end_date > start_date)`),
]);

export const host_applications = pgTable("host_applications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	user_id: uuid().notNull(),
	host_type: host_type().notNull(),
	property_name: text().notNull(),
	property_address: text().notNull(),
	district: text().notNull(),
	description: text().notNull(),
	status: application_status().default('pending').notNull(),
	admin_notes: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("applications_status_idx").using("btree", table.status),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [profiles.id],
			name: "host_applications_user_id_fkey"
		}).onDelete("cascade"),
]);

export const transport_options = pgTable("transport_options", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	name: text().notNull(),
	mode: text().notNull(),
	operator: text().notNull(),
	description: text().notNull(),
	seats: integer().default(4).notNull(),
	price_per_day: integer(),
	price_per_km: integer(),
	routes: text().array().default(sql`'{}'::text[]`).notNull(),
	includes: text().array().default(sql`'{}'::text[]`).notNull(),
	images: jsonb().default([]).notNull(),
	rating: numeric({ mode: "number", precision: 2, scale: 1 }).default(sql`0`).notNull(),
	featured: boolean().default(false).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	sort_weight: integer().default(0).notNull(),
}, (table) => [
	index("transport_options_sort_idx").using("btree", table.sort_weight.desc().nullsFirst(), table.featured.desc().nullsFirst()),
	unique("transport_options_slug_key").on(table.slug),
]);

export const festivals = pgTable("festivals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	name: text().notNull(),
	meitei_name: text(),
	description: text().notNull(),
	month: text().notNull(),
	typical_dates: text(),
	location: text().notNull(),
	district: text().notNull(),
	significance: text(),
	images: jsonb().default([]).notNull(),
	featured: boolean().default(false).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	sort_weight: integer().default(0).notNull(),
}, (table) => [
	unique("festivals_slug_key").on(table.slug),
]);

export const saved_itineraries = pgTable("saved_itineraries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	user_id: uuid().notNull(),
	title: text().notNull(),
	days: jsonb().default([]).notNull(),
	travel_month: text(),
	estimated_cost_inr: integer(),
	notes: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("saved_itineraries_user_idx").using("btree", table.user_id, table.created_at.desc().nullsFirst()),
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [profiles.id],
			name: "saved_itineraries_user_id_fkey"
		}).onDelete("cascade"),
	check("saved_itineraries_estimated_cost_inr_check", sql`(estimated_cost_inr IS NULL) OR (estimated_cost_inr >= 0)`),
]);

export const crafts = pgTable("crafts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	maker_id: uuid(),
	name: text().notNull(),
	meitei_name: text(),
	description: text().notNull(),
	story: text(),
	category: text().notNull(),
	price: integer().notNull(),
	price_note: text(),
	maker: text().notNull(),
	maker_story: text(),
	location: text().notNull(),
	district: text().notNull(),
	phone: text(),
	website: text(),
	images: jsonb().default([]).notNull(),
	materials: text().array().default(sql`'{}'::text[]`).notNull(),
	made_to_order: boolean().default(false).notNull(),
	lead_time_days: integer(),
	gi_tagged: boolean().default(false).notNull(),
	featured: boolean().default(false).notNull(),
	is_active: boolean().default(true).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("crafts_category_idx").using("btree", table.category),
	index("crafts_district_idx").using("btree", table.district),
	index("crafts_featured_idx").using("btree", table.featured).where(sql`featured`),
	index("crafts_name_trgm_idx").using("gin", table.name.op("gin_trgm_ops")),
	foreignKey({
			columns: [table.maker_id],
			foreignColumns: [profiles.id],
			name: "crafts_maker_id_fkey"
		}).onDelete("set null"),
	unique("crafts_slug_key").on(table.slug),
	check("crafts_price_check", sql`price >= 0`),
]);

export const faq_groups = pgTable("faq_groups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	audience: faq_audience().default('traveller').notNull(),
	label: text().notNull(),
	blurb: text(),
	sort_order: integer().default(0).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("faq_groups_audience_idx").using("btree", table.audience, table.sort_order),
	unique("faq_groups_audience_slug_key").on(table.audience, table.slug),
]);

export const eateries = pgTable("eateries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	cuisines: text().array().default(sql`'{}'::text[]`).notNull(),
	location: text().notNull(),
	district: text().notNull(),
	lat: doublePrecision().notNull(),
	lng: doublePrecision().notNull(),
	price_range: smallint().notNull(),
	timings: text(),
	phone: text(),
	images: jsonb().default([]).notNull(),
	rating: numeric({ mode: "number", precision: 2, scale: 1 }).default(sql`0`).notNull(),
	review_count: integer().default(0).notNull(),
	signature_dishes: jsonb().default([]).notNull(),
	accepts_reservations: boolean().default(false).notNull(),
	featured: boolean().default(false).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	sort_weight: integer().default(0).notNull(),
	photo_refs: jsonb().default([]).notNull(),
	verification: source_verification().default('unverified').notNull(),
	sources: jsonb().default([]).notNull(),
}, (table) => [
	index("eateries_district_idx").using("btree", table.district),
	index("eateries_sort_idx").using("btree", table.sort_weight.desc().nullsFirst(), table.featured.desc().nullsFirst()),
	unique("eateries_slug_key").on(table.slug),
	check("eateries_price_range_check", sql`(price_range >= 1) AND (price_range <= 3)`),
]);

export const tours = pgTable("tours", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	duration_days: integer().notNull(),
	price_per_person: integer().notNull(),
	group_size_max: integer().default(12).notNull(),
	difficulty: text().notNull(),
	themes: text().array().default(sql`'{}'::text[]`).notNull(),
	districts_covered: text().array().default(sql`'{}'::text[]`).notNull(),
	itinerary: jsonb().default([]).notNull(),
	includes: text().array().default(sql`'{}'::text[]`).notNull(),
	excludes: text().array().default(sql`'{}'::text[]`).notNull(),
	images: jsonb().default([]).notNull(),
	departure_dates: text().array().default(sql`'{}'::text[]`).notNull(),
	rating: numeric({ mode: "number", precision: 2, scale: 1 }).default(sql`0`).notNull(),
	review_count: integer().default(0).notNull(),
	featured: boolean().default(false).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	sort_weight: integer().default(0).notNull(),
}, (table) => [
	unique("tours_slug_key").on(table.slug),
	check("tours_duration_days_check", sql`duration_days > 0`),
	check("tours_price_per_person_check", sql`price_per_person >= 0`),
]);

export const testimonials = pgTable("testimonials", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	origin: text().notNull(),
	avatar: text(),
	quote: text().notNull(),
	rating: smallint().notNull(),
	trip_type: text().notNull(),
	approved: boolean().default(true).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, () => [
	check("testimonials_rating_check", sql`(rating >= 1) AND (rating <= 5)`),
]);

export const faq_items = pgTable("faq_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	group_id: uuid().notNull(),
	question: text().notNull(),
	answer: text().notNull(),
	sort_order: integer().default(0).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("faq_items_group_idx").using("btree", table.group_id, table.sort_order),
	foreignKey({
			columns: [table.group_id],
			foreignColumns: [faq_groups.id],
			name: "faq_items_group_id_fkey"
		}).onDelete("cascade"),
	unique("faq_items_group_id_question_key").on(table.group_id, table.question),
]);

export const photo_credits = pgTable("photo_credits", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	file: text().notNull(),
	alt: text().notNull(),
	subject: text().notNull(),
	author: text().notNull(),
	licence: text().notNull(),
	source: text().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("photo_credits_file_key").on(table.file),
]);

export const site_sections = pgTable("site_sections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: text().notNull(),
	label: text().notNull(),
	description: text(),
	payload: jsonb().default([]).notNull(),
	sort_order: integer().default(0).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("site_sections_key_key").on(table.key),
	check("site_sections_payload_is_array", sql`jsonb_typeof(payload) = 'array'::text`),
]);

export const immersive_stops = pgTable("immersive_stops", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	scene: text().default('kangla-fort').notNull(),
	slug: text().notNull(),
	name: text().notNull(),
	short_name: text().notNull(),
	subtitle: text().notNull(),
	image: text().notNull(),
	alt: text().notNull(),
	description: text().notNull(),
	look_for: text().notNull(),
	reconstruction: text().notNull(),
	camera: jsonb().notNull(),
	target: jsonb().notNull(),
	sort_order: integer().default(0).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("immersive_stops_scene_slug_key").on(table.scene, table.slug),
]);

export const immersive_sources = pgTable("immersive_sources", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	scene: text().default('kangla-fort').notNull(),
	title: text().notNull(),
	href: text().notNull(),
	note: text().notNull(),
	sort_order: integer().default(0).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("immersive_sources_scene_title_key").on(table.scene, table.title),
]);

export const saved_items = pgTable("saved_items", {
	user_id: uuid().notNull(),
	kind: text().notNull(),
	slug: text().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [profiles.id],
			name: "saved_items_user_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.user_id, table.kind, table.slug], name: "saved_items_pkey"}),
]);
