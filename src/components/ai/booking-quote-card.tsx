"use client";

import Link from "next/link";
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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { createBooking } from "@/lib/booking";
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
  const { isAuthenticated, user } = useAuth();
  const [booked, setBooked] = useState(false);
  const [busy, setBusy] = useState(false);

  const Icon = kindIcon[quote.quoteKind] ?? Compass;

  async function confirm() {
    if (booked || busy) return;
    setBusy(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await createBooking({
        kind: quote.quoteKind,
        refId: quote.refId,
        refTitle: quote.refTitle,
        userId: user?.id ?? "demo-traveller",
        startDate: quote.startDate,
        endDate: quote.endDate,
        guests: quote.guests,
        totalPrice: quote.totalInr,
      });
      setBooked(true);
      toast.success("Booking request saved", {
        description: `${quote.refTitle} · ${quote.guests} guest${quote.guests === 1 ? "" : "s"} from ${quote.startDate}.`,
      });
    } catch {
      toast.error("Couldn't save that booking", {
        description: "Try again in a moment.",
      });
    } finally {
      setBusy(false);
    }
  }

  const lineItemsText = quote.lineItems
    .map((line) => `${line.label}: ${line.amountInr < 0 ? "−" : ""}₹${Math.abs(line.amountInr).toLocaleString("en-IN")}`)
    .join("\n");

  /** Downloads a plain-text booking confirmation the traveller can keep. */
  function downloadConfirmation() {
    const filename = `booking-${quote.refId}-${quote.startDate}.txt`;
    const text = [
      "Manipur Tourism — booking confirmation",
      "--------------------------------------",
      `Item: ${quote.refTitle}`,
      `Type: ${kindLabel[quote.quoteKind]}`,
      `Check-in / date: ${quote.startDate}`,
      quote.endDate ? `Check-out: ${quote.endDate}` : "",
      `Guests: ${quote.guests}`,
      lineItemsText ? `\n${lineItemsText}` : "",
      `\nTotal: ₹${quote.totalInr.toLocaleString("en-IN")}`,
      "Status: request saved — no payment taken online.",
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
                <Link href={quote.href} className="hover:underline hover:decoration-primary/40 hover:underline-offset-4">
                  {quote.refTitle}
                </Link>
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
        <p className="mt-4 border-t border-border pt-3 text-sm font-medium text-foreground">Free to book</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {booked ? (
          <span className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-sm font-medium text-success">
            <Check aria-hidden className="size-4" />
            Request saved
          </span>
        ) : (
          <Button type="button" onClick={confirm} disabled={busy}>
            {busy ? "Saving…" : "Confirm booking"}
          </Button>
        )}
        {booked && (
          <>
            <Button type="button" variant="outline" size="sm" onClick={downloadConfirmation}>
              <Download aria-hidden className="size-4" />
              Download confirmation
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/account/bookings">View my bookings</Link>
            </Button>
          </>
        )}
      </div>

      {!isAuthenticated && !booked && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Signed out — your booking will be saved to the demo profile. Sign in to keep it with your account.
        </p>
      )}

      {quote.note && <p className="mt-3 text-[11px] leading-snug text-muted-foreground">{quote.note}</p>}
    </article>
  );
}