import { Hammer, HandCoins, MapPin, User } from "lucide-react";

import { formatINR } from "@/lib/utils";
import type { Craft } from "@/types";

import { formatLeadTime } from "./craft-filters";
import { MakerEnquiryDialog } from "./maker-enquiry-dialog";

/** The panel that replaces a checkout: who made it, and how to reach them. */
export function MakerCard({ craft }: { craft: Craft }) {
  return (
    <section
      aria-labelledby="maker-heading"
      className="flex flex-col gap-5 rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-md)]"
    >
      <div>
        <p className="eyebrow text-muted-foreground">Asking price</p>
        <p className="mt-1.5">
          <span className="font-display text-3xl">{formatINR(craft.price)}</span>
        </p>
        {craft.priceNote && (
          <p className="mt-1 text-sm text-muted-foreground">{craft.priceNote}</p>
        )}
      </div>

      <div className="border-t border-border pt-5">
        <h2 id="maker-heading" className="eyebrow text-muted-foreground">
          The maker
        </h2>
        <p className="mt-2 flex items-center gap-2 font-display text-xl leading-tight">
          <User className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          {craft.maker}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          {craft.location}, {craft.district}
        </p>
        {craft.makerStory && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{craft.makerStory}</p>
        )}
      </div>

      {craft.madeToOrder && (
        <p className="flex items-start gap-2 rounded-[var(--radius)] bg-surface-sunken p-4 text-sm text-muted-foreground">
          <Hammer className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Made to order
            {craft.leadTimeDays
              ? ` — allow ${formatLeadTime(craft.leadTimeDays)} from the day you agree the commission.`
              : " — agree the timeline with the maker."}
          </span>
        </p>
      )}

      <MakerEnquiryDialog craft={craft} />

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <HandCoins className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Manipur Tourism takes no payment and no commission. You pay {craft.maker} directly, in full.
      </p>
    </section>
  );
}
