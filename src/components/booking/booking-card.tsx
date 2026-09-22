"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { CalendarDays, CircleAlert, CircleCheck, Loader2, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";

import { GuestStepper } from "@/components/booking/guest-stepper";
import { PriceBreakdown } from "@/components/booking/price-breakdown";
import { StayDatePicker, type DateRange } from "@/components/booking/stay-date-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import {
  createBooking,
  quoteStay,
  stayBookingSchema,
  toISODate,
  type StayBookingValues,
} from "@/lib/booking";
import { formatINR } from "@/lib/utils";
import type { Homestay } from "@/types";

export function BookingCard({ homestay }: { homestay: Homestay }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, demo, isAuthenticated } = useAuth();

  const [review, setReview] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<StayBookingValues>({
    resolver: zodResolver(stayBookingSchema),
    mode: "onSubmit",
    defaultValues: { guests: 1, note: "" },
  });

  const checkIn = form.watch("checkIn");
  const checkOut = form.watch("checkOut");
  const guests = form.watch("guests");
  const errors = form.formState.errors;

  const quote = useMemo(
    () => quoteStay({ pricePerNight: homestay.pricePerNight, from: checkIn, to: checkOut }),
    [homestay.pricePerNight, checkIn, checkOut],
  );

  const range: DateRange | undefined = checkIn ? { from: checkIn, to: checkOut } : undefined;

  const onRangeChange = (next: DateRange | undefined) => {
    form.setValue("checkIn", next?.from, { shouldValidate: form.formState.isSubmitted });
    form.setValue("checkOut", next?.to, { shouldValidate: form.formState.isSubmitted });
  };

  const blockedReason = !checkIn
    ? "Choose your dates to see the total"
    : !checkOut
      ? "Choose a check-out date"
      : quote.nights < 1
        ? "Stays must be at least one night"
        : null;

  const openReview = form.handleSubmit(() => {
    if (!isAuthenticated) {
      router.push(`/auth?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setReview(true);
  });

  const confirm = async () => {
    if (!user || !checkIn || !checkOut) return;
    setSubmitting(true);
    try {
      const booking = await createBooking({
        kind: "homestay",
        refId: homestay.slug,
        refTitle: homestay.title,
        userId: user.id,
        startDate: toISODate(checkIn),
        endDate: toISODate(checkOut),
        guests,
        totalPrice: quote.total,
      });
      setReview(false);
      setConfirmed(booking.id);
      toast.success("Request sent to your host", {
        description: `${homestay.title} · ${format(checkIn, "d MMM")} – ${format(checkOut, "d MMM yyyy")}`,
      });
    } catch {
      toast.error("We could not save that request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <aside className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-md)]">
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-success/12 text-success">
          <CircleCheck className="size-6" aria-hidden="true" />
        </span>
        <h2 className="font-display text-xl">Request sent</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {homestay.hostName || "Your host"} has {quote.nights}{" "}
          {quote.nights === 1 ? "night" : "nights"} for {guests}{" "}
          {guests === 1 ? "guest" : "guests"} to confirm. You have not been charged.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild variant="primary" className="w-full">
            <Link href="/account/bookings">View my bookings</Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setConfirmed(null);
              form.reset({ guests: 1, note: "" });
            }}
          >
            Book another stay
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-md)] md:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p>
          <span className="font-display text-2xl font-medium">
            {formatINR(homestay.pricePerNight)}
          </span>
          <span className="text-sm text-muted-foreground"> / night</span>
        </p>
        {homestay.reviewCount > 0 && (
          <p className="flex items-center gap-1 text-sm">
            <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
            <span className="font-medium">{homestay.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({homestay.reviewCount})</span>
          </p>
        )}
      </div>

      <form onSubmit={openReview} className="mt-5 space-y-4" noValidate>
        <fieldset>
          <legend className="mb-2 flex items-center gap-2 text-sm font-medium">
            <CalendarDays className="size-4" aria-hidden="true" />
            Your dates
          </legend>

          <div className="rounded-[var(--radius)] border border-border p-2">
            <StayDatePicker value={range} onChange={onRangeChange} />
          </div>

          <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
            {checkIn && checkOut
              ? `${format(checkIn, "EEE d MMM yyyy")} → ${format(checkOut, "EEE d MMM yyyy")}`
              : checkIn
                ? `${format(checkIn, "EEE d MMM yyyy")} → pick a check-out date`
                : "Select a check-in date to begin"}
          </p>

          {(errors.checkIn || errors.checkOut) && (
            <p role="alert" className="mt-2 flex items-center gap-2 text-sm text-destructive">
              <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
              {errors.checkIn?.message ?? errors.checkOut?.message}
            </p>
          )}
        </fieldset>

        <GuestStepper
          value={guests}
          max={Math.max(1, homestay.maxGuests)}
          onChange={(n) => form.setValue("guests", n, { shouldValidate: true })}
        />

        <div>
          <Label htmlFor="booking-note" className="mb-2 block">
            Note for your host{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="booking-note"
            rows={3}
            placeholder="Arriving late from Imphal airport, travelling with a toddler…"
            aria-invalid={Boolean(errors.note)}
            {...form.register("note")}
          />
          {errors.note && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {errors.note.message}
            </p>
          )}
        </div>

        <PriceBreakdown quote={quote} />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={Boolean(blockedReason) || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Checking your session…
            </>
          ) : isAuthenticated ? (
            "Review and request"
          ) : (
            "Sign in to request"
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground" aria-live="polite">
          {blockedReason ?? "You will not be charged yet — your host confirms first."}
        </p>

        {demo && (
          <p className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-muted px-3 py-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Demo mode — requests are stored in this browser only until the booking backend is
            connected.
          </p>
        )}
      </form>

      <Dialog open={review} onOpenChange={setReview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm your request</DialogTitle>
            <DialogDescription>
              One last look before it reaches {homestay.hostName || "your host"}.
            </DialogDescription>
          </DialogHeader>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Stay</dt>
              <dd className="text-right font-medium">{homestay.title}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Dates</dt>
              <dd className="text-right">
                {checkIn && checkOut
                  ? `${format(checkIn, "d MMM")} – ${format(checkOut, "d MMM yyyy")}`
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Guests</dt>
              <dd className="text-right">{guests}</dd>
            </div>
          </dl>

          <div className="mt-4">
            <PriceBreakdown quote={quote} />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setReview(false)} disabled={submitting}>
              Back
            </Button>
            <Button onClick={confirm} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Sending…
                </>
              ) : (
                "Confirm request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
