"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import { IntentLink } from "@/components/shared/intent-link";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitPlace } from "@/lib/community/actions";
import { PLACE_LIMITS, placeSubmissionSchema, type PlaceSubmission, type PlaceSubmissionInput } from "@/lib/community/schema";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  DISTRICTS,
  RELATIONSHIPS,
  RELATIONSHIP_LABELS,
  type CommunityCategory,
  type SubmitterRelationship,
} from "@/lib/community/taxonomy";
import { cn } from "@/lib/utils";

import { PhotoUploader, type PhotoUploaderState } from "./photo-uploader";

const {
  descriptionMin: DESCRIPTION_MIN,
  descriptionMax: DESCRIPTION_MAX,
  practicalMax: PRACTICAL_MAX,
  sources: MAX_SOURCES,
} = PLACE_LIMITS;

const CATEGORY_BLURB: Record<CommunityCategory, string> = {
  attraction: "A viewpoint, lake, shrine, trail or anything else worth the trip.",
  eatery: "Somewhere to eat or drink, from a roadside stall to a sit-down restaurant.",
  stay: "A homestay, guest house, lodge or resort where visitors can sleep.",
  craft: "Weavers, makers and shops selling handloom, crafts or traditional wear.",
};

const RELATIONSHIP_BLURB: Record<SubmitterRelationship, string> = {
  none: "You know it as a visitor or a neighbour.",
  owner: "Owners are welcome to list their own place. The page will say it was listed by the owner.",
  connected: "The page will say it was listed by someone close to the owner.",
};

const FIELD_NAMES = new Set<string>([
  "name",
  "category",
  "district",
  "location",
  "lat",
  "lng",
  "description",
  "practicalDetails",
  "sources",
  "relationship",
  "photoIds",
  "photoAlts",
  "agree",
]);

const nf = new Intl.NumberFormat("en-IN");

/** An empty box is "not given"; anything else is a number for the schema to check. */
function toCoordinate(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isNaN(value) ? undefined : value;
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return Number(value.trim());
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-destructive">
      {message}
    </p>
  );
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="space-y-6 rounded-[var(--radius-lg)] border border-border bg-surface p-5 sm:p-8"
    >
      <div>
        <h2 id={`${id}-heading`} className="font-display text-2xl">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/** Space-separated ids for aria-describedby, skipping the empty ones. */
function describedBy(...ids: (string | false | undefined)[]) {
  return ids.filter(Boolean).join(" ") || undefined;
}

const selectClass =
  "mt-1.5 h-11 w-full rounded-[var(--radius)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring";

const optionCardClass =
  "flex cursor-pointer gap-3 rounded-[var(--radius)] border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring";

interface PlaceFormProps {
  /** The signed-in person's name, the default author for their own photos. */
  viewerName: string;
  /** False when this deployment cannot store photos. */
  photosEnabled: boolean;
}

