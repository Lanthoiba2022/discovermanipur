import type { Metadata } from "next";
import Link from "next/link";

import { NoteBox } from "@/components/content/prose";
import { PageHero } from "@/components/content/page-hero";
import { Button } from "@/components/ui/button";
import { getAllFaqItems, getFaqGroups } from "@/lib/data/content";
import { FaqBrowser } from "./faq-browser";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Permits and planning, getting to Manipur, homestays and booking, food, festivals and timing, accessibility and hosting, answered and searchable.",
  openGraph: {
    title: "Manipur travel FAQ",
    description:
      "Inner Line Permits, monsoon roads, what to eat first, festival timing and accessibility, in plain language.",
  },
};

function buildFaqJsonLd(allFaqItems: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export default async function FaqPage() {
  const [groups, allFaqItems] = await Promise.all([getFaqGroups(), getAllFaqItems()]);
  const faqJsonLd = buildFaqJsonLd(allFaqItems);

  return (
    <>
      <script
        type="application/ld+json"
        // FAQ rows come from the database: escape "<" so a "</script>" in an
        // answer cannot close this tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />

      <PageHero
        eyebrow="Questions"
        title="The things people actually ask before they come."
        lede="Grouped, searchable and written the way a host would answer them. Where the honest answer is “check with an official source”, that is what it says."
      />

      <div className="shell pb-28 md:pb-36">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="min-w-0 lg:col-span-8">
            <FaqBrowser groups={groups} />
          </div>

          <aside className="lg:col-span-4 lg:sticky lg:top-32 lg:self-start">
            <NoteBox title="Permits change" tone="warning" className="mt-0">
              <p>
                Inner Line Permit categories and Protected Area rules for foreign nationals have
                both changed by notification in recent years. Confirm what applies to you with the
                Government of Manipur, Discover Manipur and (for non-Indian passports) the Ministry
                of Home Affairs before you book travel.
              </p>
            </NoteBox>

            <div className="rounded-[var(--radius-lg)] border border-border bg-surface-sunken p-6">
              <h2 className="font-display text-xl">Still stuck?</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                If the answer is not here, ask us directly. We would also like to know which
                question you expected to find; it tells us what to write next.
              </p>
              <Button asChild variant="primary" className="mt-6 w-full">
                <Link href="/contact">Ask a question</Link>
              </Button>
              <Button asChild variant="ghost" className="mt-2 w-full">
                <Link href="/responsible-travel">Read the travel guidance</Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
