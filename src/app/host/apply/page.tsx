import type { Metadata } from "next";

import { ApplyWizard } from "@/components/host/apply-wizard";
import { getSessionProfile } from "@/lib/auth/dal";
import { applicationsAreLive, getLatestApplication, type ApplicantStatus } from "@/lib/host/applications";

import { ApplicationStatusPanel, SignInPrompt } from "./status-panel";

export const metadata: Metadata = {
  title: "Apply to host",
  description:
    "Four short steps to apply to list your homestay, kitchen, guided walk or craft experience on Discover Manipur. Free to apply, and your draft is saved as you go.",
};

const DISCORD = (
  <a
    href="https://discord.gg/hgGfm6UpU"
    rel="noreferrer noopener"
    target="_blank"
    className="underline underline-offset-4 hover:text-foreground"
  >
    community Discord
  </a>
);

function Header({ live }: { live: boolean }) {
  return (
    <header className="mx-auto mb-10 max-w-3xl">
      <p className="eyebrow mb-4 flex items-center gap-3 text-muted-foreground">
        <span className="weave-rule inline-block h-[3px] w-10 rounded-full" />
        Host application
      </p>
      <h1 className="text-headline">Apply to host with Discover Manipur</h1>
      {live ? (
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          About fifteen minutes. Nothing is published and nothing is charged. Your application goes
          to the Discover Manipur team, who approve or reject it, and you can check its status on
          this page. Questions in the meantime? Ask on the {DISCORD}.
        </p>
      ) : (
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          About fifteen minutes. Nothing is published and nothing is charged. This copy of the site
          has no database or sign-in connected, so applications are not sent to anyone — if you
          want to be listed, say hello on the {DISCORD} as well.
        </p>
      )}
    </header>
  );
}

export default async function HostApplyPage() {
  if (!applicationsAreLive) {
    return (
      <div className="shell pb-24 pt-28 md:pt-32">
        <Header live={false} />
        <ApplyWizard mode="local" />
      </div>
    );
  }

  const profile = await getSessionProfile();
  let latest: ApplicantStatus | null = null;
  if (profile) {
    try {
      latest = await getLatestApplication(profile.id);
    } catch (err) {
      // The form still works; the action enforces one open application itself.
      console.warn("[host-apply] status read failed:", (err as Error).message);
    }
  }

  const name = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
    : "";

  return (
    <div className="shell pb-24 pt-28 md:pt-32">
      <Header live />
      {!profile ? (
        <SignInPrompt />
      ) : (
        <>
          {latest && <ApplicationStatusPanel application={latest} />}
          {latest?.status !== "pending" && (
            <ApplyWizard mode="live" account={{ name, email: profile.email }} />
          )}
        </>
      )}
    </div>
  );
}