export function PlaceForm({ viewerName, photosEnabled }: PlaceFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sourceKeys, setSourceKeys] = useState<number[]>([]);
  const nextSourceKey = useRef(0);
  const submittingRef = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    setError,
    setFocus,
    formState: { errors, isSubmitted },
  } = useForm<PlaceSubmissionInput, unknown, PlaceSubmission>({
    resolver: zodResolver(placeSubmissionSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
      practicalDetails: "",
      sources: [],
      photoIds: [],
      photoAlts: {},
    },
    mode: "onTouched",
  });

  const description = useWatch({ control, name: "description" }) ?? "";
  const practical = useWatch({ control, name: "practicalDetails" }) ?? "";
  const sources = useWatch({ control, name: "sources" }) ?? [];
  const category = useWatch({ control, name: "category" });
  const relationship = useWatch({ control, name: "relationship" });

  const onPhotosChange = useCallback(
    ({ photoIds, photoAlts, uploading: busy }: PhotoUploaderState) => {
      setUploading(busy);
      setValue("photoIds", photoIds, { shouldValidate: isSubmitted });
      setValue("photoAlts", photoAlts, { shouldValidate: isSubmitted });
    },
    [setValue, isSubmitted],
  );

  /* --------------------------------- sources -------------------------------- */

  function addSource() {
    if (sources.length >= MAX_SOURCES) return;
    nextSourceKey.current += 1;
    const key = nextSourceKey.current;
    setSourceKeys((keys) => [...keys, key]);
    setValue("sources", [...sources, ""]);
    requestAnimationFrame(() => document.getElementById(`place-source-${key}`)?.focus());
  }

  function removeSource(index: number) {
    setSourceKeys((keys) => keys.filter((_, i) => i !== index));
    setValue(
      "sources",
      sources.filter((_, i) => i !== index),
      { shouldValidate: isSubmitted },
    );
    requestAnimationFrame(() => document.getElementById("place-add-source")?.focus());
  }

  /** Blank link rows are left out rather than reported as invalid links. */
  function compactSources() {
    const current = getValues("sources") ?? [];
    const keep = current.map((value, i) => (value.trim() ? i : -1)).filter((i) => i >= 0);
    if (keep.length === current.length) return;
    setSourceKeys((keys) => keep.map((i) => keys[i]));
    setValue(
      "sources",
      keep.map((i) => current[i]),
    );
  }

  /* --------------------------------- submit --------------------------------- */

  function send(values: PlaceSubmission) {
    if (submittingRef.current || done) return;
    submittingRef.current = true;
    setFormError(null);

    startTransition(async () => {
      try {
        const result = await submitPlace(values);
        if (result.ok) {
          setDone(true);
          router.push(`/community/${result.data.slug}?listed=1`);
          return;
        }

        let focused = false;
        const unmatched: string[] = [];
        for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
          if (FIELD_NAMES.has(field)) {
            const name = field as FieldPath<PlaceSubmissionInput>;
            setError(name, { type: "server", message });
            if (!focused && name !== "photoIds" && name !== "sources") {
              setFocus(name);
              focused = true;
            }
          } else if (message !== result.error) {
            unmatched.push(message);
          }
        }
        const message = [result.error, ...unmatched].join(" ");
        setFormError(message);
        toast.error(result.error);
        if (!focused) requestAnimationFrame(() => errorRef.current?.focus());
      } catch {
        const message = "We could not reach the server. Check your connection and try again.";
        setFormError(message);
        toast.error(message);
        requestAnimationFrame(() => errorRef.current?.focus());
      } finally {
        submittingRef.current = false;
      }
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading || pending || done) return;
    compactSources();
    void handleSubmit(send)(event);
  }

  const busy = pending || done;
  const descriptionLength = description.trim().length;
  const practicalLength = practical.trim().length;
  const sourcesError = errors.sources?.message ?? errors.sources?.root?.message;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8" aria-busy={busy}>
      <Section id="place-about" title="About the place">
        <div>
          <Label htmlFor="place-name">Name</Label>
          <Input
            id="place-name"
            maxLength={PLACE_LIMITS.nameMax}
            placeholder="Sendra Park viewpoint"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "place-name-error" : undefined}
            className={cn("mt-1.5", errors.name && "border-destructive")}
            {...register("name")}
          />
          <FieldError id="place-name-error" message={errors.name?.message} />
        </div>

        <fieldset aria-describedby={errors.category ? "place-category-error" : undefined}>
          <legend className="text-sm font-medium text-foreground">What kind of place is it?</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {CATEGORIES.map((value) => (
              <label
                key={value}
                className={cn(
                  optionCardClass,
                  category === value ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
                )}
              >
                <input
                  type="radio"
                  value={value}
                  className="mt-1 size-4 accent-[var(--primary)]"
                  {...register("category")}
                />
                <span>
                  <span className="block font-medium text-foreground">{CATEGORY_LABELS[value]}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{CATEGORY_BLURB[value]}</span>
                </span>
              </label>
            ))}
          </div>
          <FieldError id="place-category-error" message={errors.category?.message} />
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="place-district">District</Label>
            <select
              id="place-district"
              defaultValue=""
              aria-invalid={Boolean(errors.district)}
              aria-describedby={errors.district ? "place-district-error" : undefined}
              className={cn(selectClass, errors.district && "border-destructive")}
              {...register("district")}
            >
              <option value="" disabled>
                Choose a district
              </option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <FieldError id="place-district-error" message={errors.district?.message} />
          </div>

          <div>
            <Label htmlFor="place-location">Where it is</Label>
            <Input
              id="place-location"
              maxLength={PLACE_LIMITS.locationMax}
              placeholder="Thanga, near the Sendra Park gate"
              aria-invalid={Boolean(errors.location)}
              aria-describedby={describedBy("place-location-help", errors.location && "place-location-error")}
              className={cn("mt-1.5", errors.location && "border-destructive")}
              {...register("location")}
            />
            <p id="place-location-help" className="mt-1.5 text-xs text-muted-foreground">
              The leikai or village, and a landmark people can ask for.
            </p>
            <FieldError id="place-location-error" message={errors.location?.message} />
          </div>
        </div>

        <fieldset aria-describedby="place-coords-help">
          <legend className="text-sm font-medium text-foreground">Map position (optional)</legend>
          <p id="place-coords-help" className="mt-1.5 text-xs text-muted-foreground">
            Decimal degrees, for example 24.5311 and 93.7714. In Google Maps, press and hold on the spot and copy the
            two numbers it shows. Give both or leave both empty.
          </p>
          <div className="mt-3 grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="place-lat">Latitude</Label>
              <Input
                id="place-lat"
                inputMode="decimal"
                autoComplete="off"
                placeholder="24.5311"
                aria-invalid={Boolean(errors.lat)}
                aria-describedby={errors.lat ? "place-lat-error" : undefined}
                className={cn("mt-1.5", errors.lat && "border-destructive")}
                {...register("lat", { setValueAs: toCoordinate })}
              />
              <FieldError id="place-lat-error" message={errors.lat?.message} />
            </div>
            <div>
              <Label htmlFor="place-lng">Longitude</Label>
              <Input
                id="place-lng"
                inputMode="decimal"
                autoComplete="off"
                placeholder="93.7714"
                aria-invalid={Boolean(errors.lng)}
                aria-describedby={errors.lng ? "place-lng-error" : undefined}
                className={cn("mt-1.5", errors.lng && "border-destructive")}
                {...register("lng", { setValueAs: toCoordinate })}
              />
              <FieldError id="place-lng-error" message={errors.lng?.message} />
            </div>
          </div>
        </fieldset>
      </Section>

      <Section
        id="place-details"
        title="Description and practical details"
        description="Write it for someone who has never been. What makes it worth the trip, and what should they know before they go?"
      >
        <div>
          <Label htmlFor="place-description">Description</Label>
          <Textarea
            id="place-description"
            rows={7}
            maxLength={DESCRIPTION_MAX}
            placeholder="A short climb above Loktak Lake with a view over the phumdis. Quietest early in the morning, when the fishing boats go out."
            aria-invalid={Boolean(errors.description)}
            aria-describedby={describedBy("place-description-count", errors.description && "place-description-error")}
            className={cn("mt-1.5 min-h-40", errors.description && "border-destructive")}
            {...register("description")}
          />
          <p id="place-description-count" className="mt-1.5 text-xs text-muted-foreground">
            {descriptionLength < DESCRIPTION_MIN
              ? `${nf.format(descriptionLength)} of at least ${DESCRIPTION_MIN} characters.`
              : `${nf.format(descriptionLength)} of ${nf.format(DESCRIPTION_MAX)} characters.`}
          </p>
          <FieldError id="place-description-error" message={errors.description?.message} />
        </div>

        <div>
          <Label htmlFor="place-practical">Practical details (optional)</Label>
          <Textarea
            id="place-practical"
            rows={5}
            maxLength={PRACTICAL_MAX}
            placeholder="Open 9am to 5pm, closed on Mondays. Entry ₹20. Shared autos from Moirang stop at the turning."
            aria-invalid={Boolean(errors.practicalDetails)}
            aria-describedby={describedBy(
              "place-practical-help",
              errors.practicalDetails && "place-practical-error",
            )}
            className={cn("mt-1.5", errors.practicalDetails && "border-destructive")}
            {...register("practicalDetails")}
          />
          <p id="place-practical-help" className="mt-1.5 text-xs text-muted-foreground">
            Opening hours, prices, how to get there, what to wear or bring. {nf.format(practicalLength)} of{" "}
            {nf.format(PRACTICAL_MAX)} characters.
          </p>
          <FieldError id="place-practical-error" message={errors.practicalDetails?.message} />
        </div>
      </Section>

      <Section
        id="place-sources"
        title="Sources"
        description={`Optional. Up to ${MAX_SOURCES} links that back up what you wrote: an official page, a news report, a map listing or the place's own social media page.`}
      >
        {sources.length > 0 && (
          <ul className="space-y-3">
            {sources.map((value, index) => {
              const key = sourceKeys[index] ?? index;
              const rowError = errors.sources?.[index]?.message;
              const inputId = `place-source-${key}`;
              const errorId = `place-source-${key}-error`;
              return (
                <li key={key}>
                  <Label htmlFor={inputId}>Link {index + 1}</Label>
                  <div className="mt-1.5 flex items-start gap-2">
                    <Input
                      id={inputId}
                      type="url"
                      inputMode="url"
                      maxLength={PLACE_LIMITS.sourceUrlMax}
                      placeholder="https://"
                      value={value}
                      onChange={(e) => {
                        const next = [...(getValues("sources") ?? [])];
                        next[index] = e.target.value;
                        setValue("sources", next, { shouldValidate: isSubmitted });
                      }}
                      aria-invalid={Boolean(rowError)}
                      aria-describedby={rowError ? errorId : undefined}
                      className={cn(rowError && "border-destructive")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSource(index)}
                      aria-label={`Remove link ${index + 1}`}
                      className="shrink-0 hover:text-destructive"
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                  <FieldError id={errorId} message={rowError} />
                </li>
              );
            })}
          </ul>
        )}
        <div>
          <Button
            id="place-add-source"
            type="button"
            variant="outline"
            size="sm"
            onClick={addSource}
            disabled={sources.length >= MAX_SOURCES}
            aria-describedby={sourcesError ? "place-sources-error" : undefined}
          >
            <Plus aria-hidden="true" />
            {sources.length === 0 ? "Add a link" : "Add another link"}
          </Button>
          {sources.length >= MAX_SOURCES && (
            <p className="mt-2 text-xs text-muted-foreground">That is the most links a place can have.</p>
          )}
          <FieldError id="place-sources-error" message={sourcesError} />
        </div>
      </Section>

      <Section
        id="place-photos"
        title="Photos"
        description="Optional, but photos help voters see the place is real. Add only photos you took, or ones that carry an open licence."
      >
        <PhotoUploader
          defaultAuthor={viewerName}
          enabled={photosEnabled}
          onChange={onPhotosChange}
          error={errors.photoIds?.message ?? errors.photoIds?.root?.message}
          errorId="place-photos-error"
          disabled={busy}
        />
      </Section>

      <Section id="place-connection" title="Your connection to the place">
        <fieldset aria-describedby={errors.relationship ? "place-relationship-error" : undefined}>
          <legend className="text-sm font-medium text-foreground">How are you connected to it?</legend>
          <div className="mt-3 grid gap-3">
            {RELATIONSHIPS.map((value) => (
              <label
                key={value}
                className={cn(
                  optionCardClass,
                  relationship === value ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
                )}
              >
                <input
                  type="radio"
                  value={value}
                  className="mt-1 size-4 accent-[var(--primary)]"
                  {...register("relationship")}
                />
                <span>
                  <span className="block font-medium text-foreground">{RELATIONSHIP_LABELS[value]}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{RELATIONSHIP_BLURB[value]}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Owners and their families are welcome to list a place, as long as they say so here. Voters and visitors
            see that disclosure on the page.
          </p>
          <FieldError id="place-relationship-error" message={errors.relationship?.message} />
        </fieldset>
      </Section>

      <div className="space-y-6 rounded-[var(--radius-lg)] border border-border bg-surface p-5 sm:p-8">
        <div>
          <div className="flex gap-3 rounded-[var(--radius)] bg-surface-sunken p-4">
            <input
              id="place-agree"
              type="checkbox"
              aria-invalid={Boolean(errors.agree)}
              aria-describedby={errors.agree ? "place-agree-error" : undefined}
              className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
              {...register("agree")}
            />
            <Label htmlFor="place-agree" className="text-sm font-normal leading-relaxed">
              The details above are accurate to the best of my knowledge, and I have the right to share these
              photos under the licence I chose. I understand the place is shown to verified members for voting
              before it can be published.{" "}
              <IntentLink href="/community#how-verification-works" className="text-primary underline underline-offset-4">
                How verification works
              </IntentLink>
            </Label>
          </div>
          <FieldError id="place-agree-error" message={errors.agree?.message} />
        </div>

        {formError && (
          <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="rounded-[var(--radius)] border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {formError}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={busy || uploading}
            aria-describedby={uploading ? "place-submit-note" : undefined}
          >
            {busy ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                {done ? "Opening your place" : "Listing the place"}
              </>
            ) : (
              <>
                <Send aria-hidden="true" />
                List this place
              </>
            )}
          </Button>
          <p id="place-submit-note" aria-live="polite" className="text-sm text-muted-foreground">
            {uploading ? "Wait for the photos to finish uploading." : ""}
          </p>
        </div>
      </div>
    </form>
  );
}
