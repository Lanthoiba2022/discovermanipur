"use client";

import { ArrowRight, ChevronLeft, ChevronRight, GripHorizontal, MessageCircle, PauseCircle, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { Concierge } from "./concierge";

const WIDGET_SUGGESTIONS = [
  "Plan me three days",
  "Where can I stay under ₹2,000 a night?",
  "Book me a table in Imphal for tonight",
];

/** Keeps the widget clear of the viewport edges when docked or dragged. */
const EDGE = 16;

interface Point {
  left: number;
  top: number;
}

/**
 * What the panel shows while the concierge is switched off.
 *
 * Deliberately not a disabled chat box: there is nothing to type into, so the
 * reader is never invited to ask a question that will not be answered. It says
 * what is happening, then sends them to the one place that still demonstrates
 * the feature.
 */
function PausedPanel({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 overflow-y-auto p-5 text-center" data-lenis-prevent>
      <span
        aria-hidden
        className="mx-auto grid size-11 place-items-center rounded-full bg-surface-sunken text-warning"
      >
        <PauseCircle className="size-5" />
      </span>

      <div className="space-y-2">
        <p className="font-display text-base font-semibold tracking-tight text-foreground">
          The concierge is resting
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Live chat is switched off while this site is a demo, so there is no one here to answer just now.
        </p>
      </div>

      <Link
        href="/plan"
        onClick={onNavigate}
        className={cn(
          "mx-auto flex w-fit items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
          "transition-colors hover:bg-primary/90",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        )}
      >
        See a sample conversation
        <ArrowRight aria-hidden className="size-4" />
      </Link>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Everything else is live — browse{" "}
        <Link href="/hotspots" onClick={onNavigate} className="underline underline-offset-4 hover:text-foreground">
          places
        </Link>{" "}
        and{" "}
        <Link href="/homestays" onClick={onNavigate} className="underline underline-offset-4 hover:text-foreground">
          homestays
        </Link>{" "}
        as normal.
      </p>
    </div>
  );
}

/**
 * The floating concierge.
 *
 * A shell, not a second chatbot — the panel renders the very same
 * `<Concierge />` that `/plan` does. Mount it once in the root layout and the
 * whole site gets the concierge.
 *
 * Three behaviours worth knowing about:
 *
 * 1. **It stands down on `/plan`.** That route *is* the concierge, full width,
 *    beside the trip brief. Floating a second copy of the same conversation
 *    over it offered the reader a worse version of what they were already
 *    looking at, so the widget renders nothing there.
 * 2. **It is draggable.** The header is a drag handle, so the panel can be
 *    moved off whatever it happens to be covering. The position is held in
 *    this component, and because the widget lives in the root layout it is
 *    never unmounted by a client navigation — drag it once and it stays put as
 *    you move around the site.
 * 3. **It tells the truth when it is off.** With `live={false}` the panel does
 *    not render a chat at all — an input box that accepts a question and then
 *    apologises is worse than one that was never offered. It says the concierge
 *    is paused and points at the sample conversation on `/plan`.
 * 4. **One close control, not two.** The launcher used to stay on screen as a
 *    "Close" pill while the panel was open, directly below a panel that
 *    already had a close button. The launcher now hides while the panel is up.
 */
export function ConciergeWidget({
  className,
  live = true,
}: {
  className?: string;
  /** False while the concierge is switched off — the panel says so instead of
   *  opening a chat that cannot answer. */
  live?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Point | null>(null);
  /** Icon-only launcher. Session-scoped on purpose — persisting it would mean
   *  reading storage after hydration and flashing the label away on every load. */
  const [collapsed, setCollapsed] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ dx: number; dy: number; startX: number; startY: number } | null>(null);
  /** Set once a pointer travels far enough to be a drag rather than a tap. */
  const moved = useRef(false);

  const close = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  // Escape closes; focus moves into the panel when it opens.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // A window that shrinks under a dragged panel must not strand it off screen.
  useEffect(() => {
    if (!pos) return;
    function clampToViewport() {
      const box = rootRef.current?.getBoundingClientRect();
      if (!box) return;
      setPos((current) =>
        current
          ? {
              left: Math.min(Math.max(EDGE, current.left), window.innerWidth - box.width - EDGE),
              top: Math.min(Math.max(EDGE, current.top), window.innerHeight - box.height - EDGE),
            }
          : current,
      );
    }
    window.addEventListener("resize", clampToViewport);
    return () => window.removeEventListener("resize", clampToViewport);
  }, [pos]);

  /**
   * Shared by the panel header and the closed launcher.
   *
   * `skipInteractive` is for the header, where the close button and the
   * "full planner" link keep their own clicks. The launcher passes `false`:
   * the whole pill is both the drag surface and the open button, so a drag is
   * told from a tap by how far the pointer travels.
   *
   * Pointer capture is taken only ONCE that threshold is crossed, never on
   * pointerdown. Capturing immediately retargets the following `click` to the
   * capturing element, so the button inside it never heard the click and the
   * launcher stopped opening at all.
   */
  const onHandleDown = (
    event: React.PointerEvent<HTMLElement>,
    { skipInteractive = true }: { skipInteractive?: boolean } = {},
  ) => {
    if (skipInteractive && (event.target as HTMLElement).closest("button,a")) return;
    const box = rootRef.current?.getBoundingClientRect();
    if (!box) return;
    moved.current = false;
    drag.current = {
      dx: event.clientX - box.left,
      dy: event.clientY - box.top,
      startX: event.clientX,
      startY: event.clientY,
    };
  };

  const onHandleMove = (event: React.PointerEvent<HTMLElement>) => {
    const offset = drag.current;
    const box = rootRef.current?.getBoundingClientRect();
    if (!offset || !box) return;

    // A few pixels of slop, so a slightly shaky tap is still a tap. Measured on
    // the pointer rather than on `pos`, which is state and still holds the
    // previous value inside this event.
    if (
      !moved.current &&
      Math.abs(event.clientX - offset.startX) + Math.abs(event.clientY - offset.startY) <= 5
    ) {
      return;
    }

    if (!moved.current) {
      moved.current = true;
      // Now that it is a drag, keep receiving moves even if the pointer runs
      // off the element.
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    setPos({
      left: Math.min(
        Math.max(EDGE, event.clientX - offset.dx),
        window.innerWidth - box.width - EDGE,
      ),
      top: Math.min(
        Math.max(EDGE, event.clientY - offset.dy),
        window.innerHeight - box.height - EDGE,
      ),
    });
  };

  const endDrag = (event: React.PointerEvent<HTMLElement>) => {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  // `/plan` is the concierge. Nothing to float over it.
  if (pathname === "/plan" || pathname.startsWith("/plan/")) return null;

  return (
    <div
      ref={rootRef}
      style={pos ? { left: pos.left, top: pos.top, right: "auto", bottom: "auto" } : undefined}
      className={cn(
        "fixed z-50 print:hidden",
        // The docked position, used until the reader drags it somewhere else.
        !pos && "bottom-4 right-4 md:bottom-6 md:right-6",
        className,
      )}
    >
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-label="Manipur Tourism concierge"
          className={cn(
            // Roughly two thirds of the height it used to take: at 86dvh the
            // panel was the page, and the reader lost the site behind it.
            "mb-3 flex w-[min(92vw,23rem)] flex-col overflow-hidden",
            live ? "h-[min(68dvh,34rem)]" : "h-auto",
            "rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-lg)]",
            "fade-in",
          )}
        >
          {/* The drag handle. `touch-action: none` is what lets a finger drag
              the panel instead of scrolling the page underneath it. */}
          <div
            onPointerDown={(e) => onHandleDown(e)}
            onPointerMove={onHandleMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="flex shrink-0 cursor-grab touch-none select-none items-center gap-2 border-b border-border px-3 py-2.5 active:cursor-grabbing"
          >
            <GripHorizontal aria-hidden className="size-4 shrink-0 text-muted-foreground/60" />

            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[0.8125rem] font-semibold tracking-tight text-foreground">
                Manipur Tourism concierge
              </p>
              <Link
                href="/plan"
                onClick={close}
                className="text-[11px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                {live ? "Open the full planner" : "See the sample conversation"}
              </Link>
            </div>

            <button
              type="button"
              onClick={close}
              aria-label="Close the concierge"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>

          {live ? (
            <Concierge
              variant="panel"
              suggestions={WIDGET_SUGGESTIONS}
              greeting="Khurumjari. Ask me anything about Manipur — or tell me how many days you have and I'll sketch a plan."
              footerNote="Grounded in Manipur Tourism's own listings."
              className="min-h-0 flex-1 rounded-none border-0"
            />
          ) : (
            <PausedPanel onNavigate={close} />
          )}
        </div>
      )}

      {/* Hidden while the panel is up: the panel carries its own close button,
          and two of them stacked read as two different controls. */}
      {!open && (
        <div className="ml-auto flex w-fit items-center gap-1.5">
          <div
            /* The pill is the drag surface AND the open button. `touch-action:
               none` lets a finger drag it instead of scrolling the page; the
               tap/drag distinction is by distance, in `onClick` below. */
            onPointerDown={(e) => onHandleDown(e, { skipInteractive: false })}
            onPointerMove={onHandleMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className={cn(
              "flex touch-none items-center rounded-full bg-primary text-primary-foreground",
              "shadow-[var(--shadow-lg)] transition-[transform,padding] duration-300 ease-[var(--ease-flat)]",
              "hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none",
              "cursor-grab active:cursor-grabbing",
              collapsed ? "pl-1.5 pr-0" : "pl-1.5 pr-4",
            )}
          >
            {/* One toggle, always at the pill's leading edge — only the glyph
                changes. Keeping the control in a single place means it never
                jumps sides as the pill grows and shrinks, and the arrow always
                points the way the label is about to travel. */}
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              aria-expanded={!collapsed}
              aria-label={
                collapsed
                  ? "Show the concierge button label"
                  : "Collapse the concierge button to an icon"
              }
              className={cn(
                "mr-1 grid size-8 shrink-0 place-items-center rounded-full text-primary-foreground/70",
                "transition-colors hover:bg-white/15 hover:text-primary-foreground",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              )}
            >
              {collapsed ? (
                <ChevronLeft aria-hidden className="size-4" />
              ) : (
                <ChevronRight aria-hidden className="size-4" />
              )}
            </button>

            <button
              ref={launcherRef}
              type="button"
              onClick={() => {
                // A drag ends with a click event too; ignore that one.
                if (moved.current) {
                  moved.current = false;
                  return;
                }
                setOpen(true);
              }}
              aria-expanded={false}
              aria-controls={panelId}
              aria-label={live ? "Open the Manipur Tourism concierge" : "About the Manipur Tourism concierge"}
              className={cn(
                "flex h-12 items-center gap-2.5 rounded-full text-sm font-medium",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                collapsed && "w-12 justify-center",
              )}
            >
              <MessageCircle aria-hidden className="size-5 shrink-0" />

              {/* 0fr → 1fr animates the label's width smoothly, which
                  `max-width` cannot do without hard-coding a size. */}
              <span
                className={cn(
                  "grid transition-[grid-template-columns] duration-300 ease-[var(--ease-flat)]",
                  collapsed ? "grid-cols-[0fr]" : "grid-cols-[1fr]",
                )}
              >
                <span className="overflow-hidden whitespace-nowrap">{live ? "Ask the concierge" : "Concierge"}</span>
              </span>
            </button>


          </div>

        </div>
      )}
    </div>
  );
}

export default ConciergeWidget;
