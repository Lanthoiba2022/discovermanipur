import { HandCoins, MessageCircle, Store } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";

const POINTS = [
  {
    icon: Store,
    title: "No cart, no checkout",
    body: "There is nothing to add to a basket here. Every listing is a maker's shopfront, written up properly.",
  },
  {
    icon: MessageCircle,
    title: "The enquiry goes to the artisan",
    body: "You get their own phone number and, where they have one, their site. The conversation is yours and theirs.",
  },
  {
    icon: HandCoins,
    title: "Nothing is skimmed off",
    body: "No commission, no listing fee, no payment held in the middle. The full price reaches the person who made the thing.",
  },
];

/** The honest stance, stated once, plainly. */
export function NoCommissionBand() {
  return (
    <section aria-labelledby="how-it-works-heading" className="rounded-[var(--radius-lg)] border border-border bg-surface-sunken p-6 md:p-10">
      <h2 id="how-it-works-heading" className="font-display text-2xl">
        How buying works here
      </h2>
      <ul className="mt-6 grid gap-6 md:grid-cols-3">
        {POINTS.map((point, index) => (
          <Reveal as="li" key={point.title} delayIndex={index} className="flex flex-col gap-2">
            <point.icon className="size-5 text-primary" aria-hidden="true" />
            <h3 className="font-display text-lg leading-tight">{point.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{point.body}</p>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
