"use client";

import { BadgeCheck, Clock, Loader2, ThumbsUp, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setUpvote } from "@/lib/community/actions";
import type { CommunityPlaceStatus } from "@/lib/community/rules";
import type { VoteState } from "@/lib/community/types";
import { cn } from "@/lib/utils";

interface Tally {
  upvotes: number;
  hasVoted: boolean;
  status: CommunityPlaceStatus;
}

export function hoursLeftLabel(hours: number): string {
  if (hours <= 0) return "Voting has closed";
  return hours === 1 ? "1 hour left" : `${hours} hours left`;
}

/**
 * Upvote, or withdraw an upvote, on a place that is collecting votes.
 *
 * The count moves the moment the button is pressed and settles on the
 * server's number when the action answers; if the action fails, the optimistic
 * value is dropped, the server's reason is shown and the page re-reads the
 * server's state. The action is sent the state the person asked for, not a
 * toggle, so a stale button can never flip a vote the wrong way. Whether this
 * viewer may vote at all is decided on the server (`vote.canVote`, `vote.reason`).
 */
export function VoteButton({
  placeId,
  placeName,
  vote,
  isOwn = false,
  layout = "panel",
  className,
}: {
  placeId: string;
  placeName: string;
  vote: VoteState;
  isOwn?: boolean;
  /** `panel` for a place page, `compact` inside a queue card. */
  layout?: "panel" | "compact";
  className?: string;
}) {
  const router = useRouter();
  const helperId = useId();
  const [isPending, startTransition] = useTransition();
  const [tally, setTally] = useState<Tally>({
    upvotes: vote.upvotes,
    hasVoted: vote.hasVoted,
    status: "pending",
  });
  // Follow the server when a refresh brings new numbers (another tab, another
  // card's vote): React's "adjust state when a prop changes" pattern.
  const serverState = `${vote.upvotes}:${vote.hasVoted}`;
  const [seenServerState, setSeenServerState] = useState(serverState);
  if (seenServerState !== serverState) {
    setSeenServerState(serverState);
    setTally({ upvotes: vote.upvotes, hasVoted: vote.hasVoted, status: "pending" });
  }
  const [optimistic, applyOptimistic] = useOptimistic(
    tally,
    (current: Tally, voting: boolean): Tally => ({
      ...current,
      hasVoted: voting,
      upvotes: Math.max(0, current.upvotes + (voting ? 1 : -1)),
    }),
  );

  const required = vote.upvotesRequired;
  const published = optimistic.status === "published";
  const progress = Math.min(100, Math.round((optimistic.upvotes / Math.max(1, required)) * 100));

  function onToggle() {
    const want = !optimistic.hasVoted;
    startTransition(async () => {
      applyOptimistic(want);
      const result = await setUpvote(placeId, want);
      if (!result.ok) {
        toast.error("Your vote was not saved", { description: result.error });
        // The place may have closed or changed meanwhile; show what is true now.
        router.refresh();
        return;
      }
      startTransition(() => setTally(result.data));
      if (result.data.status === "published") {
        toast.success(`${placeName} is now published`, {
          description: `It reached ${required} upvotes and is now public.`,
        });
        router.refresh();
      }
    });
  }

  const compact = layout === "compact";
  const helper = isOwn ? null : vote.canVote ? null : vote.reason;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div>
        <p aria-live="polite" aria-atomic="true" className="flex flex-wrap items-baseline gap-x-2">
          <span className={cn("font-display leading-none", compact ? "text-2xl" : "text-4xl")}>
            {optimistic.upvotes}
          </span>
          <span className="text-sm text-muted-foreground">
            of {required} upvotes
            {optimistic.hasVoted && !published ? ", including yours" : ""}
          </span>
        </p>
        <div aria-hidden="true" className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-[var(--ease-flat)] motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        {!published && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-3.5 shrink-0" aria-hidden="true" />
            {hoursLeftLabel(vote.hoursLeft)}
          </p>
        )}
      </div>

      {published ? (
        <p role="status" className="flex items-start gap-2 text-sm font-medium text-primary">
          <BadgeCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          This place is now published and visible to everyone.
        </p>
      ) : isOwn ? (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <UserCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          You listed this, so you cannot vote for it.
        </p>
      ) : (
        <>
          <Button
            type="button"
            variant={optimistic.hasVoted ? "outline" : "primary"}
            size={compact ? "md" : "pill"}
            onClick={onToggle}
            disabled={!vote.canVote || isPending}
            aria-busy={isPending || undefined}
            aria-describedby={helper ? helperId : undefined}
            className={cn("w-full", compact && "sm:w-auto")}
          >
            {isPending ? (
              <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
            ) : (
              <ThumbsUp className={cn(optimistic.hasVoted && "fill-current")} aria-hidden="true" />
            )}
            {optimistic.hasVoted ? "Withdraw my upvote" : "Upvote this place"}
            <span className="sr-only">: {placeName}</span>
          </Button>
          {helper && (
            <p id={helperId} className="text-sm text-muted-foreground">
              {helper}
            </p>
          )}
        </>
      )}
    </div>
  );
}
