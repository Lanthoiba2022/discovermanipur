import { relations } from "drizzle-orm/relations";
import { neonAuthUser } from "./neon-auth";
import { profiles, homestays, experiences, bookings, host_applications, saved_itineraries, crafts, faq_groups, faq_items, saved_items } from "./schema";

export const profilesRelations = relations(profiles, ({one, many}) => ({
	neonAuthUser: one(neonAuthUser, {
		fields: [profiles.id],
		references: [neonAuthUser.id]
	}),
	homestays: many(homestays),
	experiences: many(experiences),
	bookings: many(bookings),
	host_applications: many(host_applications),
	saved_itineraries: many(saved_itineraries),
	crafts: many(crafts),
	saved_items: many(saved_items),
}));

export const neonAuthUserRelations = relations(neonAuthUser, ({many}) => ({
	profiles: many(profiles),
}));

export const homestaysRelations = relations(homestays, ({one}) => ({
	profile: one(profiles, {
		fields: [homestays.host_id],
		references: [profiles.id]
	}),
}));

export const experiencesRelations = relations(experiences, ({one}) => ({
	profile: one(profiles, {
		fields: [experiences.host_id],
		references: [profiles.id]
	}),
}));

export const bookingsRelations = relations(bookings, ({one}) => ({
	profile: one(profiles, {
		fields: [bookings.user_id],
		references: [profiles.id]
	}),
}));

export const host_applicationsRelations = relations(host_applications, ({one}) => ({
	profile: one(profiles, {
		fields: [host_applications.user_id],
		references: [profiles.id]
	}),
}));

export const saved_itinerariesRelations = relations(saved_itineraries, ({one}) => ({
	profile: one(profiles, {
		fields: [saved_itineraries.user_id],
		references: [profiles.id]
	}),
}));

export const craftsRelations = relations(crafts, ({one}) => ({
	profile: one(profiles, {
		fields: [crafts.maker_id],
		references: [profiles.id]
	}),
}));

export const faq_itemsRelations = relations(faq_items, ({one}) => ({
	faq_group: one(faq_groups, {
		fields: [faq_items.group_id],
		references: [faq_groups.id]
	}),
}));

export const faq_groupsRelations = relations(faq_groups, ({many}) => ({
	faq_items: many(faq_items),
}));

export const saved_itemsRelations = relations(saved_items, ({one}) => ({
	profile: one(profiles, {
		fields: [saved_items.user_id],
		references: [profiles.id]
	}),
}));