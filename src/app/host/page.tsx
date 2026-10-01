import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getHostGallery, getHostWeHandle, getHostWhy } from "@/lib/data/content";
import { iconFor } from "@/lib/icons";
import { EarningsEstimator } from "@/components/host/earnings-estimator";
import { HostFaq } from "@/components/host/host-faq";
import { HowItWorks } from "@/components/host/how-it-works";
import { Section } from "@/components/layout/section";
import { Reveal, RevealText } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Become a host",
  description:
    "Share a room, a kitchen, a loom or a route you have walked all your life. Discover Manipur brings travellers to Manipuri families, cooks, guides and weavers. You set the price and the rules.",
};

export default async function HostLandingPage() {
  const [why, weHandle, gallery] = await Promise.all([
    getHostWhy(),
    getHostWeHandle(),
    getHostGallery(),
  ]);
  // The content rows store icon names; resolve them to components once here.
  const WHY = why.map((c) => ({ ...c, icon: iconFor(c.icon) }));
  const WE_HANDLE = weHandle.map((c) => ({ ...c, icon: iconFor(c.icon) }));
  const GALLERY = gallery;

  return (
    <>
      <section className="pb-16 pt-28 md:pb-24 md:pt-32">
        <div className="shell grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-5 flex items-center gap-3 text-muted-foreground">
              <span className="weave-rule inline-block h-[3px] w-10 rounded-full" />
              Host with Discover Manipur
            </p>
            <RevealText
              as="h1"
              text="Your home already knows how to welcome people."
              className="text-headline"
            />
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              A spare room around the courtyard. A kitchen that turns out eromba and singju every
              evening. A loom in the back shed. A ridge you have walked since you were nine. Travellers
              come to Manipur for exactly these, and Discover Manipur puts them in front of the families,
              cooks, guides and weavers who have them.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/host/apply">
                  Start your application
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/host/guidelines">Read the hosting standards</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Free to apply · no commission · reviewed by our admins
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]">
              <Image
                src="/file-uploads/share.png"
                alt="A Manipuri host welcoming guests onto the veranda of a family home"
                width={900}
                height={700}
                preload
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="h-[320px] w-full object-cover md:h-[460px]"
              />
            </div>
            <div className="glass mt-4 rounded-[var(--radius-lg)] p-5 md:absolute md:-bottom-8 md:-left-6 md:mt-0 md:max-w-[15rem]">
              <p className="text-sm text-muted-foreground">Hosts across</p>
              <p className="font-display text-3xl leading-none">16 districts</p>
              <p className="mt-2 text-sm text-muted-foreground">
                from Thanga&rsquo;s lake edge to the Shirui ridge
              </p>
            </div>
          </div>
        </div>
      </section>

      <Section
        eyebrow="Why host"
        title="Three reasons to list your home here"
        className="bg-surface-sunken"
      >
        <ul className="grid gap-6 md:grid-cols-3">
          {WHY.map((item, i) => (
            <li key={item.title}>
              <Reveal
                delayIndex={i}
                className="flex h-full flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-7"
              >
                <span className="mb-5 flex size-11 items-center justify-center rounded-full bg-accent/18 text-kangla-600">
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-display text-xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        eyebrow="What to expect"
        title="You cook, host and guide. Here is what the platform does today."
        description="Hosting is free and run by volunteers. Some of this is live now and some is still being built."
      >
        <ul className="grid gap-6 sm:grid-cols-2">
          {WE_HANDLE.map((item, i) => (
            <li key={item.title}>
              <Reveal delayIndex={i} className="flex h-full gap-4 rounded-[var(--radius-lg)] border border-border p-6">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display text-lg leading-snug">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        eyebrow="Earnings"
        title="What could a month look like?"
        description="Move the sliders to your own price and your own availability. This is an honest estimate, not a promise. Demand in Manipur is seasonal and your costs are your own."
        className="bg-surface-sunken"
      >
        <EarningsEstimator />
      </Section>

      <Section eyebrow="How it works" title="Four steps, about fifteen minutes to begin">
        <HowItWorks />
      </Section>

      <Section
        eyebrow="What guests come for"
        title="The ordinary things you already do"
        className="bg-surface-sunken"
      >
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {GALLERY.map((photo, i) => (
            <li key={photo.src}>
              <Reveal delayIndex={i} className="overflow-hidden rounded-[var(--radius)]">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={600}
                  height={450}
                  sizes="(min-width: 768px) 30vw, 45vw"
                  className="h-40 w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 md:h-56"
                />
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      <Section eyebrow="Questions" title="What hosts ask us first">
        <HostFaq />
      </Section>

      <section className="pb-24">
        <div className="shell">
          <div className="grain relative overflow-hidden rounded-[var(--radius-lg)] bg-primary px-6 py-16 text-center text-primary-foreground md:px-16">
            <h2 className="font-display text-3xl leading-tight md:text-5xl">
              Ready when you are
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-primary-foreground/80">
              Start the application now, save it half-finished in this browser, and come back to
              it. When you submit, our admins review it; nothing is published until it is approved,
              and nothing is ever charged.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href="/host/apply">
                  Apply to host
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-ivory-50/50 text-ivory-50 hover:bg-ivory-50 hover:text-ningthou-900"
              >
                <Link href="/host/guidelines">Hosting standards</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
