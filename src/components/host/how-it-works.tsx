import { getHostSteps } from "@/lib/data/content";
import { iconFor } from "@/lib/icons";
import { Reveal } from "@/components/motion/reveal";


export async function HowItWorks() {
  const STEPS = (await getHostSteps()).map((c) => ({ ...c, icon: iconFor(c.icon) }));

  return (
    <ol className="relative grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {STEPS.map((step, i) => (
        <li key={step.title} className="h-full">
          <Reveal delayIndex={i} className="flex h-full flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-sm)]">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <step.icon className="size-5" aria-hidden="true" />
              </span>
              <span className="font-display text-3xl text-brass-600" aria-hidden="true">
                0{i + 1}
              </span>
            </div>
            <h3 className="font-display text-xl leading-snug">{step.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
