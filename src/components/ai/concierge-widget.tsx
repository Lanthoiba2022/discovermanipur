"use client";

import { MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { Concierge } from "./concierge";

const WIDGET_SUGGESTIONS = [
  "Plan me three days",
  "Where can I stay under ₹2,000 a night?",
  "Book me a table in Imphal for tonight",
];

/**
 * The floating concierge.
 *
 * It is a shell, not a second chatbot — the panel renders the very same
 * `<Concierge />` that `/plan` does. Mount it once, anywhere, and the whole
 * site gets the concierge.
 */
export function ConciergeWidget({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

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

  return (
    <div className={cn("fixed bottom-4 right-4 z-50 print:hidden md:bottom-6 md:right-6", className)}>
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-label="Manipur Tourism concierge"
          className={cn(
            "mb-3 flex h-[min(86dvh,46rem)] w-[min(96vw,30rem)] flex-col overflow-hidden",
            "rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-lg)]",
            "fade-in",
          )}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold tracking-tight text-foreground">Manipur Tourism concierge</p>
              <p className="truncate text-[11px] text-muted-foreground">
                <Link href="/plan" className="underline underline-offset-4 hover:text-foreground">
                  Open the full planner
                </Link>
              </p>
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

          <Concierge
            variant="panel"
            suggestions={WIDGET_SUGGESTIONS}
            greeting="Khurumjari. Ask me anything about Manipur — or tell me how many days you have and I'll sketch a plan."
            footerNote="Grounded in Manipur Tourism's own listings."
            className="min-h-0 flex-1 rounded-none border-0"
          />
        </div>
      )}

      <button
        ref={launcherRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? "Close the Manipur Tourism concierge" : "Open the Manipur Tourism concierge"}
        className={cn(
          "ml-auto flex h-13 items-center gap-2.5 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground",
          "shadow-[var(--shadow-lg)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        )}
      >
        {open ? <X aria-hidden className="size-5" /> : <MessageCircle aria-hidden className="size-5" />}
        <span className="hidden sm:inline">{open ? "Close" : "Ask the concierge"}</span>
      </button>
    </div>
  );
}

export default ConciergeWidget;
