/**
 * Host applications in `public.host_applications`: reads for the applicant's
 * status panel and the admin queue, plus the pure helpers the Server Actions
 * in `./application-actions` use.
 *
 * Not a `"use server"` module: every export of one becomes a public endpoint,
 * and these reads take a user id the caller has already resolved from the
 * session.
 */

import { desc, eq } from "drizzle-orm";

import type { ApplicationStatus, District, HostType } from "@/types";

import { isAuthConfigured } from "@/lib/auth/env";
import { getDb, isDatabaseConfigured, schema } from "@/lib/db";
import { referenceFor, type ApplicationValues } from "./application-schema";

/**
 * Applications are only kept when there is both a database to hold them and a
 * sign-in to tie them to a person. Otherwise the wizard works locally and
 * sends nothing.
 */
export const applicationsAreLive = isDatabaseConfigured && isAuthConfigured;

/*
 * The table has no columns for capacity, the applicant's name or phone, so the
 * Server Action appends them to the stored description under this marker and
 * the readers split them back out. The last marker wins, which is always the
 * one the server wrote, so text typed into the description cannot spoof it.
 */
const DETAILS_MARK = "\n\n[application details]\n";

type PackedDetails = Pick<ApplicationValues, "capacity" | "applicantName" | "phone">;

export function packDescription(description: string, details: PackedDetails) {
  const line = (v: string) => v.replace(/\s+/g, " ").trim();
  return (
    description +
    DETAILS_MARK +
    [
      `Guests at once: ${details.capacity}`,
      `Name: ${line(details.applicantName)}`,
      `Phone: ${line(details.phone)}`,
    ].join("\n")
  );
}

export function unpackDescription(stored: string): {
  description: string;
  capacity?: number;
  applicantName?: string;
  phone?: string;
} {
  const at = stored.lastIndexOf(DETAILS_MARK);
  if (at === -1) return { description: stored };
  const fields = new Map<string, string>();
  for (const row of stored.slice(at + DETAILS_MARK.length).split("\n")) {
    const colon = row.indexOf(":");
    if (colon > 0) fields.set(row.slice(0, colon), row.slice(colon + 1).trim());
  }
  const capacity = Number(fields.get("Guests at once"));
  return {
    description: stored.slice(0, at),
    capacity: Number.isInteger(capacity) && capacity > 0 ? capacity : undefined,
    applicantName: fields.get("Name") || undefined,
    phone: fields.get("Phone") || undefined,
  };
}

/** What the applicant sees about their own latest application. */
export interface ApplicantStatus {
  reference: string;
  status: ApplicationStatus;
  hostType: HostType;
  propertyName: string;
  createdAt: string;
  updatedAt: string;
  /** Only on a rejection: approval notes are the reviewer's own record. */
  reviewerNote?: string;
}

/** The signed-in user's most recent application, or `null` if none (or no database). */
export async function getLatestApplication(userId: string): Promise<ApplicantStatus | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(schema.host_applications)
    .where(eq(schema.host_applications.user_id, userId))
    .orderBy(desc(schema.host_applications.created_at))
    .limit(1);
  if (!row) return null;
  return {
    reference: referenceFor(row.id, row.created_at),
    status: row.status,
    hostType: row.host_type,
    propertyName: row.property_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewerNote: row.status === "rejected" ? row.admin_notes ?? undefined : undefined,
  };
}

/** One row of the admin review queue. */
export interface ApplicationQueueRow {
  id: string;
  reference: string;
  userId: string;
  applicantName: string;
  email: string;
  phone?: string;
  capacity?: number;
  hostType: HostType;
  propertyName: string;
  propertyAddress: string;
  district: District;
  description: string;
  status: ApplicationStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// The queue is read whole and filtered in the browser; past this it needs paging.
const QUEUE_LIMIT = 500;

/** Every application, newest first, with the applicant's account details. Admin pages only. */
export async function listApplications(): Promise<ApplicationQueueRow[]> {
  const db = getDb();
  if (!db) return [];
  const { host_applications: apps, profiles } = schema;
  const rows = await db
    .select({
      app: apps,
      email: profiles.email,
      firstName: profiles.first_name,
      lastName: profiles.last_name,
      profilePhone: profiles.phone,
    })
    .from(apps)
    .leftJoin(profiles, eq(profiles.id, apps.user_id))
    .orderBy(desc(apps.created_at))
    .limit(QUEUE_LIMIT);

  return rows.map(({ app, email, firstName, lastName, profilePhone }) => {
    const packed = unpackDescription(app.description);
    const profileName = [firstName, lastName].filter(Boolean).join(" ");
    return {
      id: app.id,
      reference: referenceFor(app.id, app.created_at),
      userId: app.user_id,
      applicantName: packed.applicantName || profileName || email?.split("@")[0] || "Unknown",
      email: email ?? "",
      phone: packed.phone ?? profilePhone ?? undefined,
      capacity: packed.capacity,
      hostType: app.host_type,
      propertyName: app.property_name,
      propertyAddress: app.property_address,
      // Written through the zod enum, so it is always a district.
      district: app.district as District,
      description: packed.description,
      status: app.status,
      adminNotes: app.admin_notes ?? undefined,
      createdAt: app.created_at,
      updatedAt: app.updated_at,
    };
  });
}
