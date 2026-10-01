import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { Reveal } from "@/components/motion/reveal";

const PREVIEW = [
  {
    from: "you" as const,
    text: "Four days in October. Two of us, we like water, food and walking. No early flights.",
  },
  {
    from: "guide" as const,
    text: "Then base yourself in Imphal for two nights and Moirang for two. Day 1 Kangla and Ima Keithel, with singju at the market. Day 2 a dawn boat through the Loktak phumdis, Sendra for lunch, Keibul Lamjao in the afternoon for the sangai.",
  },
  {
    from: "you" as const,
    text: "Can we add a loom day?",
  },
  {
    from: "guide" as const,
    text: "Yes — a half-day loin-loom session near Wangkhei fits on day 3, and I'll move the Andro pottery village to the morning so nothing clashes.",
  },
];

/**
 * The concierge conversion moment.
 *
 * One call to action, and only one: the panel carries a single accent button
 * (ink-950 on brass-500 — 6.4:1, comfortably past the 4.5:1 bar for the label
 * against its own fill). The transcript beside it is `aria-hidden` illustration,
 * not content, so a screen reader is not read four fake chat messages.
 */
export function ConciergeTeaser() {
  return (
    <section className="chapter-light py-[clamp(4rem,7vw,6rem)]" aria-label="AI concierge">
      <div className="shell-tight">
        <Reveal className="relative isolate grid grid-cols-1 items-center gap-10 overflow-hidden rounded-[var(--radius-lg)] bg-ink-950 p-7 md:gap-14 md:p-12 lg:grid-cols-[0.95fr_1fr] lg:p-14">
          <div
            aria-hidden
            className="dawn-wash pointer-events-none absolute -left-16 -top-24 -z-10 size-[34rem] opacity-40"
          />

          <div>
            <p className="eyebrow rule-flank rule-flank-start mb-6 text-brass-400">
              <Sparkles aria-hidden className="size-4" />
              <span>AI concierge</span>
            </p>

            <h2 className="text-ivory-50">
              <span className="font-display block text-[clamp(1.875rem,1.2rem+2.2vw,3rem)] leading-[1.06] tracking-[-0.018em]">
                Tell it how you travel.
              </span>{" "}
              <span className="section-completion mt-3 block text-brass-300">
                Get a Manipur itinerary that actually fits.
              </span>
            </h2>

            <p className="mt-6 max-w-md text-base leading-relaxed text-ivory-50/75">
              Days, distances, seasons and opening hours — worked out against real
              places, stays and experiences on Discover Manipur, not guesswork.
            </p>

            <Button asChild variant="accent" size="lg" className="mt-9">
              <Link href="/plan">
                Plan with Discover Manipur
                <ArrowUpRight aria-hidden className="size-4" />
              </Link>
            </Button>
          </div>

          <div aria-hidden className="glass rounded-[var(--radius-lg)] p-4 md:p-6">
            <p className="eyebrow mb-5 flex items-center gap-2 text-foreground/60">
              <span className="size-2 rounded-full bg-success" />
              Discover Manipur concierge
            </p>
            <ul className="flex flex-col gap-3">
              {PREVIEW.map((m, i) => (
                <li
                  key={i}
                  className={
                    m.from === "you"
                      ? "ml-auto max-w-[85%] rounded-[var(--radius)] rounded-br-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground"
                      : "mr-auto max-w-[92%] rounded-[var(--radius)] rounded-bl-sm bg-surface px-4 py-3 text-sm leading-relaxed text-foreground shadow-[var(--shadow-sm)]"
                  }
                >
                  {m.text}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-center text-xs text-foreground/50">
              A preview of a real conversation.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
