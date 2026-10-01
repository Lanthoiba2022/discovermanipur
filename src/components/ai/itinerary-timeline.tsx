"use client";

import Link from "next/link";
import { useState } from "react";
import { BedDouble, Check, Copy, Download, Info, MapPin, Printer, Route, UtensilsCrossed } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveItineraryButton } from "@/components/itineraries/save-itinerary-button";
import { SITE_HOST } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { ItineraryPlan } from "@/lib/ai/schema";

function inr(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

/** A plain-text rendering of the plan — what lands on the clipboard. */
export function itineraryToText(plan: ItineraryPlan): string {
  const out: string[] = [plan.title, "", plan.overview, ""];

  for (const day of plan.days) {
    out.push(`Day ${day.day} — ${day.title}`);
    out.push(day.summary);
    for (const stop of day.stops) {
      const when = stop.timeOfDay ? `${stop.timeOfDay}: ` : "";
      out.push(`  • ${when}${stop.title}${stop.href ? ` (${SITE_HOST}${stop.href})` : ""} — ${stop.note}`);
    }
    for (const meal of day.meals) {
      out.push(`  • ${meal.slot}: ${meal.suggestion}${meal.href ? ` (${SITE_HOST}${meal.href})` : ""}`);
    }
    if (day.stay) out.push(`  • stay: ${day.stay.title}${day.stay.note ? ` — ${day.stay.note}` : ""}`);
    if (day.travelNotes) out.push(`  • getting around: ${day.travelNotes}`);
    if (day.estimatedCostInr) out.push(`  • approx ${inr(day.estimatedCostInr)} per person`);
    out.push("");
  }

  if (plan.totalEstimatedCostInr) out.push(`Estimated total: ${inr(plan.totalEstimatedCostInr)} per person (rough).`);
  if (plan.packingNotes?.length) out.push("", "Packing:", ...plan.packingNotes.map((n) => `  • ${n}`));
  if (plan.permitsAndSafety?.length) out.push("", "Permits & safety:", ...plan.permitsAndSafety.map((n) => `  • ${n}`));
  out.push("", "Built with the Discover Manipur concierge. Verify permits, prices and road conditions with official sources.");

  return out.join("\n");
}

function CopyButton({ plan }: { plan: ItineraryPlan }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(itineraryToText(plan));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy} aria-live="polite">
      {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
      {copied ? "Copied" : "Copy plan"}
    </Button>
  );
}

/** Downloads the plan as a plain-text file the traveller can keep. */
function downloadPlan(plan: ItineraryPlan) {
  const slug =
    plan.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "manipur-itinerary";
  const blob = new Blob([itineraryToText(plan)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ItineraryTimeline({
  plan,
  className,
  showSave = true,
}: {
  plan: ItineraryPlan;
  className?: string;
  /** Off on an already-saved plan, where saving it again would be noise. */
  showSave?: boolean;
}) {
  return (
    <article
      className={cn(
        "rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-sm)] md:p-5",
        className,
      )}
    >
      <header className="mb-5 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-foreground">{plan.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{plan.overview}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="primary">{plan.days.length} days</Badge>
            {plan.travelMonth && <Badge>{plan.travelMonth}</Badge>}
            {plan.pace && <Badge>{plan.pace} pace</Badge>}
            {plan.groupType && <Badge>{plan.groupType}</Badge>}
            {plan.totalEstimatedCostInr ? (
              <Badge variant="accent">~{inr(plan.totalEstimatedCostInr)} / person</Badge>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 print:hidden">
          {showSave && <SaveItineraryButton plan={plan} />}
          <CopyButton plan={plan} />
          <Button type="button" variant="outline" size="sm" onClick={() => downloadPlan(plan)}>
            <Download aria-hidden className="size-4" />
            Download
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => window.print()}>
            <Printer aria-hidden className="size-4" />
            Print
          </Button>
        </div>
      </header>

      <ol className="space-y-6">
        {plan.days.map((day) => (
          <li key={day.day} className="relative pl-7">
            <span
              aria-hidden
              className="absolute left-0 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
            >
              {day.day}
            </span>
            <span
              aria-hidden
              className="absolute bottom-0 left-[9px] top-7 w-px bg-border last:hidden"
            />

            <h4 className="font-display text-base font-semibold tracking-tight text-foreground">
              <span className="sr-only">Day {day.day}: </span>
              {day.title}
            </h4>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{day.summary}</p>

            {day.stops.length > 0 && (
              <ul className="mt-3 space-y-2">
                {day.stops.map((stop, i) => (
                  <li key={`${day.day}-${stop.slug ?? i}`} className="flex gap-2.5 text-sm">
                    <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {stop.timeOfDay && (
                          <span className="mr-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                            {stop.timeOfDay}
                          </span>
                        )}
                        {stop.href ? (
                          <Link
                            href={stop.href}
                            className="underline decoration-primary/35 underline-offset-4 hover:decoration-primary"
                          >
                            {stop.title}
                          </Link>
                        ) : (
                          stop.title
                        )}
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{stop.note}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {day.meals.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {day.meals.map((meal, i) => (
                  <li key={`${day.day}-meal-${i}`} className="flex gap-2.5 text-sm">
                    <UtensilsCrossed aria-hidden className="mt-0.5 size-4 shrink-0 text-secondary" />
                    <p className="text-muted-foreground">
                      <span className="capitalize text-foreground">{meal.slot}</span>{" "}
                      {meal.href ? (
                        <Link href={meal.href} className="underline decoration-primary/35 underline-offset-4">
                          {meal.suggestion}
                        </Link>
                      ) : (
                        meal.suggestion
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {day.stay && (
              <p className="mt-3 flex gap-2.5 text-sm text-muted-foreground">
                <BedDouble aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  {day.stay.href ? (
                    <Link href={day.stay.href} className="font-medium text-foreground underline underline-offset-4">
                      {day.stay.title}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{day.stay.title}</span>
                  )}
                  {day.stay.note ? ` — ${day.stay.note}` : null}
                </span>
              </p>
            )}

            {day.travelNotes && (
              <p className="mt-3 flex gap-2.5 text-xs leading-relaxed text-muted-foreground">
                <Route aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span>{day.travelNotes}</span>
              </p>
            )}

            {day.estimatedCostInr ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Roughly <span className="font-medium text-foreground">{inr(day.estimatedCostInr)}</span> per person.
              </p>
            ) : null}
          </li>
        ))}
      </ol>

      {(plan.packingNotes?.length || plan.permitsAndSafety?.length) && (
        <footer className="mt-6 space-y-4 border-t border-border pt-4">
          {plan.packingNotes?.length ? (
            <div>
              <p className="eyebrow mb-2 text-[10px] text-muted-foreground">Pack</p>
              <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground marker:text-accent">
                {plan.packingNotes.map((note, i) => (
                  <li key={`pack-${i}`}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {plan.permitsAndSafety?.length ? (
            <div className="rounded-[var(--radius)] bg-surface-sunken p-3">
              <p className="eyebrow mb-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                <Info aria-hidden className="size-3.5" />
                Permits &amp; safety — verify before you go
              </p>
              <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-muted-foreground marker:text-warning">
                {plan.permitsAndSafety.map((note, i) => (
                  <li key={`safety-${i}`}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </footer>
      )}
    </article>
  );
}
