import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Hosting standards",
  description:
    "The standards every Discover Manipur host agrees to: safety, cleanliness, honest pricing, cultural respect for guests and neighbours, accessibility and cancellation conduct.",
};

interface GuidelineSection {
  id: string;
  title: string;
  intro: string;
  rules: string[];
  note?: string;
}

const SECTIONS: GuidelineSection[] = [
  {
    id: "eligibility",
    title: "1. Who can host",
    intro:
      "Hosting on Discover Manipur is open to anyone in Manipur with something real to share and the right to share it.",
    rules: [
      "You are 18 or older and can show one government photo ID.",
      "You own the place, or you have the written consent of whoever does.",
      "Where a village authority, church committee, Meira Paibi or autonomous district council has a say over visitors in your area, you have spoken to them first. We will ask.",
      "You hold whatever municipal, panchayat or tourism-department registration your district requires. If you are unsure, say so on your application and we will find out with you.",
      "For Protected Area Permit zones, you understand that foreign guests must carry a valid permit and that you may be asked to record their details.",
    ],
  },
  {
    id: "safety",
    title: "2. Safety",
    intro:
      "Nothing on this page matters more. A guest in your care should be as safe as your own family.",
    rules: [
      "Working locks on every guest room and on the main gate, and a room key the guest keeps.",
      "A smoke alarm or, at minimum, a working fire extinguisher within reach of the kitchen, and a clear way out of the building that is never locked or blocked.",
      "A stocked first-aid box, and the nearest hospital or PHC number written somewhere visible, not only in your phone.",
      "Electrical wiring without exposed joints; geysers, heaters and gas cylinders serviced and turned off when unattended.",
      "Safe drinking water (filtered, boiled or sealed), and you say plainly which it is.",
      "On or near water, a life jacket for every guest on every boat, with no exceptions for short crossings on Loktak.",
      "On treks and rides, a briefing before you set off, water, a charged phone, and a turn-back plan for weather.",
      "You tell guests about real risks up front: an unlit approach lane, a steep stair, a dog, a landslide-prone stretch, a curfew or bandh that could affect their travel.",
      "Never enter a guest's room without knocking and being asked in, and never after they have retired for the night.",
    ],
  },
  {
    id: "cleanliness",
    title: "3. Cleanliness and food",
    intro: "Clean is a standard, not an aspiration. It is also the thing guests write about first.",
    rules: [
      "Fresh, sun-dried or laundered bedding and towels for every new guest, not turned over, not reused.",
      "Bathroom cleaned before each arrival, with soap, a bucket and mug or a working shower, and a way to keep water hot.",
      "Dustbins emptied daily, and waste disposed of properly rather than burned next to the guest room.",
      "If you cook for guests: clean hands and utensils, food cooked to order rather than kept warm for hours, drinking water offered without being asked.",
      "You declare what is in the food. Ngari, umorok, pork fat, beef and axone are part of our kitchens. Never disguise them. Ask about allergies and about what a guest does not eat.",
      "A guest who asks for a vegetarian or vegan meal gets a real one, cooked in clean vessels, not rice and one side dish.",
    ],
  },
  {
    id: "pricing",
    title: "4. Honest pricing",
    intro:
      "The price a guest sees is the price a guest pays. Discover Manipur will remove listings that work around this.",
    rules: [
      "Your listed rate includes everything a guest must pay to stay or take part. Taxes and cleaning charges go in the rate or are listed as a named extra before booking.",
      "No separate price for foreign, out-of-state or Manipuri guests, and no asking for more after arrival.",
      "Optional extras (an airport pickup, a boat ride, dinner, a guide for the day) are priced on the listing before the guest books.",
      "Never ask for a deposit, advance or extra charge that is not stated on your listing.",
      "Discover Manipur charges no fee: no listing fee and no commission. No money moves through the platform. Guests pay you directly, on the terms stated on your listing.",
    ],
  },
  {
    id: "respect-guests",
    title: "5. Respect for guests",
    intro:
      "Everyone who books is a guest in Manipur. Who they are is not a reason to treat them differently.",
    rules: [
      "No refusal or different treatment on grounds of religion, caste, tribe or community, place of origin, language, gender, sexuality, disability, marital status or age.",
      "An unmarried couple with valid ID is a booking like any other.",
      "Reply to messages within 24 hours. A late reply costs a guest their whole plan.",
      "Photographs of guests, and of anything inside your home that a guest is in, only with their permission.",
      "What a guest tells you stays with you: no sharing their itinerary, their phone number or their photos with anyone.",
    ],
  },
  {
    id: "respect-community",
    title: "6. Respect for Manipur and your neighbours",
    intro:
      "Tourism that costs the leikai more than it gives is not worth hosting. Your neighbours did not sign up for your guests.",
    rules: [
      "Brief guests before they arrive on what matters locally: removing shoes indoors, quiet after 9pm, dressing modestly at a temple, church or Umang Lai grove, and asking before photographing people, rituals or interiors.",
      "Sacred spaces, community forests and Lai Haraoba grounds are visited on the community's terms, with permission, and sometimes not at all. Never sell access to something the community has not agreed to share.",
      "Crafts, weaves and recipes you present as yours must be yours, or shared with credit and with the maker's consent. A Wangkhei phee, a Moirang phee or a Tangkhul shawl is named correctly.",
      "Pay the people who work with you (cooks, porters, boatmen, drivers, performers) at a fair rate and on time.",
      "Keep guest numbers within what your lane, your water supply and your neighbours can carry.",
      "No single-use plastic handed out where you can avoid it, no waste into the lake or the river, and no encouraging guests onto phumdi or paddy that is someone's livelihood.",
    ],
  },
  {
    id: "accessibility",
    title: "7. Accessibility: describe it truthfully",
    intro:
      "We do not require every home to be step-free. We require every listing to be honest about what it is, so a guest can decide for themselves.",
    rules: [
      "Count and describe the steps: to the gate, to the room, to the bathroom. \"A few steps\" is not a description.",
      "State the narrowest doorway in centimetres if a wheelchair user could plausibly book.",
      "Say whether the toilet is a seat or a squat, and whether there is anything to hold on to.",
      "Say how far the room is from where a car can stop, and whether that path is lit and even after dark.",
      "Note what matters to guests who are not wheelchair users too: a bathroom on the sleeping floor, a handrail, a strong reading light, a quiet room away from the road, whether the stairs can be avoided.",
      "If a guest asks whether they can manage your place, answer plainly, including when the answer is no. Turning someone away kindly and early is better than a guest stranded at your gate.",
    ],
  },
  {
    id: "cancellation",
    title: "8. Cancellations and conduct when plans break",
    intro:
      "Manipur travel breaks sometimes: a bandh, a landslide, a flight cancelled at Tulihal. How you handle it is the measure of a host.",
    rules: [
      "Honour every confirmed booking. Cancel only for a genuine emergency, illness or bereavement, or a safety situation, never because a longer or better-paying booking came along.",
      "If you must cancel, tell the guest the same day, refund anything they have paid you in full, and help them find somewhere else.",
      "Repeated host cancellations can cost you your featured placement, then your listing.",
      "When a bandh, blockade or weather event makes travel unsafe, waive the guest's cancellation charge. A host is not penalised for cancelling in that situation either.",
      "Your own cancellation terms for guests must be stated on the listing and applied the same way to everyone.",
      "If something goes wrong during a stay, fix what you can, tell the guest what you cannot, and ask for help rather than arguing at the gate.",
    ],
  },
  {
    id: "reviews",
    title: "9. Reviews, and what ends a listing",
    intro:
      "Reviews are the only thing a first-time guest has to go on, so they are protected carefully.",
    rules: [
      "Never write, buy or ask for a fake review, and never offer a discount for a good one. Asking a happy guest to review you honestly is fine.",
      "Retaliating against an honest review (a threat, a call, a review of their conduct in return) ends the listing.",
      "Listings are removed for: false information, a safety failure, a discrimination complaint we can substantiate, charging money not stated on the listing, or a pattern of complaints left unfixed.",
      "You will always be told why, in writing, and you can put it right and reapply.",
    ],
    note: "Questions, a complaint about another host, or something you are unsure about: ask the maintainers on the community Discord, linked at the foot of every page.",
  },
];

