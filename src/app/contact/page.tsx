import type { Metadata } from "next";
import Link from "next/link";
import { Clock, HelpCircle } from "lucide-react";

import { getContactChannels } from "@/lib/data/content";
import { iconFor } from "@/lib/icons";
import { NoteBox } from "@/components/content/prose";
import { PageHero } from "@/components/content/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Questions about a trip, about hosting, about an accessibility problem or about a correction to the site — send them here and we will reply.",
  openGraph: {
    title: "Contact Manipur Tourism",
    description: "Ask about a trip, about hosting, or tell us what we got wrong.",
  },
};


export default async function ContactPage() {
  const channels = await getContactChannels();

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Tell us what you are trying to do."
        lede="Trip planning, hosting, a correction, an accessibility problem or a question the FAQ did not answer — all of it lands in the same inbox and gets read."
      >
        <div className="flex flex-wrap gap-3">
          <Badge variant="outline">Replies in ~2 working days</Badge>
          <Badge variant="accent">Demonstration site</Badge>
        </div>
      </PageHero>

      <div className="shell pb-28 md:pb-36">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          {/* ------------------------------ Form ------------------------------ */}
          <Reveal className="lg:col-span-7">
            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 md:p-10">
              <h2 className="font-display text-2xl md:text-3xl">Send a message</h2>
              <p className="mt-3 max-w-[56ch] leading-relaxed text-muted-foreground">
                Every field is validated before it leaves your browser and again on the server.
                Nothing here asks for more than we need to reply to you.
              </p>
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>

            <NoteBox title="What happens to your message">
              <p>
                Manipur Tourism is a demonstration project and has no mail provider connected yet. The form
                validates your details and calls a real server action, but nothing is dispatched to
                an inbox and nothing is stored — we would rather tell you that than show a
                confirmation that is not true. See our{" "}
                <Link href="/privacy">privacy notice</Link> for what the prototype does and does not
                collect.
              </p>
            </NoteBox>
          </Reveal>

          {/* ---------------------------- Details ----------------------------- */}
          <aside className="lg:col-span-5">
            <Reveal>
              <h2 className="font-display text-2xl">Other ways in</h2>
              <ul className="mt-6 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border">
                {channels.map((channel) => {
                  const Icon = iconFor(channel.icon);
                  return (
                    <li key={channel.label} className="bg-surface p-6">
                      <div className="flex items-start gap-4">
                        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon className="size-4.5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="eyebrow text-muted-foreground">{channel.label}</p>
                          <p className="mt-1.5 break-words font-display text-lg leading-snug">
                            {channel.value}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {channel.detail}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Reveal>

            <Reveal delayIndex={1}>
              <div className="mt-8 rounded-[var(--radius-lg)] border border-border bg-surface-sunken p-6 md:p-7">
                <div className="flex items-center gap-3">
                  <Clock className="size-5 text-primary" aria-hidden="true" />
                  <h2 className="font-display text-xl">Office hours</h2>
                </div>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
                    <dt className="text-muted-foreground">Monday – Friday</dt>
                    <dd className="font-medium">09:00 – 18:00 IST</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
                    <dt className="text-muted-foreground">Saturday</dt>
                    <dd className="font-medium">10:00 – 14:00 IST</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-muted-foreground">Sunday & public holidays</dt>
                    <dd className="font-medium">Closed</dd>
                  </div>
                </dl>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  India Standard Time is UTC+5:30. Messages sent outside these hours are answered
                  on the next working day. Local festival days — Yaoshang, Cheiraoba, Ningol
                  Chakkouba — usually mean a slower reply.
                </p>
              </div>
            </Reveal>

            <Reveal delayIndex={2}>
              <div className="mt-8 rounded-[var(--radius-lg)] border border-border bg-surface p-6 md:p-7">
                <div className="flex items-center gap-3">
                  <HelpCircle className="size-5 text-primary" aria-hidden="true" />
                  <h2 className="font-display text-xl">Try these first</h2>
                </div>
                <ul className="mt-5 space-y-2.5 text-sm">
                  <li>
                    <Link href="/faq" className="text-primary underline underline-offset-4">
                      FAQ
                    </Link>{" "}
                    — permits, transport, food, festivals, accessibility.
                  </li>
                  <li>
                    <Link
                      href="/responsible-travel"
                      className="text-primary underline underline-offset-4"
                    >
                      Responsible travel
                    </Link>{" "}
                    — what to do and not do here.
                  </li>
                  <li>
                    <Link
                      href="/accessibility"
                      className="text-primary underline underline-offset-4"
                    >
                      Accessibility statement
                    </Link>{" "}
                    — and how to report a barrier.
                  </li>
                  <li>
                    <Link href="/host" className="text-primary underline underline-offset-4">
                      Become a host
                    </Link>{" "}
                    — if you run a stay, a kitchen or a vehicle.
                  </li>
                </ul>
              </div>
            </Reveal>
          </aside>
        </div>
      </div>
    </>
  );
}
