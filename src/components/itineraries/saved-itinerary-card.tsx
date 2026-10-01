"use client";

import { useId, useState, type FormEvent } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
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
import { deleteItinerary, renameItinerary, savedToPlan } from "@/lib/itineraries";
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

export function SavedItineraryCard({ row }: { row: SavedItinerary }) {
  const panelId = useId();
  const renameId = useId();

  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(row.title);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  const plan = savedToPlan(row);
  const created = formatDate(row.createdAt);

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
    try {
      await navigator.clipboard.writeText(itineraryToText(plan));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Your browser blocked the clipboard");
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
          {row.days.length} {row.days.length === 1 ? "day" : "days"}
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
          {row.days.reduce((total, day) => total + day.stops.length, 0)} stops
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
          onClick={() => setOpen((value) => !value)}
        >
          <ChevronDown
            aria-hidden
            className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
          {open ? "Hide plan" : "Open plan"}
        </Button>

        <Button type="button" variant="ghost" size="sm" onClick={copy} aria-live="polite">
          {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
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

      <div id={panelId} hidden={!open} className="mt-4">
        {open && <ItineraryTimeline plan={plan} showSave={false} />}
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
