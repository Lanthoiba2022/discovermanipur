"use client";

import { useId, useState, type FormEvent } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  Pencil,
  Route,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItineraryTimeline, itineraryToText } from "@/components/ai/itinerary-timeline";
import {
  dayCountOf,
  deleteItinerary,
  getItinerary,
  isFullItinerary,
  renameItinerary,
  savedToPlan,
  stopCountOf,
  type SavedItineraryListItem,
} from "@/lib/itineraries";
import type { SavedItinerary } from "@/types";

function inr(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

const LOAD_FAILED = "We could not load that plan. Try again in a moment.";
const UNREACHABLE = "We could not reach the server. Check your connection and try again.";

/** Thrown inside the copy flow when the plan itself could not be loaded. */
class PlanNotLoaded extends Error {}

/**
 * One saved plan. In account mode `row` is a summary (no `days`), so the
 * timeline and the copied text need the full plan first: "Open plan" and
 * "Copy" load it through `getItinerary` (one row, fetched once per page) and
 * show a spinner meanwhile, or an inline message when it cannot be loaded.
 * A browser-mode row already carries everything and renders straight away.
 */
export function SavedItineraryCard({ row }: { row: SavedItineraryListItem }) {
  const panelId = useId();
  const renameId = useId();

  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(row.title);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState<SavedItinerary | null>(null);
  const [loading, setLoading] = useState<"open" | "copy" | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // The title always comes from the list row, so a rename shows at once even
  // in a plan that was loaded before it.
  const full: SavedItinerary | null = isFullItinerary(row)
    ? row
    : loaded
      ? { ...loaded, title: row.title }
      : null;
  const plan = full ? savedToPlan(full) : null;
  const created = formatDate(row.createdAt);
  const dayCount = dayCountOf(row);
  const stopCount = stopCountOf(row);

  /** The full plan, loading it the first time. `null` (with a message shown) on failure. */
  async function ensureFull(): Promise<SavedItinerary | null> {
    if (full) return full;
    setLoadError(null);
    try {
      const fetched = await getItinerary(row.id);
      if (!fetched) {
        setLoadError(LOAD_FAILED);
        return null;
      }
      setLoaded(fetched);
      return { ...fetched, title: row.title };
    } catch {
      setLoadError(UNREACHABLE);
      return null;
    }
  }

  async function toggleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    if (!full) {
      setLoading("open");
      const ready = await ensureFull();
      setLoading(null);
      if (!ready) return;
    }
    setOpen(true);
  }

  function markCopied() {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = title.trim();
    if (!clean) {
      toast.error("A plan needs a name");
      return;
    }
    setRenaming(false);
    if (clean === row.title) return;
    try {
      await renameItinerary(row.id, clean);
      toast.success("Plan renamed", { description: clean });
    } catch (err) {
      setTitle(row.title);
      toast.error(errorMessage(err, "We could not rename that plan. Please try again."));
    }
  }

  async function confirmDelete() {
    try {
      await deleteItinerary(row.id);
      setConfirmingDelete(false);
      toast.message("Plan deleted", { description: row.title });
    } catch (err) {
      toast.error(errorMessage(err, "We could not delete that plan. Please try again."));
    }
  }

  async function copy() {
    if (plan) {
      try {
        await navigator.clipboard.writeText(itineraryToText(plan));
        markCopied();
      } catch {
        toast.error("Your browser blocked the clipboard");
      }
      return;
    }

    // The plan has to be fetched first. Safari only lets a page write to the
    // clipboard inside the click itself, so where `ClipboardItem` exists the
    // write starts now and is handed the text as a promise; elsewhere the
    // text is awaited and written as usual.
    setLoading("copy");
    const text = ensureFull().then((ready) => {
      if (!ready) throw new PlanNotLoaded();
      return itineraryToText(savedToPlan(ready));
    });
    try {
      if (typeof ClipboardItem !== "undefined" && typeof navigator.clipboard?.write === "function") {
        const blob = text.then((value) => new Blob([value], { type: "text/plain" }));
        await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
      } else {
        await navigator.clipboard.writeText(await text);
      }
      markCopied();
    } catch {
      // A failed load has already said so inline. Otherwise the clipboard
      // refused; the plan is in memory now, so a second press copies at once.
      const loadedOk = await text.then(
        () => true,
        () => false,
      );
      if (loadedOk) {
        toast.error("Your browser blocked the clipboard", { description: "Press Copy again to retry." });
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <li className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:p-5">
      {renaming ? (
        <form onSubmit={submitRename} className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <Label htmlFor={renameId}>Plan name</Label>
            <Input
              id={renameId}
              value={title}
              autoFocus
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setTitle(row.title);
                  setRenaming(false);
                }
              }}
              className="mt-1.5"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Save name
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setTitle(row.title);
                setRenaming(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <h3 className="font-display text-lg leading-tight">{row.title}</h3>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge variant="primary">
          {dayCount} {dayCount === 1 ? "day" : "days"}
        </Badge>
        {row.travelMonth && <Badge>{row.travelMonth}</Badge>}
        {row.estimatedCostInr ? (
          <Badge variant="accent">~{inr(row.estimatedCostInr)} / person</Badge>
        ) : null}
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {created && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden className="size-3.5" />
            Saved {created}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Route aria-hidden className="size-3.5" />
          {stopCount} {stopCount === 1 ? "stop" : "stops"}
        </span>
        {row.estimatedCostInr ? (
          <span className="inline-flex items-center gap-1.5">
            <Wallet aria-hidden className="size-3.5" />
            {inr(row.estimatedCostInr)} estimated
          </span>
        ) : null}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={open}
          aria-controls={panelId}
          aria-busy={loading === "open"}
          disabled={loading !== null}
          onClick={toggleOpen}
        >
          {loading === "open" ? (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          ) : (
            <ChevronDown
              aria-hidden
              className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
            />
          )}
          {loading === "open" ? "Loading plan" : open ? "Hide plan" : "Open plan"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={copy}
          aria-live="polite"
          aria-busy={loading === "copy"}
          disabled={loading !== null}
        >
          {loading === "copy" ? (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          ) : copied ? (
            <Check aria-hidden className="size-4" />
          ) : (
            <Copy aria-hidden className="size-4" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setRenaming(true)}
          disabled={renaming}
        >
          <Pencil aria-hidden className="size-4" />
          Rename
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirmingDelete(true)}
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 aria-hidden className="size-4" />
          Delete
        </Button>
      </div>

      {loadError && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {loadError}
        </p>
      )}

      <div id={panelId} hidden={!open} className="mt-4">
        {open && plan && <ItineraryTimeline plan={plan} showSave={false} />}
      </div>

      <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <DialogContent aria-describedby={`${panelId}-delete-description`}>
          <DialogHeader>
            <DialogTitle>Delete this plan?</DialogTitle>
            <DialogDescription id={`${panelId}-delete-description`}>
              “{row.title}” will be deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Keep it
              </Button>
            </DialogClose>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              <Trash2 aria-hidden className="size-4" />
              Delete plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
