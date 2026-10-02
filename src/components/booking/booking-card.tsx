"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { CalendarDays, CircleAlert, CircleCheck, Loader2, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";

import * as z from "@/lib/zod-mini";
import { IntentLink } from "@/components/shared/intent-link";
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
// The hook's own module, not the `@/lib/auth` barrel: the barrel also
// re-exports the sign-in schemas, which would bring classic zod to this page.
import { useAuth } from "@/lib/auth/use-auth";
import {
  BookingError,
  createBooking,
  quoteStay,
  useBookingMode,
  toISODate,
} from "@/lib/booking";
import { formatINR } from "@/lib/utils";
import type { Homestay } from "@/types";

// `zod/mini` instead of classic `zod`, through @/lib/zod-mini, which also
// registers zod's English messages: classic zod is about 95 KB gzip on each
// page with this form.

/**
 * The stay request form's client-side validation.
 *
 * Written with `zod/mini` rather than classic `zod`: classic zod's entry
 * point re-exports every locale, which costs about 95 KB gzip on each page
 * with this card; the mini build of the same checks is about 7 KB. The rules
 * and messages are the same as before. The server validates the request again
 * on its own (`bookingRequestSchema` in `@/lib/booking/schemas`).
 */
const stayBookingSchema = z
  .object({
    checkIn: z.optional(z.date()),
    checkOut: z.optional(z.date()),
    guests: z.number().check(z.int(), z.gte(1, "At least one guest")),
    note: z.optional(z.string().check(z.maxLength(300, "Keep your note under 300 characters"))),
  })
  .check(
    z.superRefine((value, ctx) => {
      if (!value.checkIn) {
        ctx.addIssue({ code: "custom", path: ["checkIn"], message: "Pick a check-in date" });
      }
      if (!value.checkOut) {
        ctx.addIssue({ code: "custom", path: ["checkOut"], message: "Pick a check-out date" });
      }
      if (
        value.checkIn &&
        value.checkOut &&
        value.checkOut.getTime() <= value.checkIn.getTime()
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["checkOut"],
          message: "Check-out must be after check-in",
        });
      }
    }),
  );

type StayBookingValues = z.infer<typeof stayBookingSchema>;

/**
 * The fields of a stay this card reads, and nothing else.
 *
 * The card is a client component, so whatever the page hands it is
 * serialised into the RSC payload. A whole `Homestay` row carries the
 * description, host story, house rules, sources and Places photo refs, none
 * of which the card shows; naming the fields keeps the payload to what is
 * used, and the compiler flags any field the card starts reading later.
 */
export type BookingCardStay = Pick<
  Homestay,
  "slug" | "title" | "hostName" | "pricePerNight" | "maxGuests" | "rating" | "reviewCount"
>;

/**
 * Most research rows store `price_per_night = 0`, meaning "not known", not
 * "free". Those stays show "Rate on request" and no figures at all: a ₹0
 * total would be untrue. The request flow itself is unchanged (it still saves
 * a request with the dates and guests); whether an unpriced request should be
 * refused or stored without a total is a separate product decision.
 */
function hasNightlyRate(stay: BookingCardStay): boolean {
  return stay.pricePerNight > 0;
}

