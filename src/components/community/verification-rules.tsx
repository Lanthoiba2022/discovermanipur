import {
  BadgeCheck,
  Camera,
  CirclePause,
  EyeOff,
  MapPinPlus,
  ShieldCheck,
  ThumbsUp,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { LIMITS, UPVOTES_REQUIRED, VOTING_WINDOW_HOURS } from "@/lib/community/rules";
import { LICENCES, LICENCE_LABELS, licenceNeedsSource } from "@/lib/community/taxonomy";
import { cn } from "@/lib/utils";

interface Rule {
  icon: LucideIcon;
  title: string;
  body: ReactNode;
}

const OPEN_LICENCES = LICENCES.filter(licenceNeedsSource).map((l) => LICENCE_LABELS[l]);
const openLicenceList = `${OPEN_LICENCES.slice(0, -1).join(", ")} or ${OPEN_LICENCES[OPEN_LICENCES.length - 1]}`;

const RULES: Rule[] = [
  {
    icon: UserPlus,
    title: "Who can list a place",
    body: (
      <>
        Anyone signed in with a verified email address whose account is not banned. Owners are
        welcome, but must say they own the place or are connected to it, and the page shows that.
        The page also shows the first name on your account as the person who listed it. One account
        can list up to {LIMITS.submissionsPerDay} places in any 24 hours and have up to{" "}
        {LIMITS.openSubmissions} collecting votes at once.
      </>
    ),
  },
  {
    icon: MapPinPlus,
    title: "What can be listed",
    body: (
      <>
        An attraction or hidden gem, a cafe or restaurant, a homestay or resort, or a handloom,
        craft or traditional wear maker or shop, anywhere in Manipur. Describe it accurately and add
        public links that back it up if you can. A place cannot be listed if one with the same name
        in the same district is already on the site or has already been listed, unless that listing
        was rejected.
      </>
    ),
  },
  {
    icon: Camera,
    title: "Photos",
    body: (
      <>
        Up to {LIMITS.photosPerPlace} per place, either taken by you or under {openLicenceList}, with
        a link to where the licence is shown. Every photo is resized and its location data removed
        before it is stored, and it is shown only to people who can see the place.
      </>
    ),
  },
  {
    icon: ThumbsUp,
    title: "Who can vote",
    body: (
      <>
        Signed-in users with a verified email address whose account is not banned. Each account has
        one vote per place, nobody can vote for a place they listed, and a vote can be withdrawn
        while the place is collecting votes. Votes from accounts that are later banned or lose their
        verified email stop counting.
      </>
    ),
  },
  {
    icon: BadgeCheck,
    title: `${UPVOTES_REQUIRED} upvotes in ${VOTING_WINDOW_HOURS} hours`,
    body: (
      <>
        A place is published once it has {UPVOTES_REQUIRED} upvotes from different verified users,
        all within {VOTING_WINDOW_HOURS} hours of being listed. Once published, it is public for
        everyone.
      </>
    ),
  },
  {
    icon: CirclePause,
    title: "Otherwise, held for review",
    body: (
      <>
        If it does not reach {UPVOTES_REQUIRED} upvotes in time, it leaves the voting queue and is
        held for an admin to review by hand. Nothing is deleted. The person who listed it can follow
        its status under My places, and if an admin rejects it, the reason is shown there.
      </>
    ),
  },
  {
    icon: EyeOff,
    title: "Nothing unverified is public",
    body: (
      <>
        While a place is collecting votes, only signed-in users with a verified email can see it.
        After that, until it is published, only the person who listed it and the admins can.
        Signed-out visitors and search engines only ever see published places.
      </>
    ),
  },
  {
    icon: ShieldCheck,
    title: "What admins can do",
    body: (
      <>
        Admins list and vote under the same rules as everyone else. An admin can also publish, hold
        or reject a place by hand at any stage, or remove a photo that breaks the rules. The latest
        decision on each place is recorded with who made it and when, and a removed photo stays on
        record with who uploaded it.
      </>
    ),
  },
];

/**
 * How community verification works, rendered from the constants in
 * `src/lib/community/rules.ts` so the page can never drift from the rules the
 * server enforces. Server-safe: no client code.
 */
export function VerificationRules({
  id = "how-verification-works",
  title = "How verification works",
  className,
}: {
  id?: string;
  title?: string;
  className?: string;
}) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "scroll-mt-28 rounded-[var(--radius-lg)] border border-border bg-surface-sand p-6 shadow-[var(--shadow-sm)] md:scroll-mt-32 md:p-10",
        className,
      )}
    >
      <p className="eyebrow text-brass-700 [.dark_&]:text-brass-300">Open rules</p>
      <h2 id={headingId} className="text-headline mt-3">
        {title}
      </h2>
      <p className="text-lead mt-4 max-w-2xl text-muted-foreground">
        Places are added by the community and published by its votes, and an admin can also decide one by hand. Here is how it works.
      </p>

      <ol className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
        {RULES.map(({ icon: Icon, title: ruleTitle, body }) => (
          <li key={ruleTitle} className="flex gap-4 border-t border-border-strong pt-5">
            <Icon className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <h3 className="font-display text-xl leading-snug">{ruleTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-10 text-sm text-muted-foreground">
        If you have listed a place, you can follow it under{" "}
        <Link href="/account/places" className="font-medium text-primary underline underline-offset-4 hover:no-underline">
          My places
        </Link>
        .
      </p>
    </section>
  );
}
