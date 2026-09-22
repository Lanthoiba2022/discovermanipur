"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR } from "@/lib/utils";
import type { TransportOption } from "@/types";

function today() {
  return new Date().toISOString().slice(0, 10);
}

const makeSchema = (seats: number) =>
  z.object({
    pickupDate: z
      .string()
      .min(1, "When do you need the vehicle?")
      .refine((value) => value >= today(), "Pick today or a later date"),
    days: z
      .number({ error: "How many days?" })
      .int("Use a whole number")
      .min(1, "At least one day")
      .max(30, "For hires over 30 days, talk to the operator directly"),
    passengers: z
      .number({ error: "How many passengers?" })
      .int("Use a whole number")
      .min(1, "At least one passenger")
      .max(seats, `This vehicle seats ${seats}`),
    pickup: z.string().trim().min(2, "Where should the driver pick you up?"),
    name: z.string().trim().min(2, "Enter your name"),
    phone: z
      .string()
      .trim()
      .regex(/^(\+\d{1,3}[\s-]?)?\d{7,12}$/, "Enter a contact number we can reach you on"),
    notes: z.string().trim().max(500, "Keep notes under 500 characters").optional(),
  });

type EnquiryValues = {
  pickupDate: string;
  days: number;
  passengers: number;
  pickup: string;
  name: string;
  phone: string;
  notes?: string;
};

export function TransportEnquiryForm({ option }: { option: TransportOption }) {
  const seats = Math.max(1, option.seats);
  const schema = makeSchema(seats);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      pickupDate: "",
      days: 1,
      passengers: 2,
      pickup: "",
      name: "",
      phone: "",
      notes: "",
    },
    mode: "onBlur",
  });

  const days = Number(useWatch({ control, name: "days" })) || 0;
  const estimate = option.pricePerDay ? option.pricePerDay * Math.max(0, days) : null;

  async function onSubmit(values: EnquiryValues) {
    // No backend yet — acknowledged locally.
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast.success("Enquiry sent to the operator", {
      description: `${option.name} · ${values.days} day${values.days === 1 ? "" : "s"} from ${
        values.pickupDate
      }, pick-up at ${values.pickup}. ${option.operator} will call you back.`,
    });
    reset({
      pickupDate: "",
      days: 1,
      passengers: 2,
      pickup: "",
      name: "",
      phone: "",
      notes: "",
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-labelledby="transport-enquiry-heading"
      className="flex flex-col gap-5 rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-md)]"
    >
      <div>
        <h2 id="transport-enquiry-heading" className="font-display text-2xl">
          Booking enquiry
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {option.pricePerDay
            ? `${formatINR(option.pricePerDay)} per day`
            : option.pricePerKm
              ? `${formatINR(option.pricePerKm)} per km`
              : "Pricing confirmed by the operator"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tr-date">Pick-up date</Label>
          <Input
            id="tr-date"
            type="date"
            min={today()}
            aria-invalid={Boolean(errors.pickupDate)}
            aria-describedby={errors.pickupDate ? "tr-date-error" : undefined}
            {...register("pickupDate")}
          />
          {errors.pickupDate && (
            <p id="tr-date-error" role="alert" className="text-sm text-destructive">
              {errors.pickupDate.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="tr-days">Days</Label>
          <Input
            id="tr-days"
            type="number"
            inputMode="numeric"
            min={1}
            max={30}
            aria-invalid={Boolean(errors.days)}
            aria-describedby={errors.days ? "tr-days-error" : undefined}
            {...register("days", { valueAsNumber: true })}
          />
          {errors.days && (
            <p id="tr-days-error" role="alert" className="text-sm text-destructive">
              {errors.days.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tr-passengers">Passengers</Label>
        <Input
          id="tr-passengers"
          type="number"
          inputMode="numeric"
          min={1}
          max={seats}
          aria-invalid={Boolean(errors.passengers)}
          aria-describedby={errors.passengers ? "tr-passengers-error" : undefined}
          {...register("passengers", { valueAsNumber: true })}
        />
        {errors.passengers && (
          <p id="tr-passengers-error" role="alert" className="text-sm text-destructive">
            {errors.passengers.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tr-pickup">Pick-up point</Label>
        <Input
          id="tr-pickup"
          placeholder="Imphal airport, hotel name, Ukhrul town…"
          aria-invalid={Boolean(errors.pickup)}
          aria-describedby={errors.pickup ? "tr-pickup-error" : undefined}
          {...register("pickup")}
        />
        {errors.pickup && (
          <p id="tr-pickup-error" role="alert" className="text-sm text-destructive">
            {errors.pickup.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tr-name">Your name</Label>
        <Input
          id="tr-name"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "tr-name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id="tr-name-error" role="alert" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tr-phone">Phone</Label>
        <Input
          id="tr-phone"
          type="tel"
          autoComplete="tel"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "tr-phone-error" : undefined}
          {...register("phone")}
        />
        {errors.phone && (
          <p id="tr-phone-error" role="alert" className="text-sm text-destructive">
            {errors.phone.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tr-notes">Anything else? (optional)</Label>
        <Textarea
          id="tr-notes"
          rows={3}
          placeholder="Route you have in mind, luggage, early start…"
          aria-invalid={Boolean(errors.notes)}
          {...register("notes")}
        />
        {errors.notes && (
          <p role="alert" className="text-sm text-destructive">
            {errors.notes.message}
          </p>
        )}
      </div>

      {estimate !== null && (
        <dl className="flex items-center justify-between border-t border-border pt-4 text-sm">
          <dt className="text-muted-foreground">
            Estimate · {Math.max(0, days)} day{days === 1 ? "" : "s"}
          </dt>
          <dd className="font-display text-xl">{formatINR(estimate)}</dd>
        </dl>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
        {isSubmitting ? "Sending…" : "Send enquiry"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Fuel, tolls and driver allowance vary by route — the operator confirms a final quote.
      </p>
    </form>
  );
}