export function BookingCard({
  homestay,
  anchorDate,
}: {
  homestay: BookingCardStay;
  /** `YYYY-MM-DD` the server takes as today; see `StayDatePicker`. */
  anchorDate: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, demo, isAuthenticated } = useAuth();
  const mode = useBookingMode();
  const host = homestay.hostName || "your host";
  const priced = hasNightlyRate(homestay);

  const [review, setReview] = useState(false);
  const [confirmed, setConfirmed] = useState<{ total: number; savedTo: string } | null>(null);
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
    ? priced
      ? "Choose your dates to see the total"
      : "Choose your dates to request a stay"
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
      const { booking, savedTo } = await createBooking({
        kind: "homestay",
        slug: homestay.slug,
        refTitle: homestay.title,
        userId: user.id,
        startDate: toISODate(checkIn),
        endDate: toISODate(checkOut),
        guests,
        note: form.getValues("note"),
        totalPrice: quote.total,
      });
      setReview(false);
      setConfirmed({ total: booking.totalPrice, savedTo });
      toast.success(
        savedTo === "account" ? "Request saved to your account" : "Request saved in this browser",
        {
          description: `${homestay.title} · ${format(checkIn, "d MMM")} – ${format(checkOut, "d MMM yyyy")}. It has not been sent to your host.`,
        },
      );
    } catch (err) {
      if (err instanceof BookingError && err.reason === "signed-out") {
        router.push(`/auth?next=${encodeURIComponent(pathname)}`);
        return;
      }
      toast.error(
        err instanceof BookingError ? err.message : "We could not save that request. Please try again.",
      );
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
        <h2 className="font-display text-xl">Request saved</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {confirmed.savedTo === "account" ? (
            <>
              Your request for {quote.nights} {quote.nights === 1 ? "night" : "nights"} for{" "}
              {guests} {guests === 1 ? "guest" : "guests"}
              {priced ? ` (${formatINR(confirmed.total)})` : ""} is saved
              to your account as pending, where Discover Manipur&apos;s admins can see it. {host}{" "}
              is not notified automatically yet. Please contact them directly to book. You have
              not been charged.
            </>
          ) : (
            <>
              Your request for {quote.nights} {quote.nights === 1 ? "night" : "nights"} for{" "}
              {guests} {guests === 1 ? "guest" : "guests"} is saved in this browser. Online booking
              is not connected on this site, so {host} has not been told. Please contact them
              directly to book. You have not been charged.
            </>
          )}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild variant="primary" className="w-full">
            <IntentLink href="/account/bookings">View my bookings</IntentLink>
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
        {priced ? (
          <p>
            <span className="font-display text-2xl font-medium">
              {formatINR(homestay.pricePerNight)}
            </span>
            <span className="text-sm text-muted-foreground"> / night</span>
          </p>
        ) : (
          <p className="font-display text-2xl font-medium">Rate on request</p>
        )}
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
            <StayDatePicker value={range} onChange={onRangeChange} anchorDate={anchorDate} />
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

        {/* Browser-only requests have nowhere to keep a note, so it is only offered with an account. */}
        {mode === "account" && (
          <div>
            <Label htmlFor="booking-note" className="mb-2 block">
              Note with your request{" "}
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
        )}

        {priced ? (
          <PriceBreakdown quote={quote} />
        ) : (
          <p className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm text-muted-foreground">
            This stay has not published a nightly rate. {homestay.hostName || "Your host"} will
            confirm the price when you contact them.
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={Boolean(blockedReason) || isLoading || !mode}
        >
          {isLoading || !mode ? (
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
          {blockedReason ?? "You will not be charged."}
        </p>

        <p className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-muted px-3 py-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            {demo && "Local development mode. "}
            {mode === "account"
              ? "Requests are saved to your account, where Discover Manipur's admins can see them. Your host is not notified automatically yet, and no payment is taken."
              : mode === "browser"
                ? "Requests are saved in this browser only. Online booking is not connected on this site, so your host is not notified."
                : null}
          </span>
        </p>
      </form>

      <Dialog open={review} onOpenChange={setReview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Check your request</DialogTitle>
            <DialogDescription>
              {mode === "account"
                ? `One last look. This saves the request to your account; it is not sent to ${host} automatically yet.`
                : `One last look. This saves the request in this browser only. It is not sent to ${host}.`}
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
            {priced ? (
              <PriceBreakdown quote={quote} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No nightly rate is published for this stay, so the request is saved without a
                price. The host will confirm the price with you directly.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setReview(false)} disabled={submitting}>
              Back
            </Button>
            <Button onClick={confirm} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Saving…
                </>
              ) : (
                "Save request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
