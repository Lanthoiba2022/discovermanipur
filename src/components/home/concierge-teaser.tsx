import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

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

export function ConciergeTeaser() {
  return (
    <section className="py-20 md:py-28">
      <div className="shell">
        <Reveal className="grid grid-cols-1 items-center gap-10 overflow-hidden rounded-[var(--radius-lg)] bg-loktak-900 p-7 md:gap-14 md:p-12 lg:grid-cols-2 lg:p-16">
          <div>
            <p className="eyebrow mb-5 inline-flex items-center gap-2 text-kangla-400">
              <Sparkles aria-hidden className="size-4" />
              AI concierge
            </p>
            <h2 className="font-display text-3xl leading-[1.05] text-cream-50 sm:text-4xl md:text-5xl">
              Tell it how you travel. Get a Manipur itinerary that actually fits.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-cream-50/72">
              Days, distances, seasons and opening hours — worked out against real places,
              stays and experiences on Manipur Tourism, not guesswork.
            </p>
            <Button asChild variant="accent" size="lg" className="mt-8">
              <Link href="/plan">
                Plan with Manipur Tourism
                <ArrowUpRight aria-hidden className="size-4" />
              </Link>
            </Button>
          </div>

          <div
            aria-hidden
            className="glass rounded-[var(--radius-lg)] p-4 md:p-6"
          >
            <p className="eyebrow mb-4 flex items-center gap-2 text-foreground/60">
              <span className="size-2 rounded-full bg-success" />
              Manipur Tourism concierge
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
            <p className="mt-4 text-center text-xs text-foreground/50">
              A preview of a real conversation.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
