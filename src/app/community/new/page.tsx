import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Ban, LogIn, MailCheck, MapPinned } from "lucide-react";

import { PlaceForm } from "@/components/community/place-form";
import { VerifyEmailPanel } from "@/components/community/verify-email-panel";
import { Button } from "@/components/ui/button";
import { isAuthConfigured } from "@/lib/auth/env";
import { LIMITS, UPVOTES_REQUIRED, VOTING_WINDOW_HOURS } from "@/lib/community/rules";
import { isPhotoStorageConfigured } from "@/lib/community/storage";
import { getCommunityViewer } from "@/lib/community/viewer";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata: Metadata = {
  title: "Add a place",
  description:
    "List an attraction, cafe, homestay or craft workshop in Manipur. Verified members vote on it before it is published.",
  robots: { index: false, follow: false },
};

const NEXT_PATH = "/community/new";

function Header() {
  return (
    <header className="mb-10">
      <p className="eyebrow mb-4 flex items-center gap-3 text-muted-foreground">
        <span className="weave-rule inline-block h-[3px] w-10 rounded-full" />
        Community places
      </p>
      <h1 className="text-headline">Add a place</h1>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
        Know a hidden viewpoint, a family kitchen, a homestay or a weaver worth visiting? List it here. Other
        members check it before anyone else sees it.
      </p>
    </header>
  );
}

function WhatHappensNext() {
  return (
    <aside
      aria-labelledby="next-steps-heading"
      className="mb-10 rounded-[var(--radius-lg)] border border-border bg-surface-sunken p-5 sm:p-6"
    >
      <h2 id="next-steps-heading" className="font-display text-xl">
        What happens after you submit
      </h2>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
        <li>
          Your place is shown only to signed-in members with a verified email address, who can upvote it. You
          cannot vote for your own place.
        </li>
        <li>
          It is published once {UPVOTES_REQUIRED} different verified members upvote it within{" "}
          {VOTING_WINDOW_HOURS} hours of being listed.
        </li>
        <li>
          If it does not reach {UPVOTES_REQUIRED} upvotes in time, it is held for an admin to review. Nothing is
          deleted.
        </li>
      </ol>
      <p className="mt-4 text-sm text-muted-foreground">
        You can list up to {LIMITS.submissionsPerDay} places in any 24 hours, and follow each one in{" "}
        <Link href="/account/places" className="text-primary underline underline-offset-4">
          My places
        </Link>
        .{" "}
        <Link href="/community#how-verification-works" className="text-primary underline underline-offset-4">
          How verification works
        </Link>
      </p>
    </aside>
  );
}

function Notice({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sunken px-6 py-14 text-center">
      <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mx-auto mt-3 max-w-md text-muted-foreground">{children}</div>
      {action && <div className="mt-8 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

async function Body() {
  if (!isAuthConfigured || !isDatabaseConfigured) {
    return (
      <Notice icon={<MapPinned className="size-6" aria-hidden="true" />} title="Not available on this site yet">
        <p>
          Listing places needs sign-in and a database, and this copy of the site has neither connected. You can
          still browse the places already on Discover Manipur.
        </p>
      </Notice>
    );
  }

  const viewer = await getCommunityViewer();

  if (!viewer) {
    return (
      <Notice
        icon={<LogIn className="size-6" aria-hidden="true" />}
        title="Sign in to add a place"
        action={
          <Button asChild>
            <Link href={`/auth?next=${encodeURIComponent(NEXT_PATH)}`}>Sign in to continue</Link>
          </Button>
        }
      >
        <p>
          Places are listed from a verified account, so you can follow yours and other members know who added
          it. Sign in or create a free account and we will bring you straight back here.
        </p>
      </Notice>
    );
  }

  if (viewer.banned) {
    return (
      <Notice
        icon={<Ban className="size-6" aria-hidden="true" />}
        title="This account cannot add places"
        action={
          <Button asChild variant="outline">
            <Link href="/contact">Contact us</Link>
          </Button>
        }
      >
        <p>
          This account cannot take part in community listings. If you think that is a mistake, contact the
          Discover Manipur team.
        </p>
      </Notice>
    );
  }

  if (!viewer.canParticipate) {
    return (
      <Notice
        icon={<MailCheck className="size-6" aria-hidden="true" />}
        title="Verify your email address first"
        action={<VerifyEmailPanel email={viewer.email} />}
      >
        <p>
          Only accounts with a verified email address can list or vote on places, which keeps it to one vote per
          person. It takes a minute: we email you a 6-digit code and you enter it here.
        </p>
      </Notice>
    );
  }

  return (
    <>
      <WhatHappensNext />
      <PlaceForm viewerName={viewer.name} photosEnabled={isPhotoStorageConfigured} />
    </>
  );
}

export default function NewCommunityPlacePage() {
  return (
    <div className="pb-24 pt-28 md:pt-32">
      <div className="shell max-w-3xl">
        <Header />
        <Body />
      </div>
    </div>
  );
}
