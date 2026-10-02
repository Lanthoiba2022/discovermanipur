"use client";

import { Bookmark, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { IntentLink } from "@/components/shared/intent-link";
import { CatalogueImage } from "@/components/shared/catalogue-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { removeSaved, useSavedItems } from "@/lib/booking";
import { useSavedStorage, type SavedStorage } from "@/lib/booking/wishlist";
import { thumbnailCredit } from "@/lib/data/photos";

const WHERE: Record<SavedStorage, string> = {
  account: "Your shortlist is saved to your account, so it follows you to any device you sign in on.",
  browser: "Your shortlist, kept in this browser only. Clearing site data removes it.",
  pending: "Your shortlist of stays and places.",
  error: "We could not load your saved places just now. Refresh the page to try again.",
};

/**
 * The traveller's shortlist.
 *
 * Thumbnails render through `CatalogueImage`, because most lead photos are
 * Google Places photos that must bypass `/_next/image`, and each one carries
 * its credit as a one-line overlay (the same treatment as the
 * `GalleryLightbox` grid): a licence condition, not decoration.
 */
export function SavedPanel() {
  const items = useSavedItems();
  const storage = useSavedStorage();

  return (
    <section aria-labelledby="saved-heading">
      <h2 id="saved-heading" className="font-display text-2xl">
        Saved places
      </h2>
      <p className="mt-2 text-muted-foreground">{WHERE[storage]}</p>

      {storage === "pending" ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2" aria-busy="true">
          <Skeleton className="h-28 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-28 w-full rounded-[var(--radius-lg)]" />
        </div>
      ) : storage === "error" ? null : items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sunken px-6 py-16 text-center">
          <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bookmark className="size-6" aria-hidden="true" />
          </span>
          <h3 className="font-display text-xl">Nothing saved yet</h3>
          <p className="mt-2 max-w-sm text-muted-foreground">
            Tap the heart on any homestay and it will wait for you here.
          </p>
          <Button asChild className="mt-6">
            <IntentLink href="/homestays">Browse stays</IntentLink>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map((item) => {
            const credit = thumbnailCredit(item.image, item.imageCredit);
            return (
              <li
                key={`${item.kind}:${item.slug}`}
                className="relative flex gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-4"
              >
                <div className="relative size-20 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-muted">
                  {item.image && (
                    <CatalogueImage
                      src={item.image}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  )}
                  {item.image && credit && (
                    <span
                      className="pointer-events-none absolute inset-x-1 bottom-1 truncate text-right text-[9px] leading-none text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                    >
                      {credit}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <Badge className="mb-1.5 capitalize">{item.kind}</Badge>
                  <h3 className="truncate font-display text-base">
                    <IntentLink href={item.href} className="underline-offset-4 hover:underline">
                      {item.title}
                    </IntentLink>
                  </h3>
                  {item.subtitle && (
                    <p className="truncate text-sm text-muted-foreground">{item.subtitle}</p>
                  )}
                </div>

                <button
                  type="button"
                  aria-label={`Remove ${item.title} from saved`}
                  onClick={() => {
                    removeSaved(item);
                    toast.message("Removed from your list", { description: item.title });
                  }}
                  className="self-start rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
