import type { Metadata } from "next";

import { isAIConfigured } from "@/lib/ai";

import { PlanClient } from "./plan-client";

export const metadata: Metadata = {
  title: "AI Concierge — plan your Manipur trip",
  description:
    "Tell the Manipur Tourism concierge how long you have and what you're drawn to, and get a day-by-day Manipur itinerary built from real places, homestays and kitchens on this site.",
  alternates: { canonical: "/plan" },
  openGraph: {
    title: "AI Concierge — plan your Manipur trip · Manipur Tourism",
    description:
      "A warm, knowledgeable Manipur travel host. Ask anything, or let it build you a day-by-day plan from Manipur Tourism's own catalogue.",
    url: "/plan",
    type: "website",
  },
};

export default function PlanPage() {
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
            Not a chatbot reciting brochures. Ask it anything about Manipur and it answers from Manipur Tourism&apos;s own
            catalogue — real places, real homestays, real kitchens — and links you straight to them. It will also tell
            you, plainly, when it doesn&apos;t know.
          </p>
        </header>

        <PlanClient aiConfigured={isAIConfigured} />
      </div>
    </div>
  );
}
