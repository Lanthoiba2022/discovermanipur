"use client";

import { useEffect, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { Ban, CalendarDays, Loader2, MapPin, Users } from "lucide-react";
import { toast } from "sonner";

import { IntentLink } from "@/components/shared/intent-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/use-auth";
import {
  BookingError,
  cancelBooking,
  getBookings,
  partitionBookings,
  subscribeToBookings,
  useBookingMode,
  type BookingView,
} from "@/lib/booking";
import { formatINR } from "@/lib/utils";
import type { BookingStatus } from "@/types";

const STATUS_STYLE: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: "Requested", className: "bg-warning/15 text-warning" },
  confirmed: { label: "Confirmed", className: "bg-success/15 text-success" },
  completed: { label: "Completed", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelled", className: "bg-destructive/12 text-destructive" },
};

/**
 * A date-only booking value ("2026-10-05") as "5 Oct 2026". `parseISO` reads a
 * bare date as local midnight, so the day shown is the day booked in every
 * time zone; `new Date("2026-10-05")` is UTC midnight, which west of UTC
 * formats as the day before.
 */
function formatDay(value: string): string {
  const date = parseISO(value);
  return isValid(date) ? format(date, "d MMM yyyy") : value;
}

function BookingRow({
  booking,
  onCancel,
}: {
  booking: BookingView;
  onCancel: (b: BookingView) => void;
}) {
  const status = STATUS_STYLE[booking.status];
  const canCancel = booking.status === "pending" || booking.status === "confirmed";

  return (
    <li className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-display text-lg leading-snug">
            {booking.href ? (
              <IntentLink href={booking.href} className="underline-offset-4 hover:underline">
                {booking.refTitle}
              </IntentLink>
            ) : (
              booking.refTitle
            )}
          </h4>
          <p className="mt-1 flex items-center gap-1.5 text-sm capitalize text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden="true" />
            {booking.kind}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
          {status.label}
        </span>
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <dt className="sr-only">Dates</dt>
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
          <dd>
            {formatDay(booking.startDate)}
            {booking.endDate ? ` – ${formatDay(booking.endDate)}` : ""}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="sr-only">Guests</dt>
          <Users className="size-4 text-muted-foreground" aria-hidden="true" />
          <dd>
            {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-muted-foreground">Total</dt>
          {/* A zero total means the listing has no published rate, not a free stay. */}
          <dd className="font-medium tabular-nums">
            {booking.totalPrice > 0 ? formatINR(booking.totalPrice) : "Price on request"}
          </dd>
        </div>
      </dl>

      {canCancel && (
        <div className="mt-4 border-t border-border pt-4">
          <Button variant="ghost" size="sm" onClick={() => onCancel(booking)}>
            <Ban aria-hidden="true" /> Cancel booking
          </Button>
        </div>
      )}
    </li>
  );
}

export function BookingsPanel() {
  const { user, isLoading: authLoading } = useAuth();
  const mode = useBookingMode();
  const [rows, setRows] = useState<BookingView[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [target, setTarget] = useState<BookingView | null>(null);
  const [busy, setBusy] = useState(false);

  const userId = user?.id ?? "";
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let alive = true;

    const run = async () => {
      try {
        const next = await getBookings(userId);
        if (!alive) return;
        setRows(next);
        setLoadError(null);
      } catch (err) {
        if (!alive) return;
        setRows((prev) => prev ?? []);
        setLoadError(
          err instanceof BookingError ? err.message : "We could not load your bookings. Try again in a moment.",
        );
      }
    };

    void run();
    const unsubscribe = subscribeToBookings(run);

    return () => {
      alive = false;
      unsubscribe();
    };
  }, [userId, reloadToken]);

  const reload = () => setReloadToken((n) => n + 1);

  if (authLoading || rows === null || !mode) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    );
  }

  const { upcoming, past } = partitionBookings(rows);

  const confirmCancel = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await cancelBooking(target.id);
      toast.success("Booking cancelled", { description: target.refTitle });
      setTarget(null);
      reload();
    } catch (err) {
      toast.error(
        err instanceof BookingError ? err.message : "Could not cancel that booking. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="bookings-heading">
      <h2 id="bookings-heading" className="font-display text-2xl">
        Your bookings
      </h2>
      <p className="mt-2 text-muted-foreground">
        {mode === "account"
          ? "The booking requests saved to your account. Hosts are not notified automatically yet, so contact them directly to arrange your trip. No payment is taken."
          : "The booking requests saved in this browser. They are not sent to hosts, so contact them directly to arrange your trip. No payment is taken."}
      </p>

      {loadError && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {loadError}
        </p>
      )}

      {rows.length === 0 && loadError ? null : rows.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sunken px-6 py-16 text-center">
          <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarDays className="size-6" aria-hidden="true" />
          </span>
          <h3 className="font-display text-xl">No trips yet</h3>
          <p className="mt-2 max-w-sm text-muted-foreground">
            When you request a stay, experience or tour, it will appear here with its status and
            total.
          </p>
          <Button asChild className="mt-6">
            <IntentLink href="/homestays">Find a stay</IntentLink>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          <div>
            <h3 className="mb-4 flex items-center gap-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Upcoming
              <Badge>{upcoming.length}</Badge>
            </h3>
            {upcoming.length === 0 ? (
              <p className="rounded-[var(--radius)] border border-dashed border-border-strong px-5 py-8 text-center text-muted-foreground">
                Nothing on the calendar. Manipur is at its greenest right after the monsoon.
              </p>
            ) : (
              <ul className="space-y-4">
                {upcoming.map((b) => (
                  <BookingRow key={b.id} booking={b} onCancel={setTarget} />
                ))}
              </ul>
            )}
          </div>

          {past.length > 0 && (
            <div>
              <h3 className="mb-4 flex items-center gap-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Past &amp; cancelled
                <Badge>{past.length}</Badge>
              </h3>
              <ul className="space-y-4">
                {past.map((b) => (
                  <BookingRow key={b.id} booking={b} onCancel={setTarget} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <Dialog open={Boolean(target)} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>
              {target ? `${target.refTitle} will be marked as cancelled. ` : ""}This cannot be
              undone, and the host is not notified automatically, so let them know if you had been in
              touch.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTarget(null)} disabled={busy}>
              Keep it
            </Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cancelling…
                </>
              ) : (
                "Cancel booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
