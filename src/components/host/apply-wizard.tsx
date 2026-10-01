"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, ImagePlus, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  submitHostApplication,
  type SubmitApplicationResult,
} from "@/lib/host/application-actions";
import {
  DRAFT_KEY,
  STEPS,
  applicationSchema,
  emptyApplication,
  makeReference,
  type ApplicationValues,
} from "@/lib/host/application-schema";
import { DISTRICTS, HOST_TYPE_LABEL } from "@/lib/host/types";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  file: File;
  url: string;
}

const HOST_TYPE_BLURB: Record<ApplicationValues["hostType"], string> = {
  homestay: "A room, a floor or a whole house that guests can sleep in.",
  eatery: "A kitchen, canteen or stall where guests eat what your family eats.",
  guide: "You take people out — a fort, a ridge, a market, a lake at dawn.",
  experience: "You teach or show something: a loom, a kiln, a pony, a recipe.",
};

function sanitizeDraft(raw: unknown): Partial<ApplicationValues> {
  if (typeof raw !== "object" || raw === null) return {};
  const source = raw as Record<string, unknown>;
  const out: Partial<ApplicationValues> = {};
  for (const [key, fallback] of Object.entries(emptyApplication)) {
    const value = source[key];
    if (typeof value === typeof fallback) {
      // Types line up with the draft's own key, checked above.
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

interface ApplyWizardProps {
  /**
   * `live` sends the application to the server for the signed-in `account`;
   * `local` (no database or sign-in on this deployment) only shows a reference.
   */
  mode: "live" | "local";
  account?: { name: string; email: string };
}

interface Submitted {
  reference: string;
  hostType: ApplicationValues["hostType"];
  propertyName: string;
}

const SEND_FAILED: SubmitApplicationResult = {
  ok: false,
  message: "We could not send your application just now. Try again in a moment.",
};

export function ApplyWizard({ mode, account }: ApplyWizardProps) {
  const live = mode === "live";
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const [restored, setRestored] = useState(false);
  const photosRef = useRef<Photo[]>([]);
  photosRef.current = photos;

  // The server files a live application under the account's email whatever
  // the form says, so the field shows that address and cannot be edited.
  const accountEmail = account?.email;
  const accountName = account?.name;

  const form = useForm<ApplicationValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      ...emptyApplication,
      ...(accountEmail ? { email: accountEmail } : {}),
      ...(accountName ? { applicantName: accountName } : {}),
    },
    mode: "onTouched",
  });
  const {
    register,
    handleSubmit,
    trigger,
    reset,
    watch,
    getValues,
    setValue,
    setError,
    formState: { errors },
  } = form;

  /* ------------------------------ draft storage ----------------------------- */

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(DRAFT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { values?: unknown; step?: unknown };
        const values = sanitizeDraft(parsed.values);
        if (Object.keys(values).length > 0) {
          reset({
            ...emptyApplication,
            ...(accountName ? { applicantName: accountName } : {}),
            ...values,
            agree: false,
            ...(accountEmail ? { email: accountEmail } : {}),
          });
          if (typeof parsed.step === "number") {
            setStep(Math.min(Math.max(0, parsed.step), STEPS.length - 1));
          }
          toast.info("We brought your draft back", {
            description: "Everything except your photos was saved on this device.",
          });
        }
      }
    } catch {
      // A blocked or corrupt store simply means starting fresh.
    }
    setRestored(true);
  }, [reset, accountEmail, accountName]);

  useEffect(() => {
    if (!restored) return;
    const subscription = watch((values) => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ values, step }));
      } catch {
        // Storage full or blocked — the form still works, it just will not persist.
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, step, restored]);

  useEffect(() => {
    const held = photosRef;
    return () => {
      held.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  /* --------------------------------- photos --------------------------------- */

  const addPhotos = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const accepted: Photo[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 8 MB`);
        continue;
      }
      accepted.push({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        url: URL.createObjectURL(file),
      });
    }
    if (accepted.length > 0) {
      setPhotos((prev) => [...prev, ...accepted].slice(0, 10));
    }
  }, []);

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  }

  /* ------------------------------- navigation ------------------------------- */

  async function next() {
    const ok = await trigger(STEPS[step].fields as unknown as (keyof ApplicationValues)[], {
      shouldFocus: true,
    });
    if (!ok) {
      toast.error("A few things still need fixing on this step.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Nothing to clear.
    }
  }

  async function onSubmit(values: ApplicationValues) {
    setSubmitting(true);

    if (!live) {
      // Nothing is sent anywhere; the photos stay in this tab's memory.
      await new Promise((resolve) => setTimeout(resolve, 600));
      const reference = makeReference();
      clearDraft();
      setSubmitted({ reference, hostType: values.hostType, propertyName: values.propertyName });
      setSubmitting(false);
      toast.success("Application ready", {
        description: `Your reference is ${reference}. This copy of the site sends applications nowhere, so nobody will contact you about it.`,
      });
      return;
    }

    let result: SubmitApplicationResult;
    try {
      result = await submitHostApplication(values);
    } catch {
      result = SEND_FAILED;
    }
    setSubmitting(false);

    if (!result.ok) {
      if (result.needsSignIn) {
        router.push(`/auth?next=${encodeURIComponent("/host/apply")}`);
        return;
      }
      const fieldErrors = result.fieldErrors;
      if (fieldErrors) {
        for (const [field, message] of Object.entries(fieldErrors)) {
          setError(field as keyof ApplicationValues, { message });
        }
        const first = STEPS.findIndex((s) =>
          (s.fields as readonly string[]).some((f) => f in fieldErrors),
        );
        if (first !== -1) setStep(first);
      }
      toast.error(result.message);
      return;
    }

    clearDraft();
    const reference = result.reference ?? "";
    setSubmitted({ reference, hostType: values.hostType, propertyName: values.propertyName });
    toast.success("Application sent", {
      description: `Your reference is ${reference}. Come back to this page to see when it has been decided.`,
    });
    // No refresh needed: the action revalidates /host/apply, and the re-render
    // that comes back with it swaps this form for the status panel.
  }

  /* ------------------------------ success screen ---------------------------- */

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center shadow-[var(--shadow-sm)]">
        <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-success/12 text-success">
          <Check className="size-7" aria-hidden="true" />
        </span>
        <h2 className="font-display text-3xl">Thank you for applying</h2>
        <p className="mt-4 text-muted-foreground">
          {live
            ? "Your application has been sent to the Discover Manipur team, who will approve or reject it. You can check its status on this page. Your photos were not sent with it — photo upload is not built yet."
            : "This copy of the site has no database or sign-in connected, so this application was not sent to anyone and nobody will call or visit about it."}{" "}
          Questions? Ask on the{" "}
          <a
            href="https://discord.gg/hgGfm6UpU"
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary underline underline-offset-4"
          >
            community Discord
          </a>
          .
        </p>

        <dl className="mt-8 grid gap-4 rounded-[var(--radius)] bg-surface-sunken p-6 text-left sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Reference</dt>
            <dd className="mt-1 font-mono text-sm font-semibold text-foreground">
              {submitted.reference}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Host type</dt>
            <dd className="mt-1 text-sm text-foreground">
              {HOST_TYPE_LABEL[submitted.hostType]}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Listing</dt>
            <dd className="mt-1 text-sm text-foreground">{submitted.propertyName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Photos (not uploaded)
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              {photos.length} {photos.length === 1 ? "photo" : "photos"} on this device
            </dd>
          </div>
        </dl>

        <p className="mt-6 text-sm text-muted-foreground">
          Write the reference down if you would like to quote it when you ask about hosting.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/host">Back to hosting</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/host/guidelines">Read the hosting standards</Link>
          </Button>
        </div>
      </div>
    );
  }

  /* --------------------------------- wizard --------------------------------- */

  const values = getValues();

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-3xl">
      <ol className="mb-10 grid grid-cols-4 gap-2" aria-label="Application progress">
        {STEPS.map((s, i) => {
          const state = i < step ? "done" : i === step ? "current" : "todo";
          return (
            <li key={s.id} aria-current={state === "current" ? "step" : undefined}>
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-colors",
                  state === "todo" ? "bg-border" : "bg-primary",
                )}
              />
              <span
                className={cn(
                  "mt-2 block text-xs",
                  state === "todo" ? "text-muted-foreground" : "font-medium text-foreground",
                )}
              >
                <span className="sr-only">
                  Step {i + 1} of {STEPS.length}
                  {state === "done" ? ", completed" : state === "current" ? ", current" : ""}:{" "}
                </span>
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Step 1 — host type */}
      {step === 0 && (
        <fieldset className="space-y-4">
          <legend className="font-display text-2xl">What kind of host are you?</legend>
          <p className="text-sm text-muted-foreground">
            Pick the closest one. If you offer more than one, apply for the main one first.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(HOST_TYPE_LABEL) as (keyof typeof HOST_TYPE_LABEL)[]).map((type) => {
              const checked = watch("hostType") === type;
              return (
                <label
                  key={type}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-[var(--radius)] border p-4 transition-colors",
                    checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
                  )}
                >
                  <input
                    type="radio"
                    value={type}
                    {...register("hostType")}
                    className="mt-1 size-4 accent-[var(--primary)]"
                  />
                  <span>
                    <span className="block font-medium text-foreground">
                      {HOST_TYPE_LABEL[type]}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {HOST_TYPE_BLURB[type]}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {errors.hostType && (
            <p className="text-sm text-destructive">{errors.hostType.message}</p>
          )}
        </fieldset>
      )}

      {/* Step 2 — details */}
      {step === 1 && (
        <fieldset className="space-y-6">
          <legend className="font-display text-2xl">Tell us about the place</legend>

          <div>
            <Label htmlFor="propertyName">Name of your place or service</Label>
            <Input
              id="propertyName"
              className="mt-1.5"
              placeholder="Leikai Yumjao Homestay"
              aria-invalid={Boolean(errors.propertyName)}
              aria-describedby={errors.propertyName ? "propertyName-error" : undefined}
              {...register("propertyName")}
            />
            {errors.propertyName && (
              <p id="propertyName-error" className="mt-1.5 text-sm text-destructive">
                {errors.propertyName.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="propertyAddress">Full address</Label>
            <Input
              id="propertyAddress"
              className="mt-1.5"
              placeholder="Thangmeiband Polem Leikai, near Kangla West Gate, Imphal"
              aria-invalid={Boolean(errors.propertyAddress)}
              aria-describedby={errors.propertyAddress ? "propertyAddress-error" : undefined}
              {...register("propertyAddress")}
            />
            {errors.propertyAddress && (
              <p id="propertyAddress-error" className="mt-1.5 text-sm text-destructive">
                {errors.propertyAddress.message}
              </p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="district">District</Label>
              <select
                id="district"
                className="mt-1.5 h-11 w-full rounded-[var(--radius)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                {...register("district")}
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {errors.district && (
                <p className="mt-1.5 text-sm text-destructive">{errors.district.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="capacity">How many guests at once?</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={200}
                className="mt-1.5"
                aria-invalid={Boolean(errors.capacity)}
                aria-describedby={errors.capacity ? "capacity-error" : undefined}
                {...register("capacity", { valueAsNumber: true })}
              />
              {errors.capacity && (
                <p id="capacity-error" className="mt-1.5 text-sm text-destructive">
                  {errors.capacity.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">What will guests get?</Label>
            <Textarea
              id="description"
              rows={6}
              className="mt-1.5"
              placeholder="Two rooms off the courtyard, breakfast of tan and black tea, and an evening walk to the pukhri. My mother cooks the eromba herself."
              aria-invalid={Boolean(errors.description)}
              aria-describedby="description-help"
              {...register("description")}
            />
            <p id="description-help" className="mt-1.5 text-xs text-muted-foreground">
              Write it as you would say it, in Meiteilon, Hindi or English.
            </p>
            {errors.description && (
              <p className="mt-1.5 text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
        </fieldset>
      )}

      {/* Step 3 — contact + photos */}
      {step === 2 && (
        <fieldset className="space-y-6">
          <legend className="font-display text-2xl">Your contact details</legend>

          <div>
            <Label htmlFor="applicantName">Your full name</Label>
            <Input
              id="applicantName"
              className="mt-1.5"
              autoComplete="name"
              aria-invalid={Boolean(errors.applicantName)}
              {...register("applicantName")}
            />
            {errors.applicantName && (
              <p className="mt-1.5 text-sm text-destructive">{errors.applicantName.message}</p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="mt-1.5"
                readOnly={Boolean(accountEmail)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={accountEmail ? "email-help" : undefined}
                {...register("email")}
              />
              {accountEmail && (
                <p id="email-help" className="mt-1.5 text-xs text-muted-foreground">
                  The email on your account, which your application is filed under.
                </p>
              )}
              {errors.email && (
                <p className="mt-1.5 text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98561 20114"
                className="mt-1.5"
                aria-invalid={Boolean(errors.phone)}
                {...register("phone")}
              />
              {errors.phone && (
                <p className="mt-1.5 text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="photos">Photos of your place</Label>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Up to 10 images, 8 MB each. Phone photos in daylight are fine. Photo upload is not
              built yet, so these stay on your device and are not sent with your application.
            </p>
            <label
              htmlFor="photos"
              className="mt-3 flex cursor-pointer items-center justify-center gap-3 rounded-[var(--radius)] border border-dashed border-border-strong bg-surface-sunken px-4 py-8 text-sm text-muted-foreground transition-colors hover:bg-muted focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring"
            >
              <ImagePlus className="size-5" aria-hidden="true" />
              Choose photos
              <input
                id="photos"
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  addPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>

            {photos.length > 0 && (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {photos.map((photo) => (
                  <li key={photo.id} className="relative">
                    {/* Object URLs cannot go through next/image's optimiser. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={`Preview of ${photo.file.name}`}
                      className="h-28 w-full rounded-[var(--radius-sm)] object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      aria-label={`Remove ${photo.file.name}`}
                      className="absolute right-2 top-2 rounded-full bg-surface/90 p-1.5 text-destructive shadow-[var(--shadow-sm)] transition-colors hover:bg-surface"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </fieldset>
      )}

      {/* Step 4 — review */}
      {step === 3 && (
        <fieldset className="space-y-6">
          <legend className="font-display text-2xl">Check it over</legend>

          <dl className="divide-y divide-border rounded-[var(--radius-lg)] border border-border">
            {[
              ["Host type", HOST_TYPE_LABEL[values.hostType]],
              ["Name", values.propertyName],
              ["Address", values.propertyAddress],
              ["District", values.district],
              ["Guests at once", String(values.capacity)],
              ["Description", values.description],
              ["Your name", values.applicantName],
              ["Email", values.email],
              ["Phone", values.phone],
              ["Photos", `${photos.length} on this device (not uploaded)`],
            ].map(([label, value]) => (
              <div key={label} className="grid gap-1 p-4 sm:grid-cols-3">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="text-sm text-foreground sm:col-span-2">{value || "—"}</dd>
              </div>
            ))}
          </dl>

          <div className="flex gap-3 rounded-[var(--radius)] bg-surface-sunken p-4">
            <input
              id="agree"
              type="checkbox"
              className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
              {...register("agree")}
            />
            <Label htmlFor="agree" className="text-sm font-normal leading-relaxed">
              I have read the{" "}
              <Link href="/host/guidelines" className="text-primary underline underline-offset-4">
                hosting standards
              </Link>{" "}
              and everything above is true.
            </Label>
          </div>
          {errors.agree && <p className="text-sm text-destructive">{errors.agree.message}</p>}
        </fieldset>
      )}

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
        <Button type="button" variant="ghost" onClick={back} disabled={step === 0}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              try {
                window.localStorage.setItem(
                  DRAFT_KEY,
                  JSON.stringify({ values: getValues(), step }),
                );
                toast.success("Draft saved on this device");
              } catch {
                toast.error("This browser will not let us save a draft.");
              }
            }}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Save draft
          </button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next}>
              Continue
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {submitting ? (live ? "Sending" : "Preparing") : "Submit application"}
            </Button>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Your answers are kept in this browser as you go, so a refresh will not lose them.{" "}
        <button
          type="button"
          className="underline underline-offset-4 hover:text-foreground"
          onClick={() => {
            try {
              window.localStorage.removeItem(DRAFT_KEY);
            } catch {
              // Nothing to clear.
            }
            reset({
              ...emptyApplication,
              ...(accountEmail ? { email: accountEmail } : {}),
              ...(accountName ? { applicantName: accountName } : {}),
            });
            setValue("hostType", "homestay");
            setStep(0);
            toast.success("Draft cleared");
          }}
        >
          Clear the draft
        </button>
      </p>
    </form>
  );
}
