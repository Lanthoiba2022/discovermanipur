import { z } from "zod";

import { DISTRICTS } from "./types";

export const HOST_TYPES = ["homestay", "eatery", "guide", "experience"] as const;

export const applicationSchema = z.object({
  hostType: z.enum(HOST_TYPES),
  propertyName: z
    .string()
    .trim()
    .min(3, "Give your place or service a name of at least 3 characters.")
    .max(80, "Keep the name under 80 characters."),
  propertyAddress: z
    .string()
    .trim()
    .min(10, "A full address helps our district team find you: leikai, landmark and town.")
    .max(200, "Keep the address under 200 characters."),
  district: z.enum(DISTRICTS),
  description: z
    .string()
    .trim()
    .min(60, "Tell guests a little more: at least 60 characters.")
    .max(1200, "Keep it under 1,200 characters."),
  capacity: z
    .number()
    .int("Use a whole number.")
    .min(1, "You need room for at least one guest.")
    .max(200, "For more than 200 guests, talk to us directly."),
  applicantName: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(80, "Keep your name under 80 characters."),
  email: z.email("Enter an email address we can reach you on.").max(254),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{8,17}$/, "Enter a phone number with country or STD code."),
  agree: z.boolean().refine((v) => v === true, {
    message: "Please confirm you have read the hosting standards.",
  }),
});

export type ApplicationValues = z.infer<typeof applicationSchema>;

export const STEPS = [
  { id: "type", label: "Host type", fields: ["hostType"] },
  {
    id: "details",
    label: "Your place",
    fields: ["propertyName", "propertyAddress", "district", "description", "capacity"],
  },
  { id: "contact", label: "Contact & photos", fields: ["applicantName", "email", "phone"] },
  { id: "review", label: "Review", fields: ["agree"] },
] as const satisfies readonly {
  id: string;
  label: string;
  fields: readonly (keyof ApplicationValues)[];
}[];

export const DRAFT_KEY = "mt:host-application-draft:v1";

export const emptyApplication: ApplicationValues = {
  hostType: "homestay",
  propertyName: "",
  propertyAddress: "",
  district: "Imphal West",
  description: "",
  capacity: 2,
  applicantName: "",
  email: "",
  phone: "",
  agree: false,
};

/** A rejection note is shown to the applicant, so it has to say something. */
export const REJECT_NOTE_MIN = 10;
export const ADMIN_NOTE_MAX = 1000;

/**
 * The reference for a stored application, derived from its id so it never
 * needs a column of its own and the review queue shows the same string the
 * applicant was given.
 */
export function referenceFor(id: string, createdAt: string) {
  const year = new Date(createdAt).getFullYear();
  return `YEN-HST-${Number.isFinite(year) ? year : "0000"}-${id.slice(0, 8).toUpperCase()}`;
}

/** A local-only reference, for a site with no database to keep the application. */
export function makeReference(date = new Date()) {
  const serial = Math.floor(1000 + Math.random() * 9000);
  return `YEN-HST-${date.getFullYear()}-${serial}`;
}
