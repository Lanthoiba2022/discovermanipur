"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Users } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR } from "@/lib/utils";
import type { Experience } from "@/types";

function today() {
  return new Date().toISOString().slice(0, 10);
}

const makeSchema = (maxGuests: number) =>
  z.object({
    date: z
      .string()
      .min(1, "Pick a date for your session")
      .refine((value) => value >= today(), "Pick a date in the future"),
    guests: z
      .number({ error: "Enter the number of guests" })
      .int("Guests must be a whole number")
      .min(1, "At least one guest")
      .max(maxGuests, `This host takes up to ${maxGuests} guests`),
    name: z.string().trim().min(2, "Tell the host your name"),
    email: z.email("Enter a valid email address"),
  });

type BookingValues = {
  date: string;
  guests: number;
  name: string;
  email: string;
};

export function ExperienceBookingPanel({ experience }: { experience: Experience }) {
  const schema = makeSchema(experience.groupSizeMax);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: "", guests: 1, name: "", email: "" },
    mode: "onBlur",
  });

  const guests = Number(useWatch({ control, name: "guests" })) || 0;
  const subtotal = experience.pricePerPerson * Math.max(0, guests);
  const fees = Math.round(subtotal * 0.05);

  async function onSubmit(values: BookingValues) {
    // No backend yet — nothing is sent or stored, and the toast says so.
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast.success("Thanks — one more step", {
      description: `Online requests aren't connected yet, so this wasn't sent. To book ${experience.title} for ${values.guests} guest${values.guests === 1 ? "" : "s"} on ${values.date}, please contact ${experience.host} directly.`,
    });
    reset({ date: "", guests: 1, name: "", email: "" });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-labelledby="booking-heading"
      className="flex flex-col gap-5 rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-md)]"
    >
      <div>
        <h2 id="booking-heading" className="font-display text-2xl">
          {formatINR(experience.pricePerPerson)}
          <span className="text-base text-muted-foreground"> / person</span>
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-4" aria-hidden="true" />
          Up to {experience.groupSizeMax} guests per session
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="exp-date">Date</Label>
          <Input
            id="exp-date"
            type="date"
            min={today()}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={errors.date ? "exp-date-error" : undefined}
            {...register("date")}
          />
          {errors.date && (
            <p id="exp-date-error" role="alert" className="text-sm text-destructive">
              {errors.date.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="exp-guests">Guests</Label>
          <Input
            id="exp-guests"
            type="number"
            inputMode="numeric"
            min={1}
            max={experience.groupSizeMax}
            aria-invalid={Boolean(errors.guests)}
            aria-describedby={errors.guests ? "exp-guests-error" : undefined}
            {...register("guests", { valueAsNumber: true })}
          />
          {errors.guests && (
            <p id="exp-guests-error" role="alert" className="text-sm text-destructive">
              {errors.guests.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="exp-name">Your name</Label>
        <Input
          id="exp-name"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "exp-name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id="exp-name-error" role="alert" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="exp-email">Email</Label>
        <Input
          id="exp-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "exp-email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="exp-email-error" role="alert" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">
            {formatINR(experience.pricePerPerson)} × {Math.max(0, guests)} guest
            {guests === 1 ? "" : "s"}
          </dt>
          <dd>{formatINR(subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Discover Manipur service fee</dt>
          <dd>{formatINR(fees)}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2 text-base font-medium">
          <dt>Total</dt>
          <dd className="font-display text-xl">{formatINR(subtotal + fees)}</dd>
        </div>
      </dl>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
        {isSubmitting ? "One moment…" : "Request to book"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        You will not be charged. Online requests are not connected yet, so please contact the host
        directly to book.
      </p>
    </form>
  );
}
