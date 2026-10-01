import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAboutPrinciples, getAboutThemes } from "@/lib/data/content";
import { iconFor } from "@/lib/icons";
import { Lede, Prose, PullQuote } from "@/components/content/prose";
import { PageHero } from "@/components/content/page-hero";
import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Discover Manipur is an open-source, community-run travel platform for Manipur. Why Manipur, what we are building, and how the six focus areas shape it.",
  openGraph: {
    title: "About Discover Manipur — an open-source platform for Manipur",
    description:
      "Why Manipur, what the platform does, and how it puts local hosts and honest information first.",
  },
};

export default async function AboutPage() {
  const [themes, principles] = await Promise.all([getAboutThemes(), getAboutPrinciples()]);

  return (
    <>
      <PageHero
        eyebrow="About"
        title="A field guide to a place most people have only read about."
        meiteiTitle="ꯃꯅꯤꯄꯨꯔ"
        lede="A travel platform for Manipur, built in the open — for looking closely rather than passing through. Sixteen districts, one valley ringed by hills, and the people who keep it."
        image={{
          src: "/file-uploads/loktakView.webp",
          alt: "A woman in a red phanek poles a wooden canoe past a thatched hut on a floating phumdi, through water lilies on Loktak Lake at dusk",
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="accent">Sixteen districts</Badge>
          <Badge variant="outline">Built in the open</Badge>
        </div>
      </PageHero>

      <Section className="pt-10 md:pt-14">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow text-muted-foreground">Why Manipur</p>
            <h2 className="mt-4 font-display text-3xl leading-tight md:text-[2.6rem]">
              The problem was never the place.
            </h2>
          </Reveal>

          <Reveal delayIndex={1} className="lg:col-span-7">
            <Prose>
              <p>
                Manipur has a lake with islands that float and drift, a valley ringed by hills that
                hold cloud until mid-morning, a market run entirely by women that has stood for
                centuries, a dance form recognised across the world, and a textile tradition that
                many households still practise at home.
              </p>
              <p>
                What it has not had is a way for a curious traveller to find any of that in one
                place. Search for a homestay near Loktak and you will find a phone number on a
                forum from 2017. Ask what a permit involves and you will get five different
                answers. Ask how to reach a village in Ukhrul and the honest answer is that you
                need to know someone.
              </p>
              <p>
                That gap is not a marketing problem. It is an information problem, and it costs
                the people who live here the most — because the visitor who cannot plan a trip
                simply goes somewhere else, and the income goes with them.
              </p>
            </Prose>

            <PullQuote attribution="The premise this project is built on">
              A destination does not become visible because someone calls it hidden. It becomes
              visible when the practical details are written down.
            </PullQuote>
          </Reveal>
        </div>
      </Section>

      <section className="relative">
        <div className="shell">
          <Reveal className="grid gap-4 md:grid-cols-12 md:gap-6">
            <div className="relative aspect-4/5 overflow-hidden rounded-[var(--radius-lg)] bg-surface-sunken md:col-span-5">
              <Image
                src="/file-uploads/dance.jpg"
                alt="Dancers in stiff embroidered skirts and translucent conical veils, hands raised mid-gesture during a Ras Leela performance"
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-4/5 overflow-hidden rounded-[var(--radius-lg)] bg-surface-sunken md:col-span-7 md:aspect-16/11 md:self-end">
              <Image
                src="/file-uploads/Hills.jpg"
                alt="Rolling green hills layered into the distance with mist settling in the valleys between them at first light"
                fill
                sizes="(max-width: 768px) 100vw, 56vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <Section
        eyebrow="What Discover Manipur does"
        title="Six things, done properly, instead of twenty done thinly."
        description="Everything below is built and in the codebase. Nothing here describes a feature we have only talked about."
      >
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <Prose>
              <h3>A catalogue you can actually plan from</h3>
              <p>
                Places, homestays, experiences, eateries, transport and multi-day tours, each with
                the details a trip actually turns on: what it costs, how far it is from Imphal, how
                long to allow, which season suits it, and whether a wheelchair can get in.
              </p>

              <h3>Hosts with names</h3>
              <p>
                A homestay listing carries the host&apos;s own story. An experience carries the name
                of the weaver, cook or guide leading it, the languages they speak, and the maximum
                group size — because a workshop for six is a different thing from a workshop for
                thirty.
              </p>

              <h3>An AI concierge that stays on the map</h3>
              <p>
                Give it your dates, your pace and what you care about, and it drafts an itinerary
                from the same catalogue the rest of the site uses — so it cannot recommend a
                homestay that does not exist. It is paused on the live site for now, and the{" "}
                <Link href="/plan">planner</Link> shows a sample conversation instead.
              </p>

              <h3>A responsible-travel layer that is not decorative</h3>
              <p>
                Loktak&apos;s phumdis, the sangai&apos;s habitat, photography consent, fair pay for
                guides, buying handloom directly from the person who wove it. Written as{" "}
                <Link href="/responsible-travel">specific asks</Link>, not as a slogan.
              </p>
            </Prose>
          </Reveal>

          <Reveal delayIndex={1} className="lg:col-span-5">
            <div className="relative aspect-square overflow-hidden rounded-[var(--radius-lg)] bg-surface-sunken">
              <Image
                src="/file-uploads/kha1.jpg"
                alt="A busy covered market aisle, vendors seated behind baskets of produce, dried fish and garlands of marigold"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Ima Keithel in Imphal — a market run by women, and one of the places a visitor can
              contribute to the local economy most directly.
            </p>
          </Reveal>
        </div>
      </Section>

      <Section
        className="bg-surface-sunken"
        eyebrow="Local hosts"
        title="Who this is supposed to be good for."
      >
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <Prose>
              <p>
                A homestay in Manipur is often one family, two spare rooms and a WhatsApp number
                shared by word of mouth. That model is generous and fragile at once: it works
                beautifully for the guest who already knows about it, and not at all for anyone
                else.
              </p>
              <p>
                Discover Manipur is built so that a host does not need a marketing budget or a booking
                system to be found. A listing is a page: their story, their photographs, their
                rules, their price, their district. The platform&apos;s job is to be the road
                between that page and the person looking for it.
              </p>
              <p>
                The same applies to guides, weavers, cooks and drivers. Experiences are priced per
                person and capped by group size so a host can say no to a coach party without
                losing the listing, and the{" "}
                <Link href="/responsible-travel">responsible travel</Link> guidance asks visitors
                to pay guides properly rather than to bargain them down.
              </p>
            </Prose>
          </Reveal>

          <Reveal delayIndex={1} className="lg:col-span-5">
            <div className="relative aspect-3/4 overflow-hidden rounded-[var(--radius-lg)] bg-surface">
              <Image
                src="/file-uploads/phanek.jpeg"
                alt="Folded handwoven cloth in magenta, lime, saffron and indigo stacked in pairs, temple-border motifs along each edge"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Handwoven cloth. Bought from the weaver, almost all of the money stays with the
              household that made it.
            </p>
          </Reveal>
        </div>
      </Section>

      <Section
        eyebrow="What we focus on"
        title="The six briefs, and what we built against each."
        description="Six things a traveller actually needs from a destination site, and what we built against each."
      >
        <ul className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme, i) => {
            const Icon = iconFor(theme.icon);
            return (
              <Reveal as="li" key={theme.name} delayIndex={i % 3} className="bg-surface">
                <div className="flex h-full flex-col gap-4 p-7 md:p-8">
                  <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-xl leading-snug">{theme.name}</h3>
                  <p className="text-[0.95rem] leading-relaxed text-muted-foreground">
                    {theme.body}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </Section>

      <Section eyebrow="How we work" title="Four rules we hold ourselves to.">
        <dl className="grid gap-x-16 gap-y-12 md:grid-cols-2">
          {principles.map((p, i) => (
            <Reveal key={p.title} delayIndex={i % 2}>
              <dt className="font-display text-xl">{p.title}</dt>
              <dd className="mt-3 max-w-[52ch] leading-relaxed text-muted-foreground">{p.body}</dd>
            </Reveal>
          ))}
        </dl>
      </Section>

      <Section className="pb-28 pt-0 md:pb-36">
        <Reveal>
          <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-loktak-900 p-8 text-cream-50 md:p-14">
            <div className="grain absolute inset-0" aria-hidden="true" />
            <div className="relative max-w-[62ch]">
              <p className="eyebrow mb-5 text-kangla-400">An honest note</p>
              <Lede className="text-cream-50 dark:text-cream-50">
                Discover Manipur is a community project, not a tour operator.
              </Lede>
              <div className="mt-6 space-y-5 leading-relaxed text-cream-200/90">
                <p>
                  We do not run properties, employ guides, take payments or hold commercial
                  partnerships with any of the businesses described on this site. It is open source
                  and run by volunteers, and it is not an official government service. A booking
                  made here is a request saved with your account, not a contract, and nothing on the
                  platform should be treated as a confirmed reservation.
                </p>
                <p>
                  Some stay, food, experience and transport listings are still sample entries rather
                  than real businesses, and prices and timings can be out of date. Before you travel,
                  check permit requirements, road conditions and
                  current government travel advisories with official sources — we say this on every
                  page where it matters, and we mean it.
                </p>
              </div>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild variant="accent" size="lg">
                  <Link href="/hotspots">Start with the places</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-cream-200/35 text-cream-50 hover:bg-cream-50/10"
                >
                  <Link href="/contact">Get in touch</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
