import { CheckCircle2, Clock, LogIn, XCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { ApplicantStatus } from "@/lib/host/applications";
import { HOST_TYPE_LABEL } from "@/lib/host/types";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function SignInPrompt() {
  return (
    <div className="mx-auto max-w-2xl rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-sunken px-6 py-14 text-center">
      <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <LogIn className="size-6" aria-hidden="true" />
      </span>
      <h2 className="font-display text-2xl">Sign in to apply</h2>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        Your application is tied to your account, so you can come back here to see whether it has
        been approved. Sign in or create a free account and we will bring you straight back to the
        form.
      </p>
      <Button asChild className="mt-8">
        <Link href={`/auth?next=${encodeURIComponent("/host/apply")}`}>Sign in to continue</Link>
      </Button>
    </div>
  );
}

const STATUS_COPY = {
  pending: {
    icon: Clock,
    tone: "bg-warning/12 text-warning",
    title: "Your application is waiting for review",
    body: "Someone on the Discover Manipur team will read it and approve or reject it. You can send another application once this one has been decided.",
  },
  approved: {
    icon: CheckCircle2,
    tone: "bg-success/12 text-success",
    title: "Your application was approved",
    body: "Your account now has access to the host dashboard.",
  },
  rejected: {
    icon: XCircle,
    tone: "bg-destructive/12 text-destructive",
    title: "Your application was not approved",
    body: "The reviewer's reason is below. You are welcome to apply again with the form underneath.",
  },
} as const;

export function ApplicationStatusPanel({ application }: { application: ApplicantStatus }) {
  const copy = STATUS_COPY[application.status];
  const Icon = copy.icon;
  return (
    <section
      aria-labelledby="application-status-heading"
      className="mx-auto mb-12 max-w-3xl rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-sm)] sm:p-8"
    >
      <div className="flex items-start gap-4">
        <span
          className={cn("flex size-12 shrink-0 items-center justify-center rounded-full", copy.tone)}
        >
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Your latest application
          </p>
          <h2 id="application-status-heading" className="mt-1 font-display text-2xl">
            {copy.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{copy.body}</p>
        </div>
      </div>

      <dl className="mt-6 grid gap-4 rounded-[var(--radius)] bg-surface-sunken p-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">Reference</dt>
          <dd className="mt-1 font-mono text-sm font-semibold text-foreground">
            {application.reference}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">Listing</dt>
          <dd className="mt-1 text-sm text-foreground">
            {application.propertyName} · {HOST_TYPE_LABEL[application.hostType]}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">Submitted</dt>
          <dd className="mt-1 text-sm text-foreground">{formatDate(application.createdAt)}</dd>
        </div>
        {application.status !== "pending" && (
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Decided</dt>
            <dd className="mt-1 text-sm text-foreground">{formatDate(application.updatedAt)}</dd>
          </div>
        )}
        {application.reviewerNote && (
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Reviewer&apos;s note
            </dt>
            <dd className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground">
              {application.reviewerNote}
            </dd>
          </div>
        )}
      </dl>

      {application.status === "approved" && (
        <Button asChild className="mt-6">
          <Link href="/host/dashboard">Open the host dashboard</Link>
        </Button>
      )}
    </section>
  );
}
