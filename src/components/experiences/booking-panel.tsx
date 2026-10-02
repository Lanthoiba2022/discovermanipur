"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, Loader2, Users } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import * as z from "@/lib/zod-mini";
import { IntentLink } from "@/components/shared/intent-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// The hook's own module, not the `@/lib/auth` barrel: the barrel also
// re-exports the sign-in schemas, which would bring classic zod to this page.
import { useAuth } from "@/lib/auth/use-auth";
import {
  BookingError,
  createBooking,
  quoteExperience,
  toISODate,
  useBookingMode,
  type BookingMode,
} from "@/lib/booking";
import { formatINR } from "@/lib/utils";
import type { Experience } from "@/types";

function today() {
  return toISODate(new Date());
}

// `zod/mini` instead of classic `zod`, through @/lib/zod-mini, which also
// registers zod's English messages: classic zod is about 95 KB gzip on each
// page with this form.
const makeSchema = (maxGuests: number) =>
  z.object({
    date: z
      .string()
      .check(
        z.minLength(1, "Pick a date for your session"),
        z.refine((value) => value >= today(), "Pick a date in the future"),
      ),
    guests: z
      .number({ error: "Enter the number of guests" })
      .check(
        z.int("Guests must be a whole number"),
        z.gte(1, "At least one guest"),
        z.lte(maxGuests, `This host takes up to ${maxGuests} guests`),
      ),
  });

type BookingValues = {
  date: string;
  guests: number;
};

function savedCopy(savedTo: BookingMode, host: string) {
  return savedTo === "account"
    ? `It is saved to your account as pending, where Discover Manipur's admins can see it. ${host} is not notified automatically yet. Please contact them directly to book. You have not been charged.`
    : `It is saved in this browser only. Online booking is not connected on this site, so ${host} has not been told. Please contact them directly to book. You have not been charged.`;
}

export function ExperienceBookingPanel({ experience }: { experience: Experience }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuth();
  const mode = useBookingMode();
  const schema = makeSchema(experience.groupSizeMax);
  const [confirmed, setConfirmed] = useState<{ savedTo: BookingMode; total: number } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: "", guests: 1 },
    mode: "onBlur",
  });

  const guests = Number(useWatch({ control, name: "guests" })) || 0;
  const quote = quoteExperience({
    pricePerPerson: experience.pricePerPerson,
    guests: Math.max(0, guests),
  });

  const signIn = () => router.push(`/auth?next=${encodeURIComponent(pathname)}`);

  async function onSubmit(values: BookingValues) {
    if (!isAuthenticated || !user) {
      signIn();
      return;
    }
    try {
      const { booking, savedTo } = await createBooking({
        kind: "experience",
        slug: experience.slug,
        refTitle: experience.title,
        userId: user.id,
        startDate: values.date,
        guests: values.guests,
        totalPrice: quote.total,
      });
      setConfirmed({ savedTo, total: booking.totalPrice });
      toast.success(
        savedTo === "account" ? "Request saved to your account" : "Request saved in this browser",
        { description: `${experience.title} · ${values.date}. It has not been sent to the host.` },
      );
    } catch (err) {
      if (err instanceof BookingError && err.reason === "signed-out") {
        signIn();
        return;
      }
      toast.error(
        err instanceof BookingError ? err.message : "We could not save that request. Please try again.",
      );
    }
  }

  if (confirmed) {
    return (
      <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-md)]">
        <span className="flex size-12 items-center justify-center rounded-full bg-success/12 text-success">
          <CircleCheck className="size-6" aria-hidden="true" />
        </span>
        <h2 className="font-display text-xl">Request saved</h2>
        <p className="text-sm text-muted-foreground">
          {experience.title} for {formatINR(confirmed.total)}.{" "}
          {savedCopy(confirmed.savedTo, experience.host)}
        </p>
        <div className="flex flex-col gap-2">
          <Button asChild variant="primary" className="w-full">
            <IntentLink href="/account/bookings">View my bookings</IntentLink>
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setConfirmed(null);
              reset({ date: "", guests: 1 });
            }}
          >
            Request another date
          </Button>
        </div>
      </div>
    );
  }

  const busy = isLoading || !mode;

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

      <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">
            {formatINR(experience.pricePerPerson)} × {Math.max(0, guests)} guest
            {guests === 1 ? "" : "s"}
          </dt>
          <dd>{formatINR(quote.subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Discover Manipur service fee</dt>
          <dd>{formatINR(quote.adjustment)}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2 text-base font-medium">
          <dt>Total</dt>
          <dd className="font-display text-xl">{formatINR(quote.total)}</dd>
        </div>
      </dl>

      <Button type="submit" size="lg" disabled={isSubmitting || busy} className="w-full">
        {(isSubmitting || busy) && <Loader2 className="animate-spin" aria-hidden="true" />}
        {busy
          ? "Checking your session…"
          : isSubmitting
            ? "Saving…"
            : isAuthenticated
              ? "Request to book"
              : "Sign in to request"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {mode === "account"
          ? "You will not be charged. Requests are saved to your account, where Discover Manipur's admins can see them; the host is not notified automatically yet, so please also contact them directly."
          : mode === "browser"
            ? "You will not be charged. Requests are saved in this browser only. Online booking is not connected on this site, so please contact the host directly to book."
            : "You will not be charged."}
      </p>
    </form>
  );
}
