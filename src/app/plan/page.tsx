import type { Metadata } from "next";

import { buildShowcase, isAIConfigured, isConciergeLive } from "@/lib/ai";

import { PlanClient } from "./plan-client";

export const metadata: Metadata = {
  title: "AI Concierge: plan your Manipur trip",
  description:
    "Tell the Discover Manipur concierge how long you have and what you're drawn to, and get a day-by-day Manipur itinerary built from real places, homestays and kitchens on this site.",
  alternates: { canonical: "/plan" },
  openGraph: {
    title: "AI Concierge: plan your Manipur trip · Discover Manipur",
    description:
      "A warm, knowledgeable Manipur travel host. Ask anything, or let it build you a day-by-day plan from Discover Manipur's own catalogue.",
    url: "/plan",
    type: "website",
  },
};

export default async function PlanPage() {
  // Built on the server so the sample's cards carry real prices and real links.
  const showcase = isConciergeLive ? [] : await buildShowcase();

  return (
    <div className="pb-20 pt-28 md:pb-28 md:pt-32">
      <div className="shell">
        <header className="mb-10 max-w-3xl md:mb-12">
          <p className="eyebrow mb-4 flex items-center gap-3 text-muted-foreground">
            <span aria-hidden className="weave-rule inline-block h-[3px] w-10 rounded-full" />
            AI Concierge
          </p>
          <h1 className="text-headline">Plan it with someone who knows the roads</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Not a chatbot reciting brochures. Ask it anything about Manipur and it answers from Discover Manipur&apos;s own
            catalogue (real places, real homestays, real kitchens) and links you straight to them. It will also tell
            you, plainly, when it doesn&apos;t know.
          </p>
        </header>

        <PlanClient aiConfigured={isAIConfigured} live={isConciergeLive} showcase={showcase} />
      </div>
    </div>
  );
}
