import { formatINR } from "@/lib/utils";
import type { StayQuote } from "@/lib/booking";

export function PriceBreakdown({ quote }: { quote: StayQuote }) {
  if (quote.nights === 0) return null;

  return (
    <dl className="space-y-2.5 border-t border-border pt-4 text-sm">
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-muted-foreground underline decoration-dotted underline-offset-4">
          {formatINR(quote.rate)} × {quote.nights} {quote.nights === 1 ? "night" : "nights"}
        </dt>
        <dd className="tabular-nums">{formatINR(quote.subtotal)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-muted-foreground underline decoration-dotted underline-offset-4">
          Manipur Tourism service fee
        </dt>
        <dd className="tabular-nums">{formatINR(quote.serviceFee)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3 text-base font-medium">
        <dt>Total</dt>
        <dd className="font-display text-lg tabular-nums">{formatINR(quote.total)}</dd>
      </div>
    </dl>
  );
}
