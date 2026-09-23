import type { ReactNode } from "react";

import { Prose } from "@/components/content/prose";
import { Reveal } from "@/components/motion/reveal";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/**
 * Table-of-contents + anchored sections layout used by /privacy, /terms and
 * /accessibility. The TOC is a real nav landmark and sticks on large screens.
 *
 * Sits on the middle rung of the measure ladder: the page has already opened
 * at full width in the hero, and a legal document should narrow from there.
 * Every anchor target carries a scroll margin matching the fixed header, so a
 * heading jumped to from the TOC is never hidden behind the bar.
 */
export function LegalBody({
  sections,
  tocLabel = "On this page",
}: {
  sections: LegalSection[];
  tocLabel?: string;
}) {
  return (
    <div className="shell-mid pb-24 pt-14 md:pb-32 md:pt-20">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <nav
          aria-label={tocLabel}
          className="lg:col-span-4 lg:sticky lg:top-32 lg:self-start xl:col-span-3"
        >
          <p className="eyebrow rule-flank rule-flank-start mb-4 text-brass-700 [.dark_&]:text-brass-300">{tocLabel}</p>
          <ol className="space-y-1 border-l border-border">
            {sections.map((section, i) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="-ml-px flex gap-3 border-l-2 border-transparent py-2 pl-4 text-sm text-muted-foreground transition-colors duration-200 ease-[var(--ease-flat)] hover:border-accent hover:text-foreground focus-visible:border-accent focus-visible:text-foreground"
                >
                  <span className="pt-0.5 text-xs tabular-nums text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{section.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0 lg:col-span-8 xl:col-span-9">
          {sections.map((section, i) => (
            <Reveal key={section.id} as="section" className="pt-14 first:pt-0">
              <div id={section.id} className="scroll-mt-28 md:scroll-mt-32">
                <p className="eyebrow mb-3 text-brass-700 [.dark_&]:text-brass-300">{String(i + 1).padStart(2, "0")}</p>
                <h2 className="text-title">{section.title}</h2>
                <Prose className="mt-6">{section.body}</Prose>
              </div>
              <hr className="mt-14 border-border" />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
