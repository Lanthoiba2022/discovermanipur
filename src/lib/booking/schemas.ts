import { z } from "zod";

export const stayBookingSchema = z
  .object({
    checkIn: z.date().optional(),
    checkOut: z.date().optional(),
    guests: z.number().int().min(1, "At least one guest"),
    note: z.string().max(300, "Keep your note under 300 characters").optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.checkIn) {
      ctx.addIssue({ code: "custom", path: ["checkIn"], message: "Pick a check-in date" });
    }
    if (!value.checkOut) {
      ctx.addIssue({ code: "custom", path: ["checkOut"], message: "Pick a check-out date" });
    }
    if (value.checkIn && value.checkOut && value.checkOut.getTime() <= value.checkIn.getTime()) {
      ctx.addIssue({
        code: "custom",
        path: ["checkOut"],
        message: "Check-out must be after check-in",
      });
    }
  });

export type StayBookingValues = z.infer<typeof stayBookingSchema>;

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
