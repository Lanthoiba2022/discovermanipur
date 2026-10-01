import type { Metadata } from "next";

import { LegalBody, type LegalSection } from "@/components/content/legal-page";
import { NoteBox } from "@/components/content/prose";
import { PageHero } from "@/components/content/page-hero";

export const metadata: Metadata = {
  title: "Accessibility statement",
  description:
    "Discover Manipur targets WCAG 2.1 Level AA. What is supported, what we know is still broken, how we test, and how to report a barrier you hit.",
};

const LAST_UPDATED = "1 October 2026";

const GITHUB_ISSUES_URL = "https://github.com/Lanthoiba2022/Manipur-Tourism-2026/issues";
const DISCORD_URL = "https://discord.gg/hgGfm6UpU";

const sections: LegalSection[] = [
  {
    id: "commitment",
    title: "Our commitment",
    body: (
      <>
        <p>
          Discover Manipur is built to be usable by as many people as possible, including people who navigate
          by keyboard, who use a screen reader or magnifier, who need reduced motion, or who have
          low vision or colour vision deficiency.
        </p>
        <p>
          Our target is <strong>WCAG 2.1 Level AA</strong>. We believe most of the site currently
          meets it. We are not claiming full conformance, because parts of the site have not been
          independently audited and we know of specific gaps, which are listed below.
        </p>
      </>
    ),
  },
  {
    id: "supported",
    title: "What is supported",
    body: (
      <>
        <h3>Keyboard</h3>
        <ul>
          <li>
            Every interactive control — links, buttons, filters, accordions, dialogs, selects and
            form fields — is reachable and operable with a keyboard alone.
          </li>
          <li>
            A visible focus ring is drawn on every focusable element, with a two-pixel outline and
            an offset so it is not swallowed by the component.
          </li>
          <li>
            A &ldquo;Skip to content&rdquo; link is the first thing in the tab order on every page.
          </li>
          <li>
            Dialogs trap focus while open, close on Escape, and return focus to the control that
            opened them.
          </li>
        </ul>

        <h3>Structure and screen readers</h3>
        <ul>
          <li>
            Semantic landmarks throughout — a single <code>header</code>, <code>main</code>,{" "}
            <code>nav</code> and <code>footer</code> per page.
          </li>
          <li>One <code>h1</code> per page and a heading order that does not skip levels.</li>
          <li>
            Every form control has a real associated label; error messages are announced and tied to
            their field.
          </li>
          <li>
            Icon-only buttons carry an accessible name; decorative icons and images are hidden from
            assistive technology.
          </li>
          <li>
            Live regions announce filter result counts and form status so the change is not
            silent.
          </li>
        </ul>

        <h3>Images and media</h3>
        <ul>
          <li>
            Photographs carry alt text that describes what is in the picture rather than repeating
            the headline next to it.
          </li>
          <li>Purely decorative imagery is marked as such rather than given a made-up description.</li>
          <li>There is no audio or video that plays automatically.</li>
        </ul>

        <h3>Motion</h3>
        <ul>
          <li>
            Every animation has a reduced-motion path. If your system asks for reduced motion,
            scroll reveals, parallax and looping motion are disabled rather than merely shortened.
          </li>
          <li>Nothing flashes more than three times per second.</li>
          <li>There is no motion that starts and keeps moving without a way to stop it.</li>
        </ul>

        <h3>Colour, text and zoom</h3>
        <ul>
          <li>
            The palette is chosen so body text meets at least 4.5:1 contrast, and large text and
            interface borders at least 3:1, in both the light and dark themes.
          </li>
          <li>Colour is never the only way information is conveyed.</li>
          <li>
            Text reflows without horizontal scrolling down to 320 pixels wide and at 200% zoom.
          </li>
          <li>Content honours your browser&apos;s font size rather than forcing a fixed pixel size.</li>
        </ul>

        <h3>Travel information</h3>
        <p>
          Accessibility is also a content problem. Each place listing carries a wheelchair-access
          flag <em>and</em> a written note, because a bare yes or no hides the gravel path, the
          three steps at the entrance or the absence of an accessible toilet. Where we do not know,
          we say we do not know rather than guessing.
        </p>
      </>
    ),
  },
  {
    id: "limitations",
    title: "Known limitations",
    body: (
      <>
        <p>
          We would rather list these than let you find them. We are working on all of them, and
          reports help us prioritise.
        </p>
        <ul>
          <li>
            <strong>Interactive maps.</strong> The map view relies on a third-party library. Panning
            and zooming by keyboard are limited, and map markers are not fully exposed to screen
            readers. Every place shown on a map is also listed as text elsewhere on the same page.
          </li>
          <li>
            <strong>3D and immersive views.</strong> Panorama and 3D scenes are visual by nature.
            They are supplementary, never the only route to information, but they have no
            non-visual equivalent yet.
          </li>
          <li>
            <strong>AI concierge output.</strong> Generated itineraries are announced as they stream
            in, which can be verbose with a screen reader. A plain summary view is planned.
          </li>
          <li>
            <strong>Date pickers.</strong> The calendar component is keyboard operable but its
            announcements are terser than we would like; a text date entry alternative is planned.
          </li>
          <li>
            <strong>Photograph alt text.</strong> Some catalogue images use shorter descriptions
            than we would like. We are rewriting these listing by listing.
          </li>
          <li>
            <strong>Language.</strong> The interface is in English. Meetei Mayek appears for names
            and key terms, but the site is not yet available in Meiteilon or other local languages.
          </li>
          <li>
            <strong>Third-party content.</strong> We cannot control the accessibility of external
            sites we link to, including government permit portals.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-test",
    title: "How we test",
    body: (
      <>
        <ul>
          <li>Keyboard-only walkthroughs of every route, including the whole booking flow.</li>
          <li>
            Automated checks with axe and Lighthouse in the browser, run against the built site
            rather than the development server.
          </li>
          <li>
            Manual screen reader passes with VoiceOver on macOS and iOS, and NVDA on Windows.
          </li>
          <li>Reduced-motion, forced-colours, 200% zoom and 320-pixel-width checks.</li>
          <li>Contrast checks on every token pairing in both the light and dark themes.</li>
        </ul>
        <p>
          Discover Manipur is a volunteer-run, open-source project, so testing is done by its
          contributors rather than by an independent auditor. We are stating that plainly rather than implying a certification we do not hold.
        </p>
      </>
    ),
  },
  {
    id: "compatibility",
    title: "Compatibility",
    body: (
      <>
        <p>
          The site is designed to work with recent versions of Chrome, Edge, Firefox and Safari on
          desktop and mobile, used with or without assistive technology. It should also work with
          your browser&apos;s own accessibility features — zoom, reader mode, custom stylesheets and
          increased text size.
        </p>
        <p>
          If you are using an older browser or an unusual combination and something breaks, tell us
          which combination it is; that detail is usually what makes a bug fixable.
        </p>
      </>
    ),
  },
  {
    id: "report",
    title: "Report a problem",
    body: (
      <>
        <p>
          If you hit a barrier anywhere on this site, we want to hear about it — including
          small things. Accessibility reports are triaged ahead of feature work.
        </p>
        <ul>
          <li>
            Open an issue on{" "}
            <a href={GITHUB_ISSUES_URL} rel="noreferrer noopener" target="_blank">
              GitHub
            </a>{" "}
            and mention accessibility in the title.
          </li>
          <li>
            Or tell the maintainers on the{" "}
            <a href={DISCORD_URL} rel="noreferrer noopener" target="_blank">
              community Discord
            </a>
            .
          </li>
        </ul>
        <p>It helps enormously if you can tell us:</p>
        <ul>
          <li>the page address;</li>
          <li>what you were trying to do;</li>
          <li>what happened instead;</li>
          <li>
            your browser, operating system and any assistive technology you were using, with
            versions if you know them.
          </li>
        </ul>
        <p>
          The maintainers are volunteers. We aim to acknowledge reports within five working days
          and to tell you what we intend to do about it — including if the honest answer is that we
          cannot fix it soon.
        </p>
      </>
    ),
  },
  {
    id: "if-not-satisfied",
    title: "If we do not get it right",
    body: (
      <p>
        If you are not satisfied with our response, reply and say so — it escalates to all the
        maintainers rather than one person. As a non-commercial community project we are not subject to a
        formal enforcement procedure, but we take reports seriously and we will tell you honestly
        what we can and cannot do.
      </p>
    ),
  },
];

export default function AccessibilityPage() {
  return (
    <>
      <PageHero
        eyebrow={`Accessibility statement · Last updated ${LAST_UPDATED}`}
        title="Built for WCAG 2.1 AA, and honest about the gaps."
        lede="A destination that is hard to reach should not also be hard to read about. This page says what we support, what we know is still broken, and how to tell us when we have missed something."
      >
        <NoteBox title="Found a barrier?" className="my-0 max-w-[60ch]">
          <p>
            Open a{" "}
            <a href={GITHUB_ISSUES_URL} rel="noreferrer noopener" target="_blank">
              GitHub issue
            </a>{" "}
            or tell us on{" "}
            <a href={DISCORD_URL} rel="noreferrer noopener" target="_blank">
              Discord
            </a>
            . We aim to acknowledge within five working days.
          </p>
        </NoteBox>
      </PageHero>

      <LegalBody sections={sections} />
    </>
  );
}
