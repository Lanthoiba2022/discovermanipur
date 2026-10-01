"use server";

import { headers } from "next/headers";

import { isBrevoConfigured, sendEmail } from "@/lib/email/brevo";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";

import { contactSchema, ENQUIRY_TYPES, type ContactActionResult, type ContactInput } from "./schema";

/**
 * Bot traps the form sends alongside its fields. `website` is a honeypot input
 * hidden from people, so only a bot fills it; `startedAt` is `Date.now()` when
 * the form mounted, and nobody types a real enquiry in under a few seconds.
 */
export interface ContactBotFields {
  website?: string;
  startedAt?: number;
}

const MIN_FILL_MS = 3_000;
const RATE = { limit: 5, windowMs: 10 * 60_000 };
const RATE_DAILY = { limit: 20, windowMs: 24 * 60 * 60_000 };

const RECEIVED: ContactActionResult = {
  ok: true,
  message: "We usually reply within a few working days.",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Handles a contact-form submission and emails it to `CONTACT_INBOX_EMAIL`
 * through Brevo, with Reply-To set to the sender.
 *
 * A Server Action is a public endpoint, so everything is checked again here:
 * the client-side zod pass is a convenience, not a guarantee. A tripped bot
 * trap gets the same success answer as a real message, so a bot learns
 * nothing from the response.
 */
export async function submitContactForm(
  input: ContactInput & ContactBotFields,
): Promise<ContactActionResult> {
  const ip = clientIp(await headers());
  for (const [bucket, rule] of [["contact", RATE], ["contact-day", RATE_DAILY]] as const) {
    if (!rateLimit(bucket, ip, rule).ok) {
      return { ok: false, message: "You have sent several messages already. Try again later." };
    }
  }

  if (!input || typeof input !== "object") {
    return { ok: false, message: "Some of the details need another look." };
  }

  const { website, startedAt } = input;
  if (typeof website === "string" && website.trim() !== "") return RECEIVED;
  if (typeof startedAt === "number" && Date.now() - startedAt < MIN_FILL_MS) return RECEIVED;

  const parsed = contactSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: ContactActionResult["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !(key in fieldErrors)) {
        fieldErrors[key as keyof ContactInput] = issue.message;
      }
    }
    return {
      ok: false,
      message: "Some of the details need another look.",
      fieldErrors,
    };
  }

  const enquiry = parsed.data;
  const inbox = process.env.CONTACT_INBOX_EMAIL?.trim();
  if (!inbox || !isBrevoConfigured()) {
    return {
      ok: true,
      message:
        "Message received. No mail provider is connected to the contact form yet, so nothing has been sent. Please reach us on the community Discord or a GitHub issue instead.",
    };
  }

  const type = ENQUIRY_TYPES.find((t) => t.value === enquiry.enquiryType)?.label ?? enquiry.enquiryType;
  const text = [
    `From: ${enquiry.name} <${enquiry.email}>`,
    `Type: ${type}`,
    `Subject: ${enquiry.subject}`,
    "",
    enquiry.message,
  ].join("\n");

  try {
    await sendEmail({
      to: inbox,
      replyTo: { email: enquiry.email, name: enquiry.name },
      subject: `[Contact · ${type}] ${enquiry.subject}`,
      text,
      html: `<pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(text)}</pre>`,
    });
  } catch (err) {
    console.error("[contact] delivery failed:", (err as Error).message);
    return { ok: false, message: "We could not send your message just now. Try again in a moment." };
  }

  return RECEIVED;
}
