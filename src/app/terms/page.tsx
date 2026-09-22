import type { Metadata } from "next";
import Link from "next/link";

import { getPhotoCredits } from "@/lib/data/content";
import { LegalBody, type LegalSection } from "@/components/content/legal-page";
import { NoteBox } from "@/components/content/prose";
import { PageHero } from "@/components/content/page-hero";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "The terms on which you may use Manipur Tourism: what the platform is, what it is not, what content you may rely on, and what happens when something goes wrong.",
};

const LAST_UPDATED = "20 September 2026";

/**
 * Photograph credits, read from the database.
 *
 * Its own async component because `sections` below is a module-level array of
 * JSX and therefore cannot await anything. React resolves this when the
 * section is rendered.
 */
async function PhotoCreditsList() {
  const credits = await getPhotoCredits();
  return (
    <ul className="mt-6 space-y-4 text-sm">
      {credits.map((credit) => (
        <li key={credit.file} className="border-t border-border pt-4">
          <p className="font-medium text-foreground">{credit.subject}</p>
          <p className="mt-1 text-muted-foreground">
            {credit.author} · {credit.licence} ·{" "}
            <a
              href={credit.source}
              rel="noreferrer noopener"
              target="_blank"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Original on Wikimedia Commons
            </a>
          </p>
        </li>
      ))}
    </ul>
  );
}

