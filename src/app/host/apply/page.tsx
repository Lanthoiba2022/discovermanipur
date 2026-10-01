import type { Metadata } from "next";

import { ApplyWizard } from "@/components/host/apply-wizard";

export const metadata: Metadata = {
  title: "Apply to host",
  description:
    "Four short steps to apply to list your homestay, kitchen, guided walk or craft experience on Discover Manipur. Free to apply, and your draft is saved as you go.",
};

export default function HostApplyPage() {
  return (
    <div className="shell pb-24 pt-28 md:pt-32">
      <header className="mx-auto mb-10 max-w-3xl">
        <p className="eyebrow mb-4 flex items-center gap-3 text-muted-foreground">
          <span className="weave-rule inline-block h-[3px] w-10 rounded-full" />
          Host application
        </p>
        <h1 className="text-headline">Apply to host with Discover Manipur</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          About fifteen minutes. Nothing is published and nothing is charged. Applications are not
          sent to a reviewer yet — the review process is still being built in the open — so if you
          want to be listed, say hello on the{" "}
          <a
            href="https://discord.gg/hgGfm6UpU"
            rel="noreferrer noopener"
            target="_blank"
            className="underline underline-offset-4 hover:text-foreground"
          >
            community Discord
          </a>{" "}
          as well.
        </p>
      </header>
      <ApplyWizard />
    </div>
  );
}
