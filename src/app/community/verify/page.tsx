import { Inbox, LogIn, MailCheck, PlugZap, Plus, ShieldAlert, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PageHero } from "@/components/content/page-hero";
import { PlaceCard } from "@/components/community/place-card";
import { VerificationRules } from "@/components/community/verification-rules";
import { VerifyEmailPanel } from "@/components/community/verify-email-panel";
import { VoteButton } from "@/components/community/vote-button";
import { IntentLink } from "@/components/shared/intent-link";
import { Button } from "@/components/ui/button";
import { isAuthConfigured } from "@/lib/auth/env";
import { listVerificationQueue } from "@/lib/community/queries";
import { UPVOTES_REQUIRED, VOTING_WINDOW_HOURS } from "@/lib/community/rules";
import type { CommunityViewer, VerificationQueueItem } from "@/lib/community/types";
import { getCommunityViewer } from "@/lib/community/viewer";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata: Metadata = {
  title: "Help verify new places",
  description: `Upvote community places in Manipur that are waiting to be published. Each needs ${UPVOTES_REQUIRED} upvotes from verified users within ${VOTING_WINDOW_HOURS} hours.`,
  robots: { index: false, follow: false },
};

const SIGN_IN_HREF = `/auth?next=${encodeURIComponent("/community/verify")}`;

export default async function VerifyPage() {
  const available = isAuthConfigured && isDatabaseConfigured;
  const viewer = available ? await getCommunityViewer() : null;
  const mayView = viewer !== null && (viewer.canParticipate || viewer.role === "admin");
  const queue = mayView ? await listVerificationQueue(viewer) : [];

  return (
    <div className="pb-24">
      <PageHero
        tone="light"
        eyebrow="Community places"
        title="Help verify new places"
        completion="your upvote is how a place goes public."
        lede={
          <p>
            New places are listed by members of the community. Each one is published once{" "}
            {UPVOTES_REQUIRED} different verified users upvote it within {VOTING_WINDOW_HOURS} hours
            of it being listed. Upvote the places you know are real and described fairly.
          </p>
        }
        figures={
          mayView
            ? [
                { value: String(queue.length), label: "Waiting for votes" },
                { value: String(UPVOTES_REQUIRED), label: "Upvotes to publish" },
                { value: String(VOTING_WINDOW_HOURS), label: "Hours to collect them" },
                {
                  value: String(queue.filter((item) => item.vote.hasVoted).length),
                  label: "You have upvoted",
                },
              ]
            : undefined
        }
      />

      <div className="shell mt-16 flex flex-col gap-10 md:mt-20">
        <Body available={available} viewer={viewer} mayView={mayView} queue={queue} />
        <VerificationRules className="mt-6" />
      </div>
    </div>
  );
}

function Body({
  available,
  viewer,
  mayView,
  queue,
}: {
  available: boolean;
  viewer: CommunityViewer | null;
  mayView: boolean;
  queue: VerificationQueueItem[];
}) {
  if (!available) {
    return (
      <Callout icon={PlugZap} title="Community places are not available here">
        <p>
          This copy of the site is running without a database or sign-in, so community listings
          and voting are switched off. The rest of the site works as normal.
        </p>
      </Callout>
    );
  }

  if (!viewer) {
    return (
      <Callout
        icon={LogIn}
        title="Sign in to see places waiting for votes"
        action={
          <Button asChild variant="primary" size="pill">
            <IntentLink href={SIGN_IN_HREF}>Sign in or create an account</IntentLink>
          </Button>
        }
      >
        <p>
          Places that have not been published yet are only shown to signed-in users with a verified
          email address, so that nothing unverified is public. Sign in to see them and add your
          upvote.
        </p>
      </Callout>
    );
  }

  if (!mayView) {
    return viewer.banned ? (
      <Callout icon={ShieldAlert} title="This account cannot take part">
        <p>
          This account cannot list or vote on community places. If you think this is a mistake,{" "}
          <IntentLink href="/contact" className="font-medium text-primary underline underline-offset-4">
            contact the team
          </IntentLink>
          .
        </p>
      </Callout>
    ) : (
      <Callout
        icon={MailCheck}
        title="Verify your email address to vote"
        action={<VerifyEmailPanel email={viewer.email} />}
      >
        <p>
          You are signed in, but your email address is not verified yet. Only verified users can
          see places waiting for votes and upvote them. We email you a 6-digit code and you enter it
          here.
        </p>
      </Callout>
    );
  }

  if (queue.length === 0) {
    return (
      <Callout
        icon={Inbox}
        title="Nothing is waiting for votes right now"
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="primary" size="pill">
              <IntentLink href="/community/new">
                <Plus aria-hidden="true" />
                Add a place
              </IntentLink>
            </Button>
            <Button asChild variant="outline" size="pill">
              <IntentLink href="/community">See published places</IntentLink>
            </Button>
          </div>
        }
      >
        <p>
          No place is collecting votes at the moment. A place leaves this list once it is published
          or its {VOTING_WINDOW_HOURS} hours run out. Know somewhere that belongs on the map? List
          it.
        </p>
      </Callout>
    );
  }

  return (
    <section aria-labelledby="queue-heading">
      <div className="border-b border-border-strong pb-6">
        <h2 id="queue-heading" className="text-headline">
          Waiting for votes
        </h2>
        <p className="text-lead mt-3 text-muted-foreground">
          Closing soonest first. Open a place to read the full description and see every photo.
        </p>
      </div>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {queue.map((item, index) => (
          <li key={item.id} className="flex">
            <PlaceCard
              place={item}
              preload={index < 3}
              footer={
                <VoteButton
                  placeId={item.id}
                  placeName={item.name}
                  vote={item.vote}
                  isOwn={item.isOwn}
                  layout="compact"
                />
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Callout({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sand px-6 py-20 text-center">
      <span className="mask-arch grid size-14 place-items-center bg-surface text-[var(--stone-700)] shadow-[var(--shadow-sm)]">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-display text-2xl">{title}</h2>
      <div className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{children}</div>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
