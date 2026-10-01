import type { Metadata } from "next";
import Link from "next/link";

import { LegalBody, type LegalSection } from "@/components/content/legal-page";
import { NoteBox } from "@/components/content/prose";
import { PageHero } from "@/components/content/page-hero";

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "What Discover Manipur collects, why, how long we keep it, who we share it with, and the rights you have over it. Written in plain English for an open-source, community-run platform.",
};

const LAST_UPDATED = "1 October 2026";

const GITHUB_URL = "https://github.com/Lanthoiba2022/discovermanipur";
const DISCORD_URL = "https://discord.gg/hgGfm6UpU";

const sections: LegalSection[] = [
  {
    id: "summary",
    title: "The short version",
    body: (
      <>
        <p>
          Discover Manipur is an open-source public platform, run by volunteers, that helps visitors
          and local people find places to see in Manipur. It is not a commercial travel business and
          not an official government service. It does not take payments, and it collects as little
          about you as it can.
        </p>
        <ul>
          <li>
            You can browse the whole site without an account. If you create one, we store your
            name, email address and the optional profile details you add.
          </li>
          <li>
            If you are signed in, your booking requests, saved trip plans, saved places and host
            application are stored with your account. Signed out, they stay in your own browser.
          </li>
          <li>
            We count page views with Vercel&apos;s cookieless analytics, and use Microsoft Clarity
            to see how pages are used (heatmaps and session recordings). We do not sell personal
            data, and we do not run advertising trackers.
          </li>
          <li>We do not knowingly collect anything from children under 13.</li>
          <li>
            You can ask us what we hold, ask for it to be corrected, or ask for it to be deleted.
          </li>
        </ul>
        <p>The rest of this notice is the detail.</p>
      </>
    ),
  },
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          Discover Manipur is a community project about tourism in Manipur, India. It began as a
          student and volunteer project around World Tourism Day 2026 and is now developed in the
          open: the source code is public on{" "}
          <a href={GITHUB_URL} rel="noreferrer noopener" target="_blank">
            GitHub
          </a>
          , so anyone can check how the site handles data. The maintainers work remotely and there is
          no company or public office behind it.
        </p>
        <p>
          For a question about this notice or about data we may hold, ask the maintainers on our{" "}
          <a href={DISCORD_URL} rel="noreferrer noopener" target="_blank">
            community Discord
          </a>{" "}
          or open an issue on GitHub. Please do not post personal details in a public channel or
          issue. Say what you need and a maintainer will contact you privately.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <>
        <h3>Information you give us</h3>
        <ul>
          <li>
            <strong>Account details:</strong> if you create an account, your email address, your
            name and your password. Sign-in is handled by our authentication provider, which stores
            the password in hashed form; we never see or store it in readable form. Your profile
            also holds any phone number or profile-photo link you choose to add, your account role
            (traveller, host or admin) and when the account was created and last updated.
          </li>
          <li>
            <strong>Email verification:</strong> when you sign up, your email address is passed to
            our email provider so it can send you a one-time verification code.
          </li>
          <li>
            <strong>Contact form:</strong> your name, email address, enquiry type, subject and
            message. At the moment the form checks these on the server and then discards them:
            nothing is stored and nothing is forwarded to an inbox, because no mail provider is
            connected to it yet.
          </li>
          <li>
            <strong>Booking requests:</strong> when you are signed in, the listing, dates, number
            of guests, price shown and any note you add are stored with your account. Our admins
            can see them, and the host of that listing sees your first name, the dates and the
            number of guests and the price on their dashboard. A booking is a request, not a reservation: no
            payment is taken and the property is not notified automatically.
          </li>
          <li>
            <strong>Saved trip plans and saved places:</strong> when you are signed in, they are
            stored with your account so they follow you across devices. When you are signed out,
            they are kept in your browser&apos;s local storage instead. Places you saved while
            signed out are moved into your account the next time you sign in.
          </li>
          <li>
            <strong>Host applications:</strong> the draft is saved in your browser as you fill it
            in. When you submit it (you must be signed in), the details you entered are stored
            with your account and reviewed by our admins. They include your name, phone number,
            the place you would host and what you offer. Photos you pick stay on your device and
            are not uploaded.
          </li>
        </ul>

        <h3>Information collected automatically</h3>
        <ul>
          <li>
            Standard server and hosting logs, which typically include an IP address, a timestamp,
            the page requested and a user-agent string. These are generated by our hosting provider.
          </li>
          <li>
            Aggregate usage and performance data from Vercel Web Analytics and Speed Insights: the
            pages visited, the referring site, approximate country, browser, operating system and
            device type, and page-load measurements. These tools do not use cookies and do not
            follow you across other sites.
          </li>
          <li>
            Interaction data from Microsoft Clarity: clicks, taps, scrolling and mouse movement,
            the pages you visit, and your browser, device and approximate location. Clarity uses
            this to build heatmaps and session recordings that show us where pages confuse people.
            Text you type into form fields is masked before a recording leaves your browser.
            Clarity runs only on the live site and sets first-party cookies (described below).
            Microsoft processes this data under its{" "}
            <a
              href="https://privacy.microsoft.com/privacystatement"
              rel="noreferrer noopener"
              target="_blank"
            >
              privacy statement
            </a>
            .
          </li>
          <li>
            Some photographs and the 3D map of Kangla are loaded from Google Maps Platform, so
            Google receives your IP address and browser details when they load, under Google&apos;s
            own privacy policy.
          </li>
        </ul>

        <h3>What we do not collect</h3>
        <p>
          We do not take payment card details, we do not ask for identity documents, permits or
          passport numbers, and we do not track your location.
        </p>
      </>
    ),
  },
  {
    id: "why",
    title: "Why we use it",
    body: (
      <>
        <ul>
          <li>
            <strong>To run your account.</strong> We need your email address to sign you in and to
            verify that the address is yours, and your role to decide which pages you can open.
          </li>
          <li>
            <strong>To keep the site working and safe.</strong> Logs help us find errors and abuse.
          </li>
          <li>
            <strong>To improve the platform.</strong> Aggregate usage tells us which pages are worth
            writing more of and which are slow.
          </li>
        </ul>
        <p>
          Where a legal basis is required, we rely on your consent for optional features such as an
          account, on legitimate interests for security and for improving the service, and on the
          steps necessary to respond to a request you have made.
        </p>
      </>
    ),
  },
  {
    id: "ai",
    title: "AI features",
    body: (
      <>
        <p>
          The site includes an AI concierge that drafts itineraries from the prompt you give it
          together with our own catalogue of places, stays and experiences. It is switched off on
          the live site at the moment: the planner page shows a sample conversation instead, and
          nothing you type is sent to an AI provider.
        </p>
        <p>If the concierge is switched on in future:</p>
        <ul>
          <li>
            Your messages will be sent to a third-party model provider (Google Gemini, or Anthropic
            as a fallback) to generate the response.
          </li>
          <li>Do not put anything sensitive into the planner. Treat it as a public message.</li>
          <li>
            Generated itineraries are suggestions. They can be wrong about timings, prices, opening
            hours and access, and they must never be used as a substitute for checking permits,
            advisories or road conditions with official sources.
          </li>
          <li>
            We do not use your prompts to train models ourselves. The provider processes them under
            its own terms.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: (
      <>
        <p>We use the smallest set of cookies and browser storage that makes the site work:</p>
        <ul>
          <li>a session cookie that keeps you signed in, if you have an account;</li>
          <li>your light or dark theme preference;</li>
          <li>
            your host application draft, and (while you are signed out) any bookings, saved trip
            plans and saved places, kept in your browser&apos;s local storage.
          </li>
        </ul>
        <p>
          Microsoft Clarity sets first-party cookies (<code>_clck</code> and <code>_clsk</code>)
          so it can tell a returning visitor and group one visit&apos;s pages into a session, and
          Microsoft may set its own cookies such as <code>MUID</code>. We do not run advertising
          cookies, and Vercel&apos;s analytics are cookieless. To stop Clarity, block cookies for
          this site or use your browser&apos;s tracking protection. You can clear this storage in your browser settings at any time; the
          consequence is that preferences reset, anything saved on the device is lost, and you
          will be signed out.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who else sees it",
    body: (
      <>
        <p>We share personal data only with the service providers that make the site run:</p>
        <ul>
          <li>
            <strong>Vercel</strong>, which hosts the site, keeps server logs and provides the
            Web Analytics and Speed Insights described above;
          </li>
          <li>
            <strong>Microsoft</strong>, which provides Clarity, the heatmap and session-recording
            tool described above;
          </li>
          <li>
            <strong>Neon</strong>, which hosts our database and our sign-in service, where account
            and profile records are stored;
          </li>
          <li>
            <strong>Brevo</strong>, which sends account verification emails;
          </li>
          <li>
            <strong>Google</strong>, which serves some photographs and the Kangla 3D map and, only
            if the AI concierge is switched on, processes the prompts you send it.
          </li>
        </ul>
        <p>
          We do not sell personal data, we do not trade it, and we do not pass it to homestays,
          guides or tour operators. We may disclose information where we are legally required to.
        </p>
        <p>
          Some of these providers operate outside India. Where data is transferred internationally,
          we rely on the provider&apos;s standard contractual protections.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <>
        <ul>
          <li>
            <strong>Accounts and profiles:</strong> until you ask us to delete them, or until we
            remove an account that breaks the <Link href="/terms">terms of use</Link>.
          </li>
          <li>
            <strong>Booking requests, saved trip plans, saved places and host applications held
            with your account:</strong> until you remove them (you can delete saved plans and
            places yourself, and cancel a booking request) or ask us to delete your account.
            Anything kept only in your browser stays there until you remove it or clear your
            browser storage.
          </li>
          <li>
            <strong>Contact messages:</strong> not kept at all while the form has no mail provider.
          </li>
          <li>
            <strong>Server logs and analytics:</strong> for the retention period set by our hosting
            provider.
          </li>
          <li>
            <strong>Microsoft Clarity:</strong> session recordings for 30 days, and aggregated
            heatmaps and statistics for up to 13 months, under Microsoft&apos;s retention policy.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>
          Depending on where you live, you may have the right to access a copy of your data, to have
          it corrected, to have it erased, to restrict or object to how we use it, to withdraw
          consent, and to complain to a data protection authority. Indian users have comparable
          rights under the Digital Personal Data Protection framework.
        </p>
        <p>
          You can correct your name, phone number and profile photo yourself on your account&apos;s
          profile page. For anything else (a copy of your data, or deleting your account), ask the
          maintainers on{" "}
          <a href={DISCORD_URL} rel="noreferrer noopener" target="_blank">
            Discord
          </a>{" "}
          or through a{" "}
          <a href={`${GITHUB_URL}/issues`} rel="noreferrer noopener" target="_blank">
            GitHub issue
          </a>
          , without posting personal details publicly. The maintainers are volunteers; we aim to
          respond within 30 days. We will ask you to confirm your identity (usually by writing from
          the email address on the account) before acting on a request, so that nobody can use
          this route to access someone else&apos;s data.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <>
        <p>
          The site is served over HTTPS, secrets are held in environment variables rather than in the
          codebase, access to the database is restricted to the maintainers, and pages for hosts and
          admins check your role on the server. Passwords are handled by our authentication provider
          and are never stored by us in readable form.
        </p>
        <p>
          That said: this is a community-run project that has not had an independent security
          audit. Please do not enter anything into it that you would be unhappy to see disclosed. If
          you find a security problem, report it privately to a maintainer rather than in a public
          issue.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        The site is not directed at children under 13 and we do not knowingly collect their personal
        data. If you believe a child has created an account, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this notice",
    body: (
      <p>
        If this notice changes materially, we will update the date at the top of the page and, where
        the change is significant, note it on the site. Because the site is open source, every change
        to this page is also visible in the repository&apos;s history. Continuing to use Discover
        Manipur after a change means you accept the updated notice.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow={`Privacy · Last updated ${LAST_UPDATED}`}
        title="What we collect, and (mostly) what we don't."
        lede="A short notice for a community project. We would rather describe exactly what this site does than borrow a policy written for a company we are not."
      >
        <NoteBox title="Plain summary" className="my-0 max-w-[60ch]">
          <p>
            An account only if you want one. What you save while signed in is kept with your
            account; signed out, it stays in your browser. No advertising trackers.
            No sale of data. Ask us and we will delete what we hold.
          </p>
        </NoteBox>
      </PageHero>

      <LegalBody sections={sections} />
    </>
  );
}