export default function HostingGuidelinesPage() {
  return (
    <div className="shell pb-24 pt-28 md:pt-32">
      <header className="mx-auto max-w-3xl">
        <p className="eyebrow mb-4 flex items-center gap-3 text-muted-foreground">
          <span className="weave-rule inline-block h-[3px] w-10 rounded-full" />
          Hosting standards
        </p>
        <h1 className="text-headline">What we ask of every Discover Manipur host</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          These are the standards you agree to when you list. Read them before you apply, so you
          know what to expect. They are written plainly on purpose:
          a host should be able to read this once and know exactly what is expected, and a guest
          should be able to read it too.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">Last reviewed 1 October 2026</p>
      </header>

      <Separator className="mx-auto my-10 max-w-3xl" />

      <nav aria-label="On this page" className="mx-auto max-w-3xl">
        <h2 className="font-display text-lg">On this page</h2>
        <ol className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mx-auto mt-14 max-w-3xl space-y-14">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`}>
            <h2 id={`${section.id}-heading`} className="font-display text-2xl md:text-3xl">
              {section.title}
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{section.intro}</p>
            <ul className="mt-5 space-y-3">
              {section.rules.map((rule) => (
                <li key={rule} className="flex gap-3 text-sm leading-relaxed text-foreground">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                  />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
            {section.note && (
              <p className="mt-5 rounded-[var(--radius)] bg-surface-sunken p-4 text-sm text-muted-foreground">
                {section.note}
              </p>
            )}
          </section>
        ))}
      </div>

      <div className="mx-auto mt-16 max-w-3xl rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center">
        <h2 className="font-display text-2xl">Can you meet these?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Most homes in Manipur already do. If one or two things are missing (a smoke alarm, a
          handrail, a filter), apply anyway and say so in your application, so our admins know
          what you are working on.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/host/apply">Start your application</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/host">Back to hosting</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
