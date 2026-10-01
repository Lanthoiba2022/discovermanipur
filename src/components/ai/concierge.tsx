"use client";

import { DefaultChatTransport, isToolUIPart, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { AlertTriangle, RotateCcw, Search, Send, Square } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isBookingQuote, isCatalogueResults, isItineraryResult } from "@/lib/ai/schema";

import { BookingQuoteCard } from "./booking-quote-card";
import { ItineraryTimeline } from "./itinerary-timeline";
import { Markdown } from "./markdown";
import { ResultCards } from "./result-cards";

/** A prompt handed in from outside (the guided form, or a suggestion chip). */
export interface ConciergeSeed {
  /** Bump this to fire the same text again. */
  nonce: number;
  text: string;
}

export interface ConciergeProps {
  /** `page` fills its parent; `panel` is the compact floating-widget shell. */
  variant?: "page" | "panel";
  seed?: ConciergeSeed;
  greeting?: string;
  suggestions?: string[];
  className?: string;
  /** Rendered above the composer — used by the widget for its header row. */
  footerNote?: string;
}

export const DEFAULT_SUGGESTIONS = [
  "Build me a 4-day plan on a ₹40,000 budget for two",
  "Where can I stay on Loktak Lake?",
  "Book the Loktak Lake View Homestay for two nights",
  "Plan a relaxed trip for my parents, nothing strenuous",
];

const DEFAULT_GREETING = [
  "Khurumjari — welcome. I'm Discover Manipur's concierge.",
  "",
  "Tell me how long you have, roughly when you're coming and what you're drawn to, and I'll build you a plan out of real places on this site. Ask me anything about Manipur along the way.",
].join("\n");

const toolBusyLabel: Record<string, string> = {
  searchPlaces: "Searching places",
  findStays: "Looking up homestays",
  findExperiences: "Finding experiences",
  findEateries: "Hunting down food",
  findTours: "Checking curated tours",
  getFestivalCalendar: "Reading the festival calendar",
  buildItinerary: "Assembling your itinerary",
  findTransport: "Checking transport options",
  quoteBooking: "Pricing that up",
};

function toolNameOf(type: string): string {
  return type.startsWith("tool-") ? type.slice(5) : type;
}

/* ------------------------------ Sub-components ------------------------------- */

function TypingIndicator({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <span aria-hidden className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-pulse rounded-full bg-primary/70"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </span>
      {label}
    </p>
  );
}

