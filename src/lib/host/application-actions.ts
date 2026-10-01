"use server";

/**
 * Server Actions for host applications: submitting one, and an admin approving
 * or rejecting it. Each is a public POST endpoint, so each resolves the caller
 * from the session itself and trusts nothing from the client but the form
 * values (applicant) or an application id and a note (admin).
 */

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import type { ApplicationStatus } from "@/types";

import { getSessionProfile } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";
import {
  ADMIN_NOTE_MAX,
  REJECT_NOTE_MIN,
  applicationSchema,
  referenceFor,
  type ApplicationValues,
} from "./application-schema";
import { applicationsAreLive, packDescription } from "./applications";

export interface SubmitApplicationResult {
  ok: boolean;
  message: string;
  reference?: string;
  /** Signed out: the form should send the visitor to sign in. */
  needsSignIn?: boolean;
  fieldErrors?: Partial<Record<keyof ApplicationValues, string>>;
}

const SUBMIT_RATE = { limit: 5, windowMs: 10 * 60_000 };
const SUBMIT_RATE_USER = { limit: 5, windowMs: 60 * 60_000 };

const FAILED = "We could not send your application just now. Try again in a moment.";

function revalidateApplications() {
  revalidatePath("/host/apply");
  revalidatePath("/admin/applications");
  revalidatePath("/admin");
}

/** Store the signed-in user's application as `pending`. One open application per user. */
export async function submitHostApplication(
  input: ApplicationValues,
): Promise<SubmitApplicationResult> {
  if (!applicationsAreLive) {
    return { ok: false, message: "This copy of the site cannot receive applications." };
  }

  const ip = clientIp(await headers());
  if (!rateLimit("host-apply", ip, SUBMIT_RATE).ok) {
    return { ok: false, message: "You have tried several times already. Try again later." };
  }

  const profile = await getSessionProfile();
  if (!profile) {
    return { ok: false, needsSignIn: true, message: "Sign in to send your application." };
  }
  if (!rateLimit("host-apply-user", profile.id, SUBMIT_RATE_USER).ok) {
    return { ok: false, message: "You have tried several times already. Try again later." };
  }

  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: SubmitApplicationResult["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !(key in fieldErrors)) {
        fieldErrors[key as keyof ApplicationValues] = issue.message;
      }
    }
    return { ok: false, message: "Some of the details need another look.", fieldErrors };
  }
  const values = parsed.data;

  const db = getDb();
  if (!db) return { ok: false, message: FAILED };
  const apps = schema.host_applications;

  try {
    const created = await db.transaction(async (tx) => {
      // Serialises submissions per user, so two at once cannot both see "no
      // open application" and both insert.
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`host_application:${profile.id}`}))`,
      );
      const [open] = await tx
        .select({ id: apps.id })
        .from(apps)
        .where(and(eq(apps.user_id, profile.id), eq(apps.status, "pending")))
        .limit(1);
      if (open) return null;

      const [row] = await tx
        .insert(apps)
        .values({
          user_id: profile.id,
          host_type: values.hostType,
          property_name: values.propertyName,
          property_address: values.propertyAddress,
          district: values.district,
          description: packDescription(values.description, values),
          status: "pending",
        })
        .returning({ id: apps.id, created_at: apps.created_at });
      return row;
    });

    if (!created) {
      return {
        ok: false,
        message:
          "You already have an application waiting for review. You can apply again once it has been decided.",
      };
    }

    revalidateApplications();
    return {
      ok: true,
      message: "Application received.",
      reference: referenceFor(created.id, created.created_at),
    };
  } catch (err) {
    console.error("[host-apply] submit failed:", (err as Error).message);
    return { ok: false, message: FAILED };
  }
}

export interface DecisionResult {
  ok: boolean;
  message: string;
  status?: ApplicationStatus;
  /** Approval moved the applicant from `user` to `host`. */
  roleGranted?: boolean;
}

const decisionSchema = z.object({
  id: z.uuid(),
  note: z.string().trim().max(ADMIN_NOTE_MAX).optional(),
});

async function decide(input: unknown, next: "approved" | "rejected"): Promise<DecisionResult> {
  const admin = await getSessionProfile();
  if (!admin || admin.role !== "admin") {
    return { ok: false, message: "Only an admin can review applications." };
  }

  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "That decision could not be saved." };
  const note = parsed.data.note || null;
  if (next === "rejected" && (note?.length ?? 0) < REJECT_NOTE_MIN) {
    return { ok: false, message: "Add a reason before rejecting." };
  }

  const db = getDb();
  if (!db) return { ok: false, message: "That decision could not be saved." };
  const { host_applications: apps, profiles } = schema;

  try {
    const outcome = await db.transaction(async (tx) => {
      // Only a pending row: a decided application is not re-decided.
      const [row] = await tx
        .update(apps)
        .set({ status: next, admin_notes: note })
        .where(and(eq(apps.id, parsed.data.id), eq(apps.status, "pending")))
        .returning({ userId: apps.user_id });
      if (!row) return null;
      if (next !== "approved") return { roleGranted: false };

      // Promote a plain user only; an admin or an existing host keeps their role.
      const granted = await tx
        .update(profiles)
        .set({ role: "host" })
        .where(and(eq(profiles.id, row.userId), eq(profiles.role, "user")))
        .returning({ id: profiles.id });
      return { roleGranted: granted.length > 0 };
    });

    if (!outcome) {
      return { ok: false, message: "This application has already been decided or no longer exists." };
    }

    revalidateApplications();
    return {
      ok: true,
      message: next === "approved" ? "Application approved." : "Application rejected.",
      status: next,
      roleGranted: outcome.roleGranted,
    };
  } catch (err) {
    console.error(`[host-apply] ${next} failed:`, (err as Error).message);
    return { ok: false, message: "That decision could not be saved. Try again in a moment." };
  }
}

/** Approve a pending application; grants `host` to an applicant whose role is `user`. */
export async function approveHostApplication(input: {
  id: string;
  note?: string;
}): Promise<DecisionResult> {
  return decide(input, "approved");
}

/** Reject a pending application. The note is required and shown to the applicant. */
export async function rejectHostApplication(input: {
  id: string;
  note: string;
}): Promise<DecisionResult> {
  return decide(input, "rejected");
}
