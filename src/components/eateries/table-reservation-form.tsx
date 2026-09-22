"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Eatery } from "@/types";

function today() {
  return new Date().toISOString().slice(0, 10);
}

const schema = z.object({
  date: z
    .string()
    .min(1, "Pick a date")
    .refine((value) => value >= today(), "Pick today or a later date"),
  time: z.string().min(1, "Pick a time"),
  partySize: z
    .number({ error: "How many people are coming?" })
    .int("Use a whole number")
    .min(1, "At least one guest")
    .max(30, "For parties over 30, call the restaurant directly"),
  name: z.string().trim().min(2, "Enter the name for the booking"),
  phone: z
    .string()
    .trim()
    .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
});

type ReservationValues = z.infer<typeof schema>;

export function TableReservationForm({ eatery }: { eatery: Eatery }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReservationValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: "", time: "", partySize: 2, name: "", phone: "" },
    mode: "onBlur",
  });

  async function onSubmit(values: ReservationValues) {
    // No backend yet — the request is acknowledged locally.
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast.success("Table request sent", {
      description: `${eatery.name} · ${values.partySize} guest${
        values.partySize === 1 ? "" : "s"
      } on ${values.date} at ${values.time}. You will get a confirmation call.`,
    });
    reset({ date: "", time: "", partySize: 2, name: "", phone: "" });
  }

  if (!eatery.acceptsReservations) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface-sunken p-6">
        <h2 className="font-display text-2xl">Walk in</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {eatery.name} does not take table reservations. Arrive early for lunch — the good dishes
          run out first.
        </p>
        {eatery.phone && (
          <p className="mt-4 text-sm">
            Questions?{" "}
            <a className="text-primary underline underline-offset-4" href={`tel:${eatery.phone}`}>
              {eatery.phone}
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-labelledby="reserve-heading"
      className="flex flex-col gap-5 rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-md)]"
    >
      <div>
        <h2 id="reserve-heading" className="font-display text-2xl">
          Reserve a table
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{eatery.timings}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="res-date">Date</Label>
          <Input
            id="res-date"
            type="date"
            min={today()}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={errors.date ? "res-date-error" : undefined}
            {...register("date")}
          />
          {errors.date && (
            <p id="res-date-error" role="alert" className="text-sm text-destructive">
              {errors.date.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="res-time">Time</Label>
          <Input
            id="res-time"
            type="time"
            aria-invalid={Boolean(errors.time)}
            aria-describedby={errors.time ? "res-time-error" : undefined}
            {...register("time")}
          />
          {errors.time && (
            <p id="res-time-error" role="alert" className="text-sm text-destructive">
              {errors.time.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="res-party">Party size</Label>
        <Input
          id="res-party"
          type="number"
          inputMode="numeric"
          min={1}
          max={30}
          aria-invalid={Boolean(errors.partySize)}
          aria-describedby={errors.partySize ? "res-party-error" : undefined}
          {...register("partySize", { valueAsNumber: true })}
        />
        {errors.partySize && (
          <p id="res-party-error" role="alert" className="text-sm text-destructive">
            {errors.partySize.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="res-name">Name</Label>
        <Input
          id="res-name"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "res-name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id="res-name-error" role="alert" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="res-phone">Phone</Label>
        <Input
          id="res-phone"
          type="tel"
          autoComplete="tel"
          placeholder="98xxxxxxxx"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "res-phone-error" : undefined}
          {...register("phone")}
        />
        {errors.phone && (
          <p id="res-phone-error" role="alert" className="text-sm text-destructive">
            {errors.phone.message}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
        {isSubmitting ? "Sending…" : "Request table"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Requests are confirmed by the restaurant, usually within a couple of hours.
      </p>
    </form>
  );
}