function ToolBusy({ name }: { name: string }) {
  return (
    <p className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
      <Search aria-hidden className="size-3.5 animate-pulse" />
      {toolBusyLabel[name] ?? "Checking the catalogue"}…
    </p>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  return (
    <li className={cn("flex flex-col gap-2.5", isUser ? "items-end" : "items-start")}>
      <p className="sr-only">{isUser ? "You said" : "Concierge said"}</p>

      {message.parts.map((part, i) => {
        const key = `${message.id}-${i}`;

        if (part.type === "text") {
          if (!part.text.trim()) return null;
          return isUser ? (
            <div
              key={key}
              className="max-w-[85%] rounded-[var(--radius-lg)] rounded-br-[var(--radius-sm)] bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground"
            >
              {part.text}
            </div>
          ) : (
            <Markdown key={key} className="max-w-full">
              {part.text}
            </Markdown>
          );
        }

        if (isToolUIPart(part)) {
          const name = toolNameOf(part.type);

          if (part.state === "input-streaming" || part.state === "input-available") {
            return <ToolBusy key={key} name={name} />;
          }

          if (part.state === "output-error") {
            return (
              <p key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle aria-hidden className="size-3.5 text-warning" />
                I couldn&apos;t reach the catalogue for that one.
              </p>
            );
          }

          if (part.state === "output-available") {
            if (isBookingQuote(part.output)) {
              return <BookingQuoteCard key={key} quote={part.output} className="w-full" />;
            }
            if (isItineraryResult(part.output)) {
              return <ItineraryTimeline key={key} plan={part.output.plan} className="w-full" />;
            }
            if (isCatalogueResults(part.output)) {
              return <ResultCards key={key} results={part.output} />;
            }
          }

          return null;
        }

        return null;
      })}
    </li>
  );
}

/* --------------------------------- Concierge --------------------------------- */

/**
 * The one concierge. `/plan` renders it as a full panel; the floating widget
 * renders the same component inside a popover. Two shells, one brain.
 */
export function Concierge({
  variant = "page",
  seed,
  greeting = DEFAULT_GREETING,
  suggestions = DEFAULT_SUGGESTIONS,
  className,
  footerNote,
}: ConciergeProps) {
  const { messages, sendMessage, status, stop, regenerate, error } = useChat({
    transport: useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []),
  });

  const [draft, setDraft] = useState("");
  const inputId = useId();
  const logRef = useRef<HTMLDivElement>(null);
  const lastSeed = useRef<number>(-1);

  const busy = status === "submitted" || status === "streaming";
  const hasConversation = messages.length > 0;

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      void sendMessage({ text: trimmed });
      setDraft("");
    },
    [busy, sendMessage],
  );

  // Seeded prompts from the guided form.
  useEffect(() => {
    if (!seed || seed.nonce === lastSeed.current) return;
    lastSeed.current = seed.nonce;
    send(seed.text);
  }, [seed, send]);

  // Keep the newest turn in view — but only while the reader is already at the
  // bottom, so scrolling back through a long itinerary isn't yanked forward
  // again on the next streamed token.
  const pinnedToBottom = useRef(true);

  const onTranscriptScroll = useCallback(() => {
    const el = logRef.current;
    if (!el) return;
    pinnedToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 64;
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (!el || !pinnedToBottom.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const showSuggestions = !busy && suggestions.length > 0;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface",
        variant === "page" ? "h-full shadow-[var(--shadow-md)]" : "h-full",
        className,
      )}
    >
      {/* Transcript */}
      <div
        ref={logRef}
        onScroll={onTranscriptScroll}
        // Lenis hijacks wheel events document-wide; without this the transcript
        // cannot be scrolled with a wheel or trackpad at all.
        data-lenis-prevent
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Conversation with the Discover Manipur concierge"
        tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring md:p-5"
      >
        <ul className="space-y-5">
          <li className="flex flex-col gap-2.5">
            <p className="sr-only">Concierge said</p>
            <Markdown>{greeting}</Markdown>
          </li>

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {status === "submitted" && (
            <li>
              <TypingIndicator label="Thinking about your trip…" />
            </li>
          )}
        </ul>

        {error && (
          <p className="mt-4 flex items-start gap-2 rounded-[var(--radius)] bg-surface-sunken p-3 text-xs text-muted-foreground">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
            Something went wrong reaching the concierge. Try again, or browse the catalogue directly.
          </p>
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="border-t border-border px-4 pt-3 md:px-5">
          <ul className="flex flex-wrap gap-2">
            {suggestions.slice(0, variant === "panel" ? 2 : 4).map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => send(s)}
                  className={cn(
                    "rounded-full border border-border bg-surface-sunken px-3 py-1.5 text-left text-xs text-muted-foreground",
                    "transition-colors hover:border-border-strong hover:text-foreground",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  )}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="border-t border-border p-4 md:p-5"
      >
        <label htmlFor={inputId} className="sr-only">
          Ask the Discover Manipur concierge about travelling in Manipur
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id={inputId}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
            rows={variant === "panel" ? 2 : 2}
            placeholder="Ask about places, stays, food, festivals…"
            disabled={busy}
            className={cn(
              "max-h-40 min-h-11 w-full resize-none rounded-[var(--radius)] border border-border bg-surface-sunken px-3.5 py-2.5 text-sm text-foreground",
              "placeholder:text-muted-foreground",
              "focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          />

          {busy ? (
            <Button type="button" variant="outline" size="icon" onClick={() => stop()} aria-label="Stop generating">
              <Square aria-hidden className="size-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!draft.trim()} aria-label="Send message">
              <Send aria-hidden className="size-4" />
            </Button>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] leading-snug text-muted-foreground">
            {footerNote ?? "I only recommend places listed on Discover Manipur. Verify permits and conditions officially."}
          </p>
          {hasConversation && !busy && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void regenerate()}
              className="h-8 px-2.5 text-xs"
            >
              <RotateCcw aria-hidden className="size-3.5" />
              Regenerate
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
