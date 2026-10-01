"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { holdPlace, publishPlace, rejectPlace } from "@/lib/community/admin-actions";
import type { CommunityPlaceStatus } from "@/lib/community/rules";
import { ADMIN_NOTE_MAX, REJECT_NOTE_MIN } from "@/lib/community/schema";
import type { ActionResult } from "@/lib/community/types";
import { cn } from "@/lib/utils";

type Decision = "publish" | "hold" | "reject";

/** Which decisions each status allows. Mirrors the `from` lists in `admin-actions.ts`. */
const ALLOWED: Record<CommunityPlaceStatus, Decision[]> = {
  held: ["publish", "reject"],
  pending: ["publish", "hold", "reject"],
  published: ["hold", "reject"],
  rejected: ["publish", "hold"],
};

const COPY: Record<
  Decision,
  { label: (status: CommunityPlaceStatus) => string; hint: string; submit: string; done: string; doneHint: string }
> = {
  publish: {
    label: (s) => (s === "pending" ? "Publish now, without waiting for votes" : "Publish"),
    hint: "It goes on the public community places page straight away.",
    submit: "Publish place",
    done: "published",
    doneHint: "It is now on the public site.",
  },
  hold: {
    label: (s) =>
      s === "published" ? "Unpublish and hold for review" : s === "pending" ? "Stop voting and hold for review" : "Move back to review",
    hint: "It comes off the public site and out of voting, and waits in the review queue. Nothing is deleted.",
    submit: "Hold place",
    done: "held for review",
    doneHint: "It is off the public site and back in the review queue.",
  },
  reject: {
    label: () => "Reject",
    hint: "It is hidden from everyone except the person who listed it. Nothing is deleted.",
    submit: "Reject place",
    done: "rejected",
    doneHint: "The person who listed it can now read your reason.",
  },
};

const FAILED: ActionResult = {
  ok: false,
  error: "That decision could not be saved. Check your connection and try again.",
};

/**
 * Publish, hold or reject one place. Only the decisions the current status
 * allows are offered; the Server Action checks the status again, so a place
 * that changed meanwhile is refused rather than overwritten.
 */
export function CommunityDecisionPanel({
  placeId,
  placeName,
  status,
}: {
  placeId: string;
  placeName: string;
  status: CommunityPlaceStatus;
}) {
  const router = useRouter();
  const allowed = ALLOWED[status];
  const [decision, setDecision] = useState<Decision>(allowed[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  // A refresh after a decision can bring a new status; fall back to a valid choice.
  const current = allowed.includes(decision) ? decision : allowed[0];
  const isReject = current === "reject";
  const trimmed = note.trim();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isReject && trimmed.length < REJECT_NOTE_MIN) {
      setError(`Give a reason of at least ${REJECT_NOTE_MIN} characters. The person who listed this place will see it.`);
      noteRef.current?.focus();
      return;
    }
    setError(null);
    startSaving(async () => {
      let result: ActionResult;
      try {
        const noteValue = trimmed || undefined;
        result =
          current === "publish"
            ? await publishPlace({ placeId, note: noteValue })
            : current === "hold"
              ? await holdPlace({ placeId, note: noteValue })
              : await rejectPlace({ placeId, note: trimmed });
      } catch {
        result = FAILED;
      }
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setNote("");
      toast.success(`${placeName} ${COPY[current].done}`, { description: COPY[current].doneHint });
      router.refresh();
    });
  }

  const noteId = `${id}-note`;
  const helpId = `${id}-help`;
  const countId = `${id}-count`;
  const errorId = `${id}-error`;

  return (
    <form onSubmit={submit} noValidate aria-labelledby={`${id}-heading`}>
      <h3 id={`${id}-heading`} className="font-display text-xl">
        Decision
      </h3>

      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-medium text-foreground">What should happen to this place?</legend>
        <div className="grid gap-2">
          {allowed.map((option) => (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-[var(--radius)] border p-3 text-sm transition-colors",
                current === option ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
              )}
            >
              <input
                type="radio"
                name={`${id}-decision`}
                value={option}
                checked={current === option}
                onChange={() => {
                  setDecision(option);
                  setError(null);
                }}
                className="mt-0.5 size-4 accent-[var(--primary)]"
              />
              <span>
                <span className="block font-medium text-foreground">{COPY[option].label(status)}</span>
                <span className="mt-0.5 block text-muted-foreground">{COPY[option].hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <Label htmlFor={noteId}>
          {isReject ? "Reason for rejecting (required)" : "Internal note (optional)"}
        </Label>
        <Textarea
          ref={noteRef}
          id={noteId}
          className="mt-1.5"
          value={note}
          maxLength={ADMIN_NOTE_MAX}
          required={isReject}
          aria-required={isReject}
          aria-invalid={error !== null && isReject ? true : undefined}
          aria-describedby={[helpId, countId, error ? errorId : null].filter(Boolean).join(" ")}
          onChange={(e) => {
            setNote(e.target.value);
            if (error) setError(null);
          }}
          placeholder={
            isReject
              ? "Say what is wrong, so they can fix it or understand the decision."
              : "What did you check? Only admins see this."
          }
        />
        <div className="mt-1.5 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <p id={helpId}>
            {isReject
              ? `At least ${REJECT_NOTE_MIN} characters. The person who listed this place sees this reason on their account page, so keep it clear and courteous.`
              : "Saved with the decision for other admins. The person who listed the place does not see it."}
          </p>
          <p id={countId} className="tabular-nums">
            {note.length.toLocaleString("en-IN")} / {ADMIN_NOTE_MAX.toLocaleString("en-IN")} characters
            {isReject && trimmed.length < REJECT_NOTE_MIN && `, ${REJECT_NOTE_MIN - trimmed.length} more needed`}
          </p>
        </div>
        {error && (
          <p id={errorId} role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="mt-5 w-full sm:w-auto"
        variant={isReject ? "destructive" : "primary"}
        disabled={saving}
      >
        {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
        {COPY[current].submit}
      </Button>
    </form>
  );
}
