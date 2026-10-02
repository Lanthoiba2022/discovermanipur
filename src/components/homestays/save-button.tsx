"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";

// The wishlist module directly rather than the `@/lib/booking` barrel: this
// button is on every homestay card, and the barrel's other modules are not
// needed to render one.
import { toggleSaved, useIsSaved, type SavedItem } from "@/lib/booking/wishlist";
import { cn } from "@/lib/utils";

export function SaveButton({
  item,
  className,
  variant = "overlay",
}: {
  item: Omit<SavedItem, "savedAt">;
  className?: string;
  variant?: "overlay" | "inline";
}) {
  const saved = useIsSaved(item);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${item.title} from saved` : `Save ${item.title}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const nowSaved = toggleSaved(item);
        toast[nowSaved ? "success" : "message"](
          nowSaved ? "Saved to your list" : "Removed from your list",
          { description: item.title },
        );
      }}
      className={cn(
        "inline-flex items-center justify-center transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 active:scale-95",
        variant === "overlay"
          ? "size-11 rounded-full bg-surface/85 backdrop-blur-sm shadow-[var(--shadow-sm)]"
          : "gap-2 rounded-full border border-border-strong px-4 py-2 text-sm hover:bg-muted",
        className,
      )}
    >
      <Heart
        className={cn("size-4", saved ? "fill-shirui-500 text-shirui-500" : "text-foreground")}
        aria-hidden="true"
      />
      {variant === "inline" && <span>{saved ? "Saved" : "Save"}</span>}
    </button>
  );
}
