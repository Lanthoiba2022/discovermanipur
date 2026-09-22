import Image from "next/image";
import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export interface PageHeroImage {
  src: string;
  alt: string;
}

/**
 * Shared opening block for the content routes. Always carries the `pt-28
 * md:pt-32` offset the fixed, transparent header needs.
 */
export function PageHero({
  eyebrow,
  title,
  lede,
  meiteiTitle,
  image,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  meiteiTitle?: string;
  image?: PageHeroImage;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative pt-28 md:pt-32", className)}>
      <div className="shell">
        <div className="grid items-end gap-10 pb-6 pt-10 md:pb-10 md:pt-16 lg:grid-cols-12 lg:gap-14">
          <Reveal className={cn(image ? "lg:col-span-7" : "lg:col-span-9")}>
            <p className="eyebrow mb-5 flex items-center gap-3 text-muted-foreground">
              <span className="weave-rule inline-block h-[3px] w-10 rounded-full" />
              {eyebrow}
            </p>
            <h1 className="text-headline">
              {title}
              {meiteiTitle && (
                <span className="mt-3 block font-mayek text-2xl font-normal tracking-normal text-brass-600 md:text-3xl">
                  {meiteiTitle}
                </span>
              )}
            </h1>
            {lede && (
              <p className="mt-7 max-w-[58ch] text-lg leading-relaxed text-muted-foreground md:text-xl">
                {lede}
              </p>
            )}
            {children && <div className="mt-9">{children}</div>}
          </Reveal>

          {image && (
            <Reveal delayIndex={1} className="lg:col-span-5">
              <div className="relative aspect-4/5 w-full overflow-hidden rounded-[var(--radius-lg)] bg-surface-sunken sm:aspect-3/2 lg:aspect-4/5">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  preload
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
