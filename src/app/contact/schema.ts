import { z } from "zod";

export const ENQUIRY_TYPES = [
  { value: "trip", label: "Planning a trip" },
  { value: "hosting", label: "Hosting: homestay, experience or guiding" },
  { value: "partnership", label: "Partnership or collaboration" },
  { value: "correction", label: "A correction to something on the site" },
  { value: "accessibility", label: "Accessibility issue" },
  { value: "press", label: "Press" },
  { value: "other", label: "Something else" },
] as const;

export type EnquiryType = (typeof ENQUIRY_TYPES)[number]["value"];

const enquiryValues = ENQUIRY_TYPES.map((t) => t.value) as [EnquiryType, ...EnquiryType[]];

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please tell us your name (at least 2 characters).")
    .max(80, "That name is longer than we can store: 80 characters maximum."),
  email: z.email("That does not look like an email address we could reply to."),
  enquiryType: z.enum(enquiryValues, {
    message: "Choose the option that fits best.",
  }),
  subject: z
    .string()
    .trim()
    .min(4, "A short subject helps us route your message.")
    .max(120, "Please keep the subject under 120 characters."),
  message: z
    .string()
    .trim()
    .min(20, "Please give us a little more detail: at least 20 characters.")
    .max(4000, "That is longer than 4000 characters. Send the essentials and we will follow up."),
});

export type ContactInput = z.infer<typeof contactSchema>;

export interface ContactActionResult {
  ok: boolean;
  message: string;
  /** Field-level problems, keyed by form field, when server validation fails. */
  fieldErrors?: Partial<Record<keyof ContactInput, string>>;
}
