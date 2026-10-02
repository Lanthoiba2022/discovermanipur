import type { Metadata } from "next";
import Image from "next/image";

import { IntentLink } from "@/components/shared/intent-link";
import { getPledgeItems, getResponsibleQuickAsks } from "@/lib/data/content";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/og";
import { Lede, NoteBox, Prose, PullQuote } from "@/components/content/prose";
import { PageHero } from "@/components/content/page-hero";
import { VisitorPledge } from "@/components/content/visitor-pledge";
import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Responsible travel in Manipur",
  description:
    "Loktak's phumdis, the sangai of Keibul Lamjao, village etiquette, buying handloom directly from weavers, waste on trek routes, photography consent and fair pay, plus a visitor pledge.",
  openGraph: {
    title: "Responsible travel in Manipur",
    description:
      "What is actually under pressure here, and the specific things a visitor can do about it.",
    // A page-level openGraph replaces the inherited one wholesale, so without
    // this the root card is dropped and shares unfurl with no picture.
    images: [DEFAULT_OG_IMAGE],
  },
};


export default async function ResponsibleTravelPage() {
  const [quickAsks, pledge] = await Promise.all([getResponsibleQuickAsks(), getPledgeItems()]);

  return (
    <>
      <PageHero
        eyebrow="Responsible travel"
        title="Manipur can absorb visitors. It cannot absorb carelessness."
        lede="This page is not a badge. It is a list of things that are genuinely under strain here, and the specific choices a visitor can make about each one."
        image={{
          src: "/file-uploads/lok1.jpg",
          alt: "Aerial view of Loktak Lake: dark blue water threaded with rings and crescents of floating green vegetation, a solitary hut on one of them",
        }}
      />

      {/* -------------------------------- Quick asks ------------------------- */}
      <Section className="pt-6 md:pt-10">
        <Reveal>
          <p className="eyebrow mb-6 text-muted-foreground">If you read nothing else</p>
        </Reveal>
        <ul className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {quickAsks.map((ask, i) => (
            <Reveal as="li" key={ask.label} delayIndex={i % 3} className="bg-surface">
              <div className="h-full p-6 md:p-7">
                <p className="font-display text-lg leading-snug">{ask.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ask.detail}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* -------------------------------- Loktak ----------------------------- */}
      <Section className="bg-surface-sunken">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow text-muted-foreground">01 · The lake</p>
            <h2 className="mt-4 font-display text-3xl leading-tight md:text-[2.6rem]">
              Loktak is a living system, not a viewpoint.
            </h2>
            <div className="relative mt-8 aspect-4/5 overflow-hidden rounded-[var(--radius-lg)] bg-surface">
              <Image
                src="/file-uploads/loktakView.webp"
                alt="A wooden canoe poled through water lilies past a thatched hut built on a floating mat of vegetation"
                fill
                sizes="(max-width: 1024px) 100vw, 38vw"
                className="object-cover"
              />
            </div>
          </Reveal>

          <Reveal delayIndex={1} className="lg:col-span-7">
            <Prose>
              <p>
                The rings you see from the air are <strong>phumdis</strong>: floating mats of
                vegetation, soil and decomposing organic matter that drift across the surface and
                root into the lakebed when the water drops. They are the reason Loktak looks the way
                it does, and they are not scenery. They are habitat, they are grazing, and for
                generations of fishing families they were the material out of which a working life
                was built.
              </p>
              <p>
                Loktak is a Ramsar site (a wetland of international importance), and it has spent
                much of the last three decades on the Montreux Record, the register kept for Ramsar
                sites where the ecological character has changed or is likely to change. That
                listing is the formal way of saying what fishing communities have said for years:
                the lake is not well.
              </p>

              <h3>What is pressing on it</h3>
              <p>
                Water levels are held artificially high by a barrage built for hydropower at the
                lake&apos;s outflow, which suppresses the seasonal drying that phumdis need in order
                to root, draw nutrients from the lakebed and stay thick. Thinner phumdis support
                less life. Add nutrient runoff from the catchment, sediment washed down from
                deforested slopes, invasive aquatic weeds and plastic arriving with visitors, and
                you have a system being squeezed from several directions at once.
              </p>
              <p>
                None of that is a visitor&apos;s fault. But the last item on the list is entirely
                within a visitor&apos;s control.
              </p>

              <h3>On the water</h3>
              <ul>
                <li>
                  Take nothing disposable onto a boat that you are not prepared to bring back off
                  it. A bottle dropped over the side does not sink out of the story; it lodges in a
                  phumdi.
                </li>
                <li>
                  Hire local boatmen rather than the cheapest operator you can find online, and
                  agree the route and the price before you push off.
                </li>
                <li>
                  Treat the circular fishing enclosures as someone&apos;s workplace, because that is
                  what they are. Do not have your boat cut through them for a photograph.
                </li>
                <li>
                  Homes on the lake are homes. A long lens and a question are both better than
                  drifting up to a doorway.
                </li>
              </ul>
            </Prose>
          </Reveal>
        </div>
      </Section>

      {/* -------------------------------- Sangai ----------------------------- */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow text-muted-foreground">02 · The deer</p>
            <h2 className="mt-4 font-display text-3xl leading-tight md:text-[2.6rem]">
              The sangai lives in one place on earth.
            </h2>
            <Prose className="mt-8">
              <p>
                The sangai is the Manipur brow-antlered deer, and it is endemic: the wild population
                exists in Keibul Lamjao, on the southern reach of Loktak, and nowhere else in the
                world. The park is usually described as the only floating national park there is,
                because the deer live and feed on the phumdis themselves, walking on a surface that
                gives underfoot, which is where the animal&apos;s local reputation for a delicate,
                dancing gait comes from.
              </p>
              <p>
                It was declared extinct in the mid-twentieth century and then found again, in very
                small numbers, in this one wetland. The species remains listed as endangered on the
                IUCN Red List and its wild range is among the most restricted of any large mammal.
                Every pressure on the phumdis is, directly, a pressure on the sangai: thinner
                floating mats mean less of the only habitat it has.
              </p>

              <h3>Visiting Keibul Lamjao</h3>
              <ul>
                <li>
                  Go early. The deer are most active around dawn and late afternoon, and the light
                  is better for photographs that do not require you to get closer.
                </li>
                <li>
                  Stay on the marked paths, the watchtowers and the designated routes. Walking out
                  onto phumdi damages it and is dangerous for you.
                </li>
                <li>
                  No drones, no calls, no playback, no baiting an animal into a frame. If it has
                  moved because of you, you are too close.
                </li>
                <li>
                  Keep groups small and voices low, and take the forest staff&apos;s instructions as
                  instructions rather than suggestions.
                </li>
              </ul>
            </Prose>
          </Reveal>

          <Reveal delayIndex={1} className="lg:col-span-5">
            <div className="relative aspect-3/4 overflow-hidden rounded-[var(--radius-lg)] bg-surface-sunken">
              <Image
                src="/file-uploads/shiroi4.jpg"
                alt="A stem of pale pink bell-shaped Shirui lilies in flower on an open grassy hillside under a bright sky"
                fill
                sizes="(max-width: 1024px) 100vw, 38vw"
                className="object-cover"
              />
            </div>
            <NoteBox title="Also endemic, also fragile" className="mt-8">
              <p>
                The Shirui lily grows on the upper slopes of Shirui Kashong in Ukhrul and, like the
                sangai, is effectively found nowhere else. It flowers for a short window around the
                start of the monsoon, which is exactly when the hill is busiest. Stay on the path,
                do not pick anything, and do not walk into the grassland for a closer frame. The
                plant is already threatened by habitat change and trampling.
              </p>
            </NoteBox>
          </Reveal>
        </div>
      </Section>

      {/* -------------------------------- Villages --------------------------- */}
      <Section className="bg-surface-sunken">
        <Reveal>
          <p className="eyebrow text-muted-foreground">03 · People</p>
          <h2 className="mt-4 max-w-[20ch] font-display text-3xl leading-tight md:text-[2.6rem]">
            A village is not an exhibit.
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <Prose>
              <h3>Arriving well</h3>
              <p>
                Manipur is home to many communities (Meitei, Naga, Kuki-Zo, Pangal and others),
                with distinct languages, faiths, histories and customs, and a recent past that
                includes real conflict and displacement. Travel here with the assumption that you do
                not know the local context, because you almost certainly do not.
              </p>
              <ul>
                <li>
                  Where a village has a headman, a council or a host family coordinating visits, go
                  through them. Arriving unannounced puts your hosts in an awkward position.
                </li>
                <li>
                  Dress modestly, especially around temples, churches and sacred groves, and follow
                  whatever footwear rule the household uses.
                </li>
                <li>
                  Ask before entering a compound, a kitchen or a place of worship, and before
                  touching looms, instruments or ritual objects.
                </li>
                <li>
                  Do not photograph or discuss conflict-affected sites, displaced families or
                  security installations for content. Let people decide what of their own story they
                  want to tell you.
                </li>
                <li>
                  Learn a few words. <em>Khurumjari</em>, a Meiteilon greeting, goes further than
                  you would think.
                </li>
              </ul>
            </Prose>
          </Reveal>

          <Reveal delayIndex={1}>
            <Prose>
              <h3>Photography, specifically</h3>
              <p>
                Consent is the whole rule, and it is not implied by someone being visible. Ask,
                show the photograph if you can, and accept a refusal without negotiating. Children
                need a parent&apos;s consent, not their own enthusiasm.
              </p>
              <p>
                Rituals, funerals and religious performances are frequently off limits to cameras
                even when a crowd is present. If there is no one to ask, the answer is no. And if
                you intend to publish or sell an image of an identifiable person, say so at the time
                you ask, not afterwards.
              </p>

              <h3>Paying properly</h3>
              <p>
                Guiding, driving and hosting are skilled work, and the rates are already modest by
                most visitors&apos; standards. Agree a price up front, in writing if you can, and
                then pay it. Bargaining a guide down by a few hundred rupees is not a win; it is a
                transfer from the person with the least margin to the person with the most.
              </p>
              <p>
                Prefer arrangements where the money reaches the household directly: a homestay
                over a chain hotel, a village-run guide over an out-of-state agency, a meal cooked
                at your stay over a franchise.
              </p>
            </Prose>
          </Reveal>
        </div>
      </Section>

      {/* -------------------------------- Handloom --------------------------- */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <div className="relative aspect-4/3 overflow-hidden rounded-[var(--radius-lg)] bg-surface-sunken">
              <Image
                src="/file-uploads/phanek.jpeg"
                alt="Folded lengths of Manipuri phanek cloth in magenta, lime, orange and purple, each edged with a woven temple-point border"
                fill
                sizes="(max-width: 1024px) 100vw, 38vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delayIndex={1} className="lg:col-span-7">
            <p className="eyebrow text-muted-foreground">04 · The weave</p>
            <h2 className="mt-4 font-display text-3xl leading-tight md:text-[2.6rem]">
              Buy the cloth from the person who wove it.
            </h2>
            <Prose className="mt-8">
              <p>
                Manipur has one of the largest handloom-weaving workforces of any Indian state, and
                the overwhelming majority of those weavers are women working at home, often on a
                loin loom or a small frame loom in the front room. A phanek, an innaphi or a shawl
                can represent days of work, and the difference between buying it at the loom and
                buying it three intermediaries later is the difference between a fair day&apos;s
                wage and a fraction of one.
              </p>
              <ul>
                <li>
                  Buy at the market stall, the weavers&apos; cooperative or the household itself.
                  Ima Keithel in Imphal is run entirely by women traders and is a good place to
                  start.
                </li>
                <li>
                  Ask what the motif means and who wove it. Some designs belong to particular
                  communities and are not decorative patterns to be worn casually; a seller will
                  usually tell you if you ask.
                </li>
                <li>
                  Pay the asking price for handwoven work. Haggling is normal for many goods;
                  driving down the price of something that took four days on a loom is not.
                </li>
                <li>
                  Machine-made lookalikes exist and are cheaper. If the price seems impossible for
                  the labour involved, it probably is.
                </li>
              </ul>
            </Prose>
          </Reveal>
        </div>
      </Section>

      {/* -------------------------------- Waste ------------------------------ */}
      <Section className="bg-surface-sunken">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow text-muted-foreground">05 · Plastic and trails</p>
            <h2 className="mt-4 font-display text-3xl leading-tight md:text-[2.6rem]">
              Whatever you carry up, carry down.
            </h2>
            <Prose className="mt-8">
              <p>
                There is no waste collection on a ridge in Ukhrul, at a waterfall in Tamenglong or
                on a phumdi in Bishnupur. Anything left behind stays there, gets burned, or ends up
                in the water. Trek routes near the popular viewpoints already show it.
              </p>
              <ul>
                <li>
                  Carry a refillable bottle and a filter or purification tablets instead of buying
                  cases of single-use water.
                </li>
                <li>
                  Bring a dry bag for your own rubbish, including fruit peel and wet wipes, and take
                  it back to a town with collection.
                </li>
                <li>
                  Stay on the established path. Cutting a switchback starts an erosion channel that
                  the next monsoon widens.
                </li>
                <li>
                  No open fires outside designated spots, and no washing with soap or detergent in a
                  stream. It is someone&apos;s drinking water downhill.
                </li>
                <li>
                  If there is a village waste rule, follow it. If there is a local clean-up, join
                  it.
                </li>
              </ul>
            </Prose>
          </Reveal>

          <Reveal delayIndex={1} className="lg:col-span-5">
            <div className="relative aspect-4/5 overflow-hidden rounded-[var(--radius-lg)] bg-surface">
              <Image
                src="/file-uploads/Hills.jpg"
                alt="Layered grassy hills with mist pooling in the valleys, no visible path or settlement"
                fill
                sizes="(max-width: 1024px) 100vw, 38vw"
                className="object-cover"
              />
            </div>
            <PullQuote className="my-8" attribution="Leave No Trace, applied locally">
              If it was not growing there when you arrived, it should not be there when you leave.
            </PullQuote>
          </Reveal>
        </div>
      </Section>

      {/* -------------------------------- Advisory --------------------------- */}
      <Section>
        <Reveal className="max-w-[72ch]">
          <p className="eyebrow text-muted-foreground">06 · Before you book anything</p>
          <h2 className="mt-4 font-display text-3xl leading-tight md:text-[2.6rem]">
            Check the current rules yourself.
          </h2>
          <Lede className="mt-7">
            This is the part of the page we are least able to keep accurate, so we would rather send
            you somewhere authoritative than guess on your behalf.
          </Lede>
          <Prose className="mt-8">
            <p>
              Entry requirements for Manipur have changed more than once in recent years. Indian
              citizens from outside the state are generally required to hold an{" "}
              <strong>Inner Line Permit</strong>, and foreign nationals have at various points been
              subject to <strong>Protected Area Permit</strong> rules, with relaxations granted and
              withdrawn. Which regime applies to you, how long a permit lasts and where you apply
              are all liable to change without much notice.
            </p>
            <p>
              Security and road conditions also vary by district and by period. Some areas have been
              affected by conflict and displacement, curfews and internet restrictions have been
              imposed at times, and a route that was routine last season may not be this one.
            </p>
            <ul>
              <li>
                Check the Government of Manipur and Manipur Tourism for permits and current
                notifications.
              </li>
              <li>
                Check your own government&apos;s travel advisory, and (if you are not an Indian
                citizen) the Ministry of Home Affairs rules that apply to your nationality.
              </li>
              <li>
                Ask your host or guide about local conditions in the week before you travel. They
                will know things no advisory captures.
              </li>
              <li>Take out travel insurance that actually covers the region and the activities.</li>
            </ul>
          </Prose>
          <NoteBox title="Why we are being careful here" tone="warning">
            <p>
              Discover Manipur is a volunteer-run community platform. We do not have a live feed of permit rules or
              advisories, and we will not pretend otherwise by printing a number that may already be
              out of date. Treat everything on this site as a starting point for planning and
              confirm the specifics with an official source.
            </p>
          </NoteBox>
        </Reveal>
      </Section>

      {/* -------------------------------- Pledge ----------------------------- */}
      <Section className="bg-surface-sunken pb-28 md:pb-36">
        <div className="mx-auto max-w-3xl">
          <VisitorPledge items={pledge} />
          <Reveal className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild variant="primary" size="lg">
              <IntentLink href="/homestays">Find a homestay</IntentLink>
            </Button>
            <Button asChild variant="outline" size="lg">
              <IntentLink href="/experiences">Book with a local host</IntentLink>
            </Button>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
