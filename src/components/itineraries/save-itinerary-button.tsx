"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BookmarkCheck, BookmarkPlus, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { planToSavedInput, saveItinerary } from "@/lib/itineraries";
import type { ItineraryPlan } from "@/lib/ai/schema";

/**
 * "Save this plan" — writes the generated itinerary to the traveller's account.
 * Visitors who are not signed in are sent to `/auth` with `?next=` pointing
 * back at the page they were planning on.
 */
export function SaveItineraryButton({ plan }: { plan: ItineraryPlan }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [savedId, setSavedId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!isLoading && !isAuthenticated) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href={`/auth?next=${encodeURIComponent(pathname)}`}>
          <LogIn aria-hidden className="size-4" />
          Sign in to save
        </Link>
      </Button>
    );
  }

  async function save() {
    if (!user) return;
    setPending(true);
    try {
      const row = await saveItinerary({
        ...planToSavedInput(plan, user.id),
        ...(savedId ? { id: savedId } : {}),
      });
      setSavedId(row.id);
      toast.success("Plan saved to your account", {
        description: row.title,
        action: {
          label: "View",
          onClick: () => router.push("/account/itineraries"),
        },
      });
    } catch {
      toast.error("We could not save that plan. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={save}
      disabled={pending || isLoading}
      aria-live="polite"
    >
      {savedId ? (
        <BookmarkCheck aria-hidden className="size-4" />
      ) : (
        <BookmarkPlus aria-hidden className="size-4" />
      )}
      {savedId ? "Saved" : "Save this plan"}
    </Button>
  );
}
