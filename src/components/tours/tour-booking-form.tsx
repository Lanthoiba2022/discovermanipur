"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Minus, Plus } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatINR } from "@/lib/utils";
import type { Tour } from "@/types";

import { formatDeparture, upcomingDepartures } from "./tour-filters";

const makeSchema = (maxGroup: number) =>
  z.object({
    departure: z.string().min(1, "Choose a departure date"),
    travellers: z
      .number({ error: "How many travellers?" })
      .int("Use a whole number")
      .min(1, "At least one traveller")
      .max(maxGroup, `This departure takes up to ${maxGroup} travellers`),
    name: z.string().trim().min(2, "Enter your full name"),
    email: z.email("Enter a valid email address"),
    phone: z
      .string()
      .trim()
      .regex(/^(\+\d{1,3}[\s-]?)?\d{7,12}$/, "Enter a valid phone number"),
  });

type TourBookingValues = {
  departure: string;
  travellers: number;
  name: string;
  email: string;
  phone: string;
};

export function TourBookingForm({ tour }: { tour: Tour }) {
  const departures = upcomingDepartures(tour.departureDates);
  const maxGroup = Math.max(1, tour.groupSizeMax);
  const schema = makeSchema(maxGroup);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TourBookingValues>({
    resolver: zodResolver(schema),
    defaultValues: { departure: departures[0] ?? "", travellers: 2, name: "", email: "", phone: "" },
    mode: "onBlur",
  });

  const travellers = Number(useWatch({ control, name: "travellers" })) || 0;
  const selected = useWatch({ control, name: "departure" });
  const subtotal = tour.pricePerPerson * Math.max(0, travellers);
  const groupDiscount = travellers >= 4 ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal - groupDiscount;

  function step(delta: number) {
    const next = Math.min(maxGroup, Math.max(1, (Number(travellers) || 0) + delta));
    setValue("travellers", next, { shouldValidate: true });
  }

  async function onSubmit(values: TourBookingValues) {
    // No backend yet: nothing is sent or stored, and the toast says so.
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast.success("Thanks, one more step", {
      description: `Online enquiries aren't connected yet, so this wasn't sent. To book ${tour.title} for ${values.travellers} traveller${
        values.travellers === 1 ? "" : "s"
      } departing ${formatDeparture(values.departure)}, please contact the tour operator directly.`,
    });
    reset({ departure: departures[0] ?? "", travellers: 2, name: "", email: "", phone: "" });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-labelledby="tour-booking-heading"
      className="flex flex-col gap-5 rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-md)]"
    >
      <div>
        <h2 id="tour-booking-heading" className="font-display text-2xl">
          {formatINR(tour.pricePerPerson)}
          <span className="text-base text-muted-foreground"> / person</span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {tour.durationDays} days · up to {maxGroup} travellers
        </p>
      </div>

      <Controller
        control={control}
        name="departure"
        render={({ field }) => (
          <fieldset>
            <legend className="mb-3 text-sm font-medium">Departure date</legend>
            {departures.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {departures.map((date) => (
                  <button
                    key={date}
                    type="button"
                    aria-pressed={selected === date}
                    onClick={() => field.onChange(date)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-colors duration-200",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      selected === date
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border-strong bg-surface hover:bg-muted",
                    )}
                  >
                    {formatDeparture(date)}
                  </button>
                ))}
              </div>
            ) : (
              <Input
                type="date"
                aria-label="Preferred departure date"
                min={new Date().toISOString().slice(0, 10)}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
            {errors.departure && (
              <p role="alert" className="mt-2 text-sm text-destructive">
                {errors.departure.message}
              </p>
            )}
          </fieldset>
        )}
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="tour-travellers">Travellers</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Remove a traveller"
            onClick={() => step(-1)}
          >
            <Minus aria-hidden="true" />
          </Button>
          <Input
            id="tour-travellers"
            type="number"
            inputMode="numeric"
            min={1}
            max={maxGroup}
            className="text-center"
            aria-invalid={Boolean(errors.travellers)}
            aria-describedby={errors.travellers ? "tour-travellers-error" : undefined}
            {...register("travellers", { valueAsNumber: true })}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Add a traveller"
            onClick={() => step(1)}
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
        {errors.travellers && (
          <p id="tour-travellers-error" role="alert" className="text-sm text-destructive">
            {errors.travellers.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tour-name">Full name</Label>
        <Input
          id="tour-name"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "tour-name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id="tour-name-error" role="alert" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tour-email">Email</Label>
        <Input
          id="tour-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "tour-email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="tour-email-error" role="alert" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tour-phone">Phone</Label>
        <Input
          id="tour-phone"
          type="tel"
          autoComplete="tel"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "tour-phone-error" : undefined}
          {...register("phone")}
        />
        {errors.phone && (
          <p id="tour-phone-error" role="alert" className="text-sm text-destructive">
            {errors.phone.message}
          </p>
        )}
      </div>

      <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">
            {formatINR(tour.pricePerPerson)} × {Math.max(0, travellers)} traveller
            {travellers === 1 ? "" : "s"}
          </dt>
          <dd>{formatINR(subtotal)}</dd>
        </div>
        {groupDiscount > 0 && (
          <div className="flex items-center justify-between text-success">
            <dt>Group of four or more (5% off)</dt>
            <dd>−{formatINR(groupDiscount)}</dd>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border pt-2 text-base font-medium">
          <dt>Total</dt>
          <dd className="font-display text-xl">{formatINR(total)}</dd>
        </div>
      </dl>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
        {isSubmitting ? "One moment…" : "Request a place"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        No payment is taken. Online enquiries are not connected yet, so no place is held. Please
        contact the tour operator directly to book.
      </p>
    </form>
  );
}
