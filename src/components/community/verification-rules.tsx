import {
  ArrowUpRight,
  BadgeCheck,
  CirclePause,
  EyeOff,
  Scale,
  ThumbsUp,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { LIMITS, UPVOTES_REQUIRED, VOTING_WINDOW_HOURS } from "@/lib/community/rules";
import { cn } from "@/lib/utils";

/** The file every number on this list comes from. Public, so anyone can check it. */
export const RULES_SOURCE_URL =
  "https://github.com/Lanthoiba2022/discovermanipur/blob/main/src/lib/community/rules.ts";

interface Rule {
  icon: LucideIcon;
  title: string;
  body: ReactNode;
}

const RULES: Rule[] = [
  {
    icon: UserPlus,
    title: "Who can list a place",
    body: (
      <>
        Anyone signed in with a verified email address. You can list up to{" "}
        {LIMITS.submissionsPerDay} places in any 24 hours, with up to {LIMITS.photosPerPlace}{" "}
        photos each, and have up to {LIMITS.openSubmissions} collecting votes at once.
      </>
    ),
  },
  {
    icon: ThumbsUp,
    title: "Who can vote",
    body: (
      <>
        Signed-in users with a verified email address. Each account has one vote per place, nobody
        can vote for a place they listed, and a vote can be withdrawn while the place is still
        collecting votes.
      </>
    ),
  },
  {
    icon: BadgeCheck,
    title: `${UPVOTES_REQUIRED} upvotes in ${VOTING_WINDOW_HOURS} hours`,
    body: (
      <>
        A place is published once it has {UPVOTES_REQUIRED} upvotes from different verified users,
        all within {VOTING_WINDOW_HOURS} hours of being listed.
      </>
    ),
  },
  {
    icon: CirclePause,
    title: "Otherwise, held for review",
    body: (
      <>
        If it does not reach {UPVOTES_REQUIRED} upvotes in time, it leaves the voting queue and is
        held for an admin to review by hand. Nothing is deleted.
      </>
    ),
  },
  {
    icon: EyeOff,
    title: "Nothing unverified is public",
    body: (
      <>
        Until a place is published, only signed-in verified users can see it. Signed-out visitors
        and search engines only ever see published places.
      </>
    ),
  },
  {
    icon: Scale,
    title: "The same rules for everyone",
    body: (
      <>
        Every place and every person, admins included, goes through the same vote. An admin can also
        publish, hold or reject a place by hand at any stage, for example to review one held after
        its window, and every such decision records who made it and when.
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
        Places are added by the community and published by it too. These are the whole rules.
      </p>

      <ol className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
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
        The numbers on this page are read from the same file the server uses to enforce them.{" "}
        <a
          href={RULES_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4 hover:no-underline"
        >
          Read the rules on GitHub
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </p>
    </section>
  );
}
