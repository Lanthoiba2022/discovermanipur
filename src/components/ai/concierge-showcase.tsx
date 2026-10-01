"use client";

import { MessageCircleQuestion, RotateCcw, Search, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isBookingQuote, isCatalogueResults, isItineraryResult } from "@/lib/ai/schema";
import type { ConciergeToolOutput } from "@/lib/ai/schema";

import { BookingQuoteCard } from "./booking-quote-card";
import { ItineraryTimeline } from "./itinerary-timeline";
import { Markdown } from "./markdown";
import { ResultCards } from "./result-cards";

/** Mirrors `ShowcaseTurn` in `@/lib/ai/showcase`, minus the server import. */
export interface ShowcaseTurnView {
  id: string;
  question: string;
  answer: string;
  tools: string[];
  outputs: ConciergeToolOutput[];
  chip: string;
}

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

/** How long the "working" chips sit there before the prose starts. */
const TOOL_MS = 900;
/** Characters revealed per tick, and the tick length. Tuned to read as typing. */
const CHARS_PER_TICK = 4;
const TICK_MS = 16;

type Phase = "tools" | "typing" | "done";

function ToolChip({ name }: { name: string }) {
  return (
    <p className="flex w-fit items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
      <Search aria-hidden className="size-3.5 animate-pulse" />
      {toolBusyLabel[name] ?? "Checking the catalogue"}…
    </p>
  );
}

function Outputs({ outputs }: { outputs: ConciergeToolOutput[] }) {
  return (
    <>
      {outputs.map((output, i) => {
        const key = `out-${i}`;
        if (isBookingQuote(output)) return <BookingQuoteCard key={key} quote={output} className="w-full" />;
        if (isItineraryResult(output)) return <ItineraryTimeline key={key} plan={output.plan} className="w-full" />;
        if (isCatalogueResults(output)) return <ResultCards key={key} results={output} />;
        return null;
      })}
    </>
  );
}

/**
 * The sample conversation that stands in for the live concierge.
 *
 * It is a *transcript builder*, not a video: the visitor picks the next
 * question from the chips and it plays out: tool chips, then the answer typing
 * in, then the real catalogue cards. That keeps the sample honest about what the
 * concierge does (it looks things up, then talks) while staying entirely
 * client-side, with no key and no request.
 *
 * Every card below was assembled server-side from the live catalogue, so the
 * links go to real pages and the prices are the real prices.
 */
