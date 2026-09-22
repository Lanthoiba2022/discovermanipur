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
 */
export function LegalBody({
  sections,
  tocLabel = "On this page",
}: {
  sections: LegalSection[];
  tocLabel?: string;
}) {
  return (
    <div className="shell pb-24 md:pb-32">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <nav
          aria-label={tocLabel}
          className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start xl:col-span-3"
        >
          <p className="eyebrow mb-4 text-muted-foreground">{tocLabel}</p>
          <ol className="space-y-1 border-l border-border">
            {sections.map((section, i) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="-ml-px flex gap-3 border-l-2 border-transparent py-2 pl-4 text-sm text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
                >
                  <span className="tabular-nums pt-0.5 text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{section.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="lg:col-span-8 xl:col-span-9">
          {sections.map((section, i) => (
            <Reveal key={section.id} as="section" className="scroll-mt-28 pt-12 first:pt-0">
              <div id={section.id} className="scroll-mt-28">
                <p className="eyebrow mb-3 text-brass-700">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h2 className="font-display text-2xl leading-tight md:text-3xl">{section.title}</h2>
                <Prose className="mt-6">{section.body}</Prose>
              </div>
              <hr className="mt-12 border-border" />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
