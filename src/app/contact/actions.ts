"use server";

import { contactSchema, type ContactActionResult, type ContactInput } from "./schema";

/**
 * Handles a contact-form submission.
 *
 * Validation runs on the client (react-hook-form + zod) and again here, because
 * a server action is a public endpoint and the client check is a convenience,
 * not a guarantee.
 */
export async function submitContactForm(input: ContactInput): Promise<ContactActionResult> {
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

  // ---------------------------------------------------------------------
  // TODO(send): this is the single send point. Wire a mail provider here
  // (Resend / SES / Postmark) or persist to the database, e.g.
  //
  //   await resend.emails.send({
  //     from: "Manipur Tourism <hello@example.com>",
  //     to: "hello@example.com",
  //     replyTo: enquiry.email,
  //     subject: `[${enquiry.enquiryType}] ${enquiry.subject}`,
  //     text: enquiry.message,
  //   });
  //
  // Nothing is dispatched today: this is a demonstration site with no mail
  // provider configured, and we do not want to imply a message was delivered
  // when it was not. The copy shown to the user says so.
  // ---------------------------------------------------------------------
  void enquiry;

  return {
    ok: true,
    message:
      "Message received. No mail provider is connected to this prototype yet, so nothing has been dispatched — but the form, the validation and the server action are all real.",
  };
}