export function ConciergeShowcase({
  turns,
  className,
}: {
  turns: ShowcaseTurnView[];
  className?: string;
}) {
  const [playedIds, setPlayedIds] = useState<string[]>(() => (turns[0] ? [turns[0].id] : []));
  const [phase, setPhase] = useState<Phase>("tools");
  const [revealed, setRevealed] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);

  const byId = useMemo(() => new Map(turns.map((t) => [t.id, t])), [turns]);
  const played = useMemo(
    () => playedIds.map((id) => byId.get(id)).filter((t): t is ShowcaseTurnView => Boolean(t)),
    [playedIds, byId],
  );
  const active = played[played.length - 1];
  const remaining = turns.filter((t) => !playedIds.includes(t.id));
  const busy = phase !== "done";

  const reducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Drive the active turn: hold on the tool chips, then type the answer in.
  useEffect(() => {
    if (!active) return;

    if (phase === "tools") {
      // Reduced motion skips the pause rather than removing the step, so the
      // "it looked things up first" beat still reads, just instantly.
      const timer = window.setTimeout(() => setPhase("typing"), reducedMotion ? 0 : TOOL_MS);
      return () => window.clearTimeout(timer);
    }

    if (phase === "typing") {
      if (reducedMotion) {
        const timer = window.setTimeout(() => {
          setRevealed(active.answer.length);
          setPhase("done");
        }, 0);
        return () => window.clearTimeout(timer);
      }

      const timer = window.setInterval(() => {
        setRevealed((n) => {
          const next = n + CHARS_PER_TICK;
          if (next >= active.answer.length) {
            window.clearInterval(timer);
            setPhase("done");
            return active.answer.length;
          }
          return next;
        });
      }, TICK_MS);
      return () => window.clearInterval(timer);
    }
  }, [active, phase, reducedMotion]);

  // Same stick-to-bottom rule as the live concierge: follow the newest turn,
  // but never yank a reader who has scrolled back up.
  const onScroll = useCallback(() => {
    const el = logRef.current;
    if (!el) return;
    pinnedToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 64;
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (!el || !pinnedToBottom.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [played.length, revealed, phase]);

  const ask = useCallback(
    (id: string) => {
      if (busy) return;
      pinnedToBottom.current = true;
      setPlayedIds((ids) => [...ids, id]);
      setRevealed(0);
      setPhase("tools");
    },
    [busy],
  );

  const restart = useCallback(() => {
    pinnedToBottom.current = true;
    setPlayedIds(turns[0] ? [turns[0].id] : []);
    setRevealed(0);
    setPhase("tools");
  }, [turns]);

  if (turns.length === 0) return null;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-md)]",
        className,
      )}
    >
      {/* Says what this is, before a visitor reads a word of it as live. */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-border bg-surface-sunken px-4 py-2.5 md:px-5">
        <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-primary">
          <Sparkles aria-hidden className="size-3" />
          Sample conversation
        </span>
        <p className="text-xs text-muted-foreground">
          The live concierge is switched off for now. This is a recorded exchange, built from the real catalogue.
        </p>
      </div>

      {/* Transcript */}
      <div
        ref={logRef}
        onScroll={onScroll}
        // Lenis hijacks wheel events document-wide; without this the transcript
        // cannot be scrolled with a wheel or trackpad.
        data-lenis-prevent
        role="log"
        aria-live="polite"
        aria-label="Sample conversation with the Discover Manipur concierge"
        tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring md:p-5"
      >
        <ul className="space-y-5">
          {played.map((turn, index) => {
            const isActive = index === played.length - 1;
            const answerText = isActive && phase !== "done" ? turn.answer.slice(0, revealed) : turn.answer;
            const showTools = isActive && phase === "tools";
            const showOutputs = !isActive || phase === "done";

            return (
              <li key={turn.id} className="flex flex-col gap-2.5">
                {/* Question */}
                <p className="sr-only">Traveller asked</p>
                <div className="max-w-[85%] self-end rounded-[var(--radius-lg)] rounded-br-[var(--radius-sm)] bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
                  {turn.question}
                </div>

                {/* Answer */}
                <p className="sr-only">Concierge answered</p>
                {showTools ? (
                  <div className="flex flex-col items-start gap-1.5">
                    {turn.tools.map((name) => (
                      <ToolChip key={name} name={name} />
                    ))}
                  </div>
                ) : (
                  <>
                    <Markdown className="max-w-full">{answerText}</Markdown>
                    {showOutputs && <Outputs outputs={turn.outputs} />}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Remaining questions: the visitor drives the conversation forward. */}
      <div className="shrink-0 border-t border-border px-4 py-3 md:px-5">
        {remaining.length > 0 ? (
          <>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              <MessageCircleQuestion aria-hidden className="size-3.5" />
              Ask the next question
            </p>
            <ul className="flex flex-wrap gap-2">
              {remaining.map((turn) => (
                <li key={turn.id}>
                  <button
                    type="button"
                    onClick={() => ask(turn.id)}
                    disabled={busy}
                    className={cn(
                      "rounded-full border border-border bg-surface-sunken px-3 py-1.5 text-left text-xs text-muted-foreground",
                      "transition-colors hover:border-border-strong hover:text-foreground",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  >
                    {turn.chip}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              That&apos;s the sample. Everything it linked to is a real page on this site. Go and open one.
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={restart} className="h-8 px-2.5 text-xs">
              <RotateCcw aria-hidden className="size-3.5" />
              Replay
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
