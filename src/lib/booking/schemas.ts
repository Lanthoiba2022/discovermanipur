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
