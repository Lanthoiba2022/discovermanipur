import Link from "next/link";
import { Compass, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export function HomestayEmptyState({ filtered }: { filtered: boolean }) {
  const Icon = filtered ? SearchX : Compass;

  return (
    <div className="flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sunken px-6 py-20 text-center">
      <span className="mb-6 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <h2 className="font-display text-2xl">
        {filtered ? "No stays match those filters" : "Homestays are on their way"}
      </h2>
      <p className="mt-3 max-w-md text-muted-foreground">
        {filtered
          ? "Try widening the price range, dropping a district, or asking for fewer amenities. Manipur's best hosts are often one filter away."
          : "We are welcoming host families across the valley and the hills right now. In the meantime, start with the places you want to wake up next to."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {filtered && (
          <Button asChild variant="primary">
            <Link href="/homestays">Clear all filters</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/hotspots">Browse places</Link>
        </Button>
      </div>
    </div>
  );
}