const sections: LegalSection[] = [
  {
    id: "agreement",
    title: "These terms",
    body: (
      <>
        <p>
          By using Manipur Tourism you agree to these terms. If you do not agree with them, please do not use
          the site. We may update them; the date at the top of this page tells you when they last
          changed, and continued use after a change means you accept the new version.
        </p>
        <p>
          These terms sit alongside our <Link href="/privacy">privacy notice</Link> and our{" "}
          <Link href="/accessibility">accessibility statement</Link>.
        </p>
      </>
    ),
  },
  {
    id: "what-this-is",
    title: "What Manipur Tourism is — and is not",
    body: (
      <>
        <p>
          Manipur Tourism is a non-commercial demonstration site. It
          demonstrates how a tourism platform for Manipur could work.
        </p>
        <ul>
          <li>
            We are <strong>not</strong> a travel agent, tour operator, accommodation provider or
            transport operator.
          </li>
          <li>
            We do <strong>not</strong> process payments, hold deposits or issue tickets, vouchers or
            confirmations.
          </li>
          <li>
            We have <strong>no</strong> commercial partnership, agency or affiliation with any
            business, guide or property described on this site unless it is explicitly stated on the
            page.
          </li>
          <li>
            Any &ldquo;booking&rdquo; made here is a prototype record. It creates no contract,
            reserves nothing, and obliges no one to host you.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Who can use it",
    body: (
      <>
        <p>
          You must be at least 13 years old to use the site, and at least 18 to submit a host
          application or to make any arrangement that would be a commitment in a real deployment. If
          you are using the site on behalf of an organisation, you confirm that you are authorised
          to do so.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Accounts",
    body: (
      <>
        <p>
          Where accounts are enabled in the demo, you are responsible for the accuracy of what you
          enter and for keeping your credentials to yourself. Tell us promptly if you believe your
          account has been accessed by someone else.
        </p>
        <p>
          We may suspend or remove an account that is being used to abuse the site, to harass
          others, or to submit content that breaks the rules below.
        </p>
      </>
    ),
  },
  {
    id: "content-accuracy",
    title: "Accuracy of the content",
    body: (
      <>
        <p>
          Listings, prices, timings, distances, permit descriptions and festival dates on this site
          are illustrative content assembled to demonstrate the platform. They are offered in good faith and may
          be incomplete, out of date or wrong.
        </p>
        <p>
          <strong>
            Before you travel, verify permits, entry rules, road conditions and current government
            advisories with official sources.
          </strong>{" "}
          Nothing on this site is a substitute for that, and our{" "}
          <Link href="/responsible-travel">responsible travel guidance</Link> says so at greater
          length.
        </p>
      </>
    ),
  },
  {
    id: "ai",
    title: "AI-generated suggestions",
    body: (
      <>
        <p>
          The AI concierge produces draft itineraries. Its output is generated automatically, is not
          reviewed by a person before you see it, and can be confidently wrong about opening hours,
          travel times, costs, access and safety.
        </p>
        <p>
          Treat it as a starting point for your own research. Do not rely on it for anything where
          being wrong would matter — permits, medical needs, weather windows or security.
        </p>
      </>
    ),
  },
  {
    id: "your-conduct",
    title: "How you may use the site",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>scrape, republish or resell the content or the underlying data at scale;</li>
          <li>submit false, misleading, defamatory, hateful or unlawful content;</li>
          <li>upload other people&apos;s photographs or writing without their permission;</li>
          <li>
            impersonate a host, a guide, a business, an official body or another user;
          </li>
          <li>
            attempt to break, overload, probe or gain unauthorised access to any part of the
            service;
          </li>
          <li>use the site to harass, endanger or expose any community described on it.</li>
        </ul>
        <p>
          Manipur has a complex and, at times, painful recent history. Content submitted here that
          inflames communal tension will be removed without discussion.
        </p>
      </>
    ),
  },
  {
    id: "user-content",
    title: "Content you submit",
    body: (
      <>
        <p>
          You keep ownership of anything you submit — a review, a photograph, a host listing. By
          submitting it, you grant us a non-exclusive, worldwide, royalty-free licence to display it
          on the platform for the purpose of running and demonstrating the service.
        </p>
        <p>
          You confirm you have the right to grant that licence, including any consent required from
          people who appear in a photograph. We may remove content that breaches these terms or that
          a rights-holder asks us to take down.
        </p>
      </>
    ),
  },
  {
    id: "hosts",
    title: "Hosts and listings",
    body: (
      <>
        <p>
          If you list a stay, an experience or a service, you are responsible for the accuracy of
          your listing, for the legality of what you offer, for the safety of your guests, and for
          any licences, registrations, taxes and insurance that apply to you.
        </p>
        <p>
          We do not inspect or verify properties and we do not mediate disputes between hosts and
          guests. No commission is charged, because no money moves through this prototype.
        </p>
      </>
    ),
  },
  {
    id: "ip",
    title: "Intellectual property",
    body: (
      <>
        <p>
          The Manipur Tourism name, the interface, the written content and the design system belong
          to the project team. Photographs remain the property of their respective photographers; if
          you own an image on this site and want it removed or credited differently, contact us and
          we will act.
        </p>
        <p>
          Some photographs come from Wikimedia Commons under Creative Commons licences that require
          attribution. Those images, their photographers and their licences are listed in full
          below. Each was resized and converted to WebP for the web; nothing else was changed.
        </p>
        <p>
          Cultural material — motifs, dance forms, textiles, rituals — belongs to the communities
          that hold it. Nothing on this site should be read as a claim over any of it.
        </p>
      </>
    ),
  },
  {
    id: "photo-credits",
    title: "Photograph credits",
    body: (
      <>
        <p>
          Every photograph below is used under the Creative Commons licence named against it.
          Follow the link to the original file on Wikimedia Commons for the full licence text.
        </p>
        <PhotoCreditsList />
      </>
    ),
  },
  {
    id: "third-parties",
    title: "Links and third parties",
    body: (
      <p>
        The site links to government pages, operators and other external resources. We do not
        control them, we are not responsible for their content or their practices, and a link is not
        an endorsement. Any arrangement you make with a third party is between you and them.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Disclaimer and liability",
    body: (
      <>
        <p>
          The site is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without
          warranties of any kind. We do not promise that it will be uninterrupted, error-free or
          accurate.
        </p>
        <p>
          To the fullest extent permitted by law, we are not liable for any loss, injury, cost or
          damage arising from your use of the site or from travel decisions you make on the basis of
          it — including anything caused by inaccurate listings, AI-generated itineraries, or
          changes to permits, weather, road conditions or security.
        </p>
        <p>
          Nothing in these terms limits liability that cannot be limited by law, such as liability
          for death or personal injury caused by our negligence, or for fraud.
        </p>
      </>
    ),
  },
  {
    id: "availability",
    title: "Availability and changes",
    body: (
      <p>
        This is a demonstration deployment. We may change, suspend or withdraw any part of the service,
        or take the whole site down, at any time and without notice. Data held in the prototype may
        be deleted when the deployment ends.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of India, and the courts of Manipur have jurisdiction
        over any dispute arising from them, without affecting any mandatory consumer rights you have
        where you live.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about these terms go to <strong>hello@example.com</strong> — a placeholder
        address for this prototype — or through the <Link href="/contact">contact form</Link>.
      </p>
    ),
  },
];

export default async function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow={`Terms of use · Last updated ${LAST_UPDATED}`}
        title="The rules, written so you can actually read them."
        lede="Short paragraphs, no defined-term thicket. The most important line is the one about this being a prototype rather than a travel company."
      >
        <NoteBox title="The one that matters" tone="warning" className="my-0 max-w-[60ch]">
          <p>
            Manipur Tourism does not sell travel. Nothing booked here is a real reservation, and you must
            confirm permits, advisories and road conditions with official sources before you
            travel.
          </p>
        </NoteBox>
      </PageHero>

      <LegalBody sections={sections} />
    </>
  );
}
