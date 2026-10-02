import { z } from "zod";

/**
 * Server-side booking validation, on classic zod.
 *
 * Imported by the booking Server Actions (`./actions`) and, for its type, by
 * `./server`; keep it out of client modules and out of the `@/lib/booking`
 * barrel. Classic zod's entry point brings its whole runtime with every
 * locale (about 95 KB gzip) into any browser bundle that reaches it. The stay
 * form's own client-side schema lives with the form, in
 * `@/components/booking/booking-card`, on `zod/mini`.
 */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "That date does not exist");

/**
 * A booking request as the browser sends it: only what the traveller chooses.
 * The listing is named by slug; its title and the price are looked up and
 * computed on the server, and nothing else the caller sends is read.
 */
export const bookingRequestSchema = z
  .object({
    kind: z.enum(["homestay", "experience", "tour", "transport", "table"]),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(160)
      .regex(/^[\w-]+$/, "Unknown listing"),
    startDate: isoDate,
    endDate: isoDate.optional(),
    guests: z.number().int().min(1, "At least one guest").max(50, "That is a very large group"),
    note: z.string().trim().max(300, "Keep your note under 300 characters").optional(),
  })
  .refine((value) => !value.endDate || value.endDate >= value.startDate, {
    path: ["endDate"],
    message: "The end date must not be before the start date",
  });

export type BookingRequest = z.infer<typeof bookingRequestSchema>;
