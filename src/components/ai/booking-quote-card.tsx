"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BedDouble,
  CalendarDays,
  Car,
  Check,
  Compass,
  Download,
  Sparkles,
  UtensilsCrossed,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { IntentLink } from "@/components/shared/intent-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/use-auth";
import { BookingError, createBooking, useBookingMode, type BookingMode } from "@/lib/booking";
import { cn, formatINR } from "@/lib/utils";
import type { BookingQuoteKind, BookingQuoteResult } from "@/lib/ai/schema";

const kindIcon: Record<BookingQuoteKind, LucideIcon> = {
  tour: Compass,
  homestay: BedDouble,
  experience: Sparkles,
  transport: Car,
  table: UtensilsCrossed,
};

const kindLabel: Record<BookingQuoteKind, string> = {
  tour: "Tour",
  homestay: "Homestay",
  experience: "Experience",
  transport: "Transport",
  table: "Table reservation",
};

export function BookingQuoteCard({ quote, className }: { quote: BookingQuoteResult; className?: string }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = usePathname();
  const mode = useBookingMode();
  const [saved, setSaved] = useState<{ savedTo: BookingMode; total: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const Icon = kindIcon[quote.quoteKind] ?? Compass;
  // Per-kilometre transport has no total to request; the note says to ask the operator.
  const priceOnRequest = quote.quoteKind === "transport" && quote.lineItems.length === 0;
  // Not while the session is still loading: a signed-in traveller would see
  // (and could follow) "Sign in to request" before the store knows them.
  const needsSignIn = mode === "account" && !isLoading && !isAuthenticated;
  const signInHref = `/auth?next=${encodeURIComponent(pathname)}`;

  async function confirm() {
    if (saved || busy || !mode) return;
    setBusy(true);
    try {
      const { booking, savedTo } = await createBooking({
        kind: quote.quoteKind,
        slug: quote.refId,
        refTitle: quote.refTitle,
        userId: user?.id ?? "demo-traveller",
        startDate: quote.startDate,
        endDate: quote.endDate,
        guests: quote.guests,
        totalPrice: quote.totalInr,
      });
      setSaved({ savedTo, total: booking.totalPrice });
      toast.success(
        savedTo === "account" ? "Request saved to your account" : "Request saved in this browser",
        {
          description: `${quote.refTitle} · ${quote.guests} guest${quote.guests === 1 ? "" : "s"} from ${quote.startDate}. It has not been sent to the provider.`,
        },
      );
    } catch (err) {
      toast.error("Couldn't save that request", {
        description: err instanceof BookingError ? err.message : "Try again in a moment.",
      });
    } finally {
      setBusy(false);
    }
  }

  const lineItemsText = quote.lineItems
    .map((line) => `${line.label}: ${line.amountInr < 0 ? "−" : ""}₹${Math.abs(line.amountInr).toLocaleString("en-IN")}`)
    .join("\n");

  /** Downloads a plain-text copy of the saved request the traveller can keep. */
  function downloadConfirmation() {
    if (!saved) return;
    const filename = `booking-request-${quote.refId}-${quote.startDate}.txt`;
    const text = [
      "Discover Manipur: booking request",
      "----------------------------------",
      `Item: ${quote.refTitle}`,
      `Type: ${kindLabel[quote.quoteKind]}`,
      `Check-in / date: ${quote.startDate}`,
      quote.endDate ? `Check-out: ${quote.endDate}` : "",
      `Guests: ${quote.guests}`,
      lineItemsText ? `\n${lineItemsText}` : "",
      `\nTotal: ₹${saved.total.toLocaleString("en-IN")}`,
      saved.savedTo === "account"
        ? "Status: request saved to your Discover Manipur account (pending). The provider is not notified automatically; contact them to book. No payment is taken online."
        : "Status: request saved in this browser only. It has not been sent to the provider; contact them to book. No payment is taken online.",
      "Verify permits, prices and conditions with official sources before you travel.",
    ]
      .filter(Boolean)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!quote.ok) {
    return (
      <div
        className={cn(
          "rounded-[var(--radius)] border border-dashed border-border-strong bg-surface-sunken p-4 text-xs leading-relaxed text-muted-foreground",
          className,
        )}
      >
        {quote.note}
      </div>
    );
  }

  return (
    <article
      aria-label={`Booking quote for ${quote.refTitle}`}
      className={cn(
        "rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-sm)] md:p-5",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-primary/10 text-primary">
            <Icon aria-hidden className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-1.5">
              <Badge variant="primary" className="px-2 py-0.5 text-[10px] uppercase tracking-wider">
                {kindLabel[quote.quoteKind]}
              </Badge>
              <span className="truncate font-medium text-muted-foreground">{quote.refTitle}</span>
            </p>
            <h4 className="mt-1 truncate font-display text-base font-semibold tracking-tight text-foreground">
              {quote.href ? (
                <IntentLink href={quote.href} className="hover:underline hover:decoration-primary/40 hover:underline-offset-4">
                  {quote.refTitle}
                </IntentLink>
              ) : (
                quote.refTitle
              )}
            </h4>
          </div>
        </div>
      </header>

      <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays aria-hidden className="size-3.5" />
          <span>
            {quote.startDate}
            {quote.endDate ? ` → ${quote.endDate}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users aria-hidden className="size-3.5" />
          <span>
            {quote.guests} guest{quote.guests === 1 ? "" : "s"}
          </span>
        </div>
      </dl>

      {quote.lineItems.length > 0 ? (
        <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
          {quote.lineItems.map((line, i) => (
            <div key={`${quote.refId}-${i}`} className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">{line.label}</dt>
              <dd className={cn("font-medium", line.amountInr < 0 ? "text-success" : "text-foreground")}>
                {line.amountInr < 0 ? "−" : ""}
                {formatINR(Math.abs(line.amountInr))}
              </dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 border-t border-border pt-2">
            <dt className="text-sm font-medium text-foreground">Total</dt>
            <dd className="font-display text-lg">{formatINR(quote.totalInr)}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4 border-t border-border pt-3 text-sm font-medium text-foreground">
          {priceOnRequest ? "Price on request" : "Free to book"}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {saved ? (
          <span className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-sm font-medium text-success">
            <Check aria-hidden className="size-4" />
            {saved.savedTo === "account" ? "Saved to your account" : "Saved in this browser"}
          </span>
        ) : priceOnRequest ? null : needsSignIn ? (
          <Button asChild>
            <IntentLink href={signInHref}>Sign in to request</IntentLink>
          </Button>
        ) : (
          <Button type="button" onClick={confirm} disabled={busy || !mode || isLoading}>
            {busy ? "Saving…" : "Save request"}
          </Button>
        )}
        {saved && (
          <>
            <Button type="button" variant="outline" size="sm" onClick={downloadConfirmation}>
              <Download aria-hidden className="size-4" />
              Download confirmation
            </Button>
            <Button asChild variant="outline" size="sm">
              <IntentLink href="/account/bookings">View my bookings</IntentLink>
            </Button>
          </>
        )}
      </div>

      {!saved && !priceOnRequest && mode && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          {mode === "account"
            ? needsSignIn
              ? "Sign in to save this request to your account. No payment is taken."
              : "Saving puts this request on your account, where Discover Manipur's admins can see it. The provider is not notified automatically yet, and no payment is taken."
            : "Requests are saved in this browser only on this site and are not sent to the provider. No payment is taken."}
        </p>
      )}

      {quote.note && <p className="mt-3 text-[11px] leading-snug text-muted-foreground">{quote.note}</p>}
    </article>
  );
}