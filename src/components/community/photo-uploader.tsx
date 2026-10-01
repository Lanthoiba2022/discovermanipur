"use client";

import { ArrowDown, ArrowUp, ImagePlus, Loader2, RotateCcw, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { discardUpload } from "@/lib/community/actions";
import { LIMITS } from "@/lib/community/rules";
import { MAX_PHOTO_UPLOAD_BYTES, PLACE_LIMITS, photoMetaSchema } from "@/lib/community/schema";
import { LICENCES, LICENCE_LABELS, type PhotoLicence } from "@/lib/community/taxonomy";
import type { CommunityPhoto } from "@/lib/community/types";
import { cn } from "@/lib/utils";

/**
 * Photos for a place being listed. Each file is downscaled and re-encoded as
 * JPEG in the browser first, which keeps it under the server's 4 MB limit and
 * turns HEIC into something the server can read wherever the browser can
 * decode it. The server decodes and re-encodes again and strips metadata, so
 * this step is about size, not trust.
 */

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";
const ACCEPTED_TYPES = new Set(ACCEPT.split(","));
const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif)$/i;

const MAX_EDGE = 2048;
/** Below the server limit, leaving room for the form fields sent alongside. */
const TARGET_BYTES = Math.floor(MAX_PHOTO_UPLOAD_BYTES * 0.95);
const QUALITIES = [0.86, 0.78, 0.7, 0.6, 0.5];
const CONCURRENCY = 2;

const OPEN_LICENCES = LICENCES.filter((l) => l !== "own-work") as Exclude<PhotoLicence, "own-work">[];

const CANNOT_READ = "This browser cannot read that file. Use a JPEG or PNG.";
const UPLOAD_FAILED = "The photo could not be uploaded. Try again in a moment.";

type ItemStatus = "waiting" | "preparing" | "uploading" | "done" | "failed";

interface PhotoMeta {
  licence: PhotoLicence;
  author: string;
  sourceUrl: string;
}

interface Item {
  key: string;
  file: File;
  meta: PhotoMeta;
  status: ItemStatus;
  /** The re-encoded JPEG, kept so a retry does not prepare it again. */
  blob?: Blob;
  /** Object URL of `blob`, shown until the server's thumbnail is ready. */
  previewUrl?: string;
  photo?: CommunityPhoto;
  /** Optional description of what the photo shows, for screen readers. */
  alt: string;
  error?: string;
  removing?: boolean;
}

export interface PhotoUploaderState {
  /** Uploaded photo ids, in the order the person arranged them. */
  photoIds: string[];
  /** Descriptions the person wrote, keyed by photo id. Photos left blank are absent. */
  photoAlts: Record<string, string>;
  /** True while any photo is still being prepared or uploaded. */
  uploading: boolean;
}

interface PhotoUploaderProps {
  /** Default author for photos the person took themselves. */
  defaultAuthor: string;
  /** False when this deployment has nowhere to store photos. */
  enabled: boolean;
  onChange: (state: PhotoUploaderState) => void;
  /** An error for the photos as a whole, from the form or the server. */
  error?: string;
  /** Id for `error`'s element, so the form can link to it. */
  errorId?: string;
  disabled?: boolean;
}

/* ------------------------------ image helpers ------------------------------ */

interface Decoded {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

function loadImage(file: File): Promise<Decoded> {
  const url = URL.createObjectURL(file);
  const img = new window.Image();
  img.decoding = "async";
  img.src = url;
  return img.decode().then(
    () => ({
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    }),
    (err: unknown) => {
      URL.revokeObjectURL(url);
      throw err;
    },
  );
}

async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // Some browsers decode a format through <img> but not createImageBitmap.
    }
  }
  return loadImage(file);
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

class PrepareError extends Error {}

/** Downscale to `MAX_EDGE` on the long side and re-encode as JPEG under `TARGET_BYTES`. */
async function prepare(file: File): Promise<Blob> {
  let decoded: Decoded;
  try {
    decoded = await decode(file);
  } catch {
    throw new PrepareError(CANNOT_READ);
  }

  const canvas = document.createElement("canvas");
  try {
    if (!decoded.width || !decoded.height) throw new PrepareError(CANNOT_READ);
    const scale = Math.min(1, MAX_EDGE / Math.max(decoded.width, decoded.height));
    canvas.width = Math.max(1, Math.round(decoded.width * scale));
    canvas.height = Math.max(1, Math.round(decoded.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new PrepareError(CANNOT_READ);
    // JPEG has no transparency: put see-through PNG areas on white, not black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);

    for (const quality of QUALITIES) {
      const blob = await toBlob(canvas, quality);
      if (!blob) throw new PrepareError(CANNOT_READ);
      if (blob.size <= TARGET_BYTES) return blob;
    }
    throw new PrepareError("This photo is too large to upload, even after resizing. Try a smaller one.");
  } finally {
    decoded.release();
    // Free the canvas memory straight away rather than waiting for collection.
    canvas.width = 0;
    canvas.height = 0;
  }
}

function isAccepted(file: File) {
  return ACCEPTED_TYPES.has(file.type) || ACCEPTED_EXTENSIONS.test(file.name);
}

function jpegName(name: string) {
  const base = name.replace(/\.[^.]+$/, "") || "photo";
  return `${base}.jpg`;
}

const isBusy = (status: ItemStatus) => status === "waiting" || status === "preparing" || status === "uploading";

/** Space-separated ids for aria-describedby, skipping the empty ones. */
function describedBy(...ids: (string | false | undefined)[]) {
  return ids.filter(Boolean).join(" ") || undefined;
}

/* -------------------------------- component -------------------------------- */

export function PhotoUploader({
  defaultAuthor,
  enabled,
  onChange,
  error,
  errorId,
  disabled = false,
}: PhotoUploaderProps) {
  const uid = useId();
  const ids = {
    choice: `${uid}-choice`,
    author: `${uid}-author`,
    authorError: `${uid}-author-error`,
    licence: `${uid}-licence`,
    licenceError: `${uid}-licence-error`,
    source: `${uid}-source`,
    sourceHelp: `${uid}-source-help`,
    sourceError: `${uid}-source-error`,
    pickerHelp: `${uid}-picker-help`,
  };

  const [ownWork, setOwnWork] = useState(true);
  const [author, setAuthor] = useState(defaultAuthor);
  const [licence, setLicence] = useState<Exclude<PhotoLicence, "own-work">>(OPEN_LICENCES[0]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [metaErrors, setMetaErrors] = useState<Partial<Record<"author" | "licence" | "sourceUrl", string>>>({});

  const [items, setItems] = useState<Item[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [dragging, setDragging] = useState(false);

  // The queue runs outside render, so it reads and writes the list through a
  // ref and publishes each change to state.
  const itemsRef = useRef<Item[]>([]);
  const activeRef = useRef(0);
  const controllers = useRef(new Map<string, AbortController>());
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLButtonElement>(null);
  const authorRef = useRef<HTMLInputElement>(null);
  const sourceRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const keyCounter = useRef(0);
  const unmountedRef = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const live = controllers.current;
    unmountedRef.current = false;
    return () => {
      // Stops `process` from starting anything new once the form has gone.
      unmountedRef.current = true;
      for (const controller of live.values()) controller.abort();
      for (const item of itemsRef.current) if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    };
  }, []);

  function commit(next: Item[]) {
    itemsRef.current = next;
    setItems(next);
    onChangeRef.current({
      // A photo being removed leaves the submission at once, so a submit
      // racing the removal can never attach it.
      photoIds: next.flatMap((item) =>
        item.status === "done" && item.photo && !item.removing ? [item.photo.id] : [],
      ),
      photoAlts: Object.fromEntries(
        next.flatMap((item) =>
          item.status === "done" && item.photo && !item.removing && item.alt.trim()
            ? [[item.photo.id, item.alt.trim()]]
            : [],
        ),
      ),
      uploading: next.some((item) => isBusy(item.status) || Boolean(item.removing)),
    });
  }

  function update(key: string, patch: Partial<Item>) {
    commit(itemsRef.current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  const find = (key: string) => itemsRef.current.find((item) => item.key === key);

  async function process(key: string) {
    const start = find(key);
    if (!start) return;

    let blob = start.blob;
    if (!blob) {
      update(key, { status: "preparing", error: undefined });
      try {
        blob = await prepare(start.file);
      } catch (err) {
        if (unmountedRef.current || !find(key)) return;
        update(key, {
          status: "failed",
          error: err instanceof PrepareError ? err.message : CANNOT_READ,
        });
        setAnnouncement(`${start.file.name} could not be prepared.`);
        return;
      }
      if (unmountedRef.current || !find(key)) return;
      update(key, { blob, previewUrl: URL.createObjectURL(blob) });
    }

    if (unmountedRef.current) return;
    update(key, { status: "uploading", error: undefined });
    const body = new FormData();
    body.append("file", new File([blob], jpegName(start.file.name), { type: "image/jpeg" }));
    body.append("licence", start.meta.licence);
    body.append("author", start.meta.author);
    body.append("sourceUrl", start.meta.sourceUrl);
    body.append("alt", "");

    const controller = new AbortController();
    controllers.current.set(key, controller);
    try {
      const response = await fetch("/api/community/photos", {
        method: "POST",
        body,
        signal: controller.signal,
      });
      const json = (await response.json().catch(() => null)) as { photo?: CommunityPhoto; error?: string } | null;
      if (!find(key)) return;
      if (!response.ok || !json?.photo) {
        update(key, { status: "failed", error: json?.error || UPLOAD_FAILED });
        setAnnouncement(`${start.file.name} could not be uploaded. ${json?.error || UPLOAD_FAILED}`);
        return;
      }
      const current = find(key);
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      update(key, { status: "done", photo: json.photo, previewUrl: undefined, blob: undefined });
      const remaining = itemsRef.current.filter((item) => isBusy(item.status)).length;
      setAnnouncement(
        remaining > 0
          ? `${start.file.name} uploaded. ${remaining} still to go.`
          : `${start.file.name} uploaded. All photos are uploaded.`,
      );
    } catch {
      if (controller.signal.aborted || !find(key)) return;
      update(key, { status: "failed", error: UPLOAD_FAILED });
      setAnnouncement(`${start.file.name} could not be uploaded.`);
    } finally {
      controllers.current.delete(key);
    }
  }

  function pump() {
    while (activeRef.current < CONCURRENCY) {
      const next = itemsRef.current.find((item) => item.status === "waiting");
      if (!next) return;
      activeRef.current += 1;
      // Claim it now so the next loop iteration does not start it twice.
      update(next.key, { status: next.blob ? "uploading" : "preparing" });
      void process(next.key).finally(() => {
        activeRef.current -= 1;
        pump();
      });
    }
  }

  /** The licence fields, checked before any file is accepted. */
  function currentMeta(): PhotoMeta | null {
    const meta = {
      licence: ownWork ? ("own-work" as const) : licence,
      author: author.trim(),
      sourceUrl: ownWork ? "" : sourceUrl.trim(),
      alt: "",
    };
    const parsed = photoMetaSchema.safeParse(meta);
    if (parsed.success) {
      setMetaErrors({});
      return { licence: meta.licence, author: meta.author, sourceUrl: meta.sourceUrl };
    }
    const next: Partial<Record<"author" | "licence" | "sourceUrl", string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if ((field === "author" || field === "licence" || field === "sourceUrl") && !next[field]) {
        next[field] = issue.message;
      }
    }
    setMetaErrors(next);
    if (next.author) authorRef.current?.focus();
    else if (next.sourceUrl) sourceRef.current?.focus();
    setAnnouncement("Check the photo details before adding photos.");
    return null;
  }

  function addFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (files.length === 0) return;
    const meta = currentMeta();
    if (!meta) return;

    const accepted = files.filter(isAccepted);
    const rejected = files.length - accepted.length;
    const room = LIMITS.photosPerPlace - itemsRef.current.length;
    const taken = accepted.slice(0, Math.max(0, room));

    const notes: string[] = [];
    if (rejected > 0) {
      notes.push(
        rejected === 1
          ? "One file was not a photo we can take. Use JPEG, PNG or WebP."
          : `${rejected} files were not photos we can take. Use JPEG, PNG or WebP.`,
      );
    }
    if (accepted.length > taken.length) {
      notes.push(`A place can have up to ${LIMITS.photosPerPlace} photos, so only ${taken.length} more could be added.`);
    }
    if (notes.length > 0) toast.error(notes.join(" "));

    if (taken.length > 0) {
      const added: Item[] = taken.map((file) => {
        keyCounter.current += 1;
        return { key: `photo-${keyCounter.current}`, file, meta, status: "waiting", alt: "" };
      });
      commit([...itemsRef.current, ...added]);
      setAnnouncement(
        `${taken.length === 1 ? "1 photo" : `${taken.length} photos`} added. Preparing and uploading.${
          notes.length > 0 ? ` ${notes.join(" ")}` : ""
        }`,
      );
      pump();
    } else if (notes.length > 0) {
      setAnnouncement(notes.join(" "));
    }
  }

  function openPicker() {
    if (!currentMeta()) return;
    inputRef.current?.click();
  }

  function retry(key: string) {
    const item = find(key);
    if (!item) return;
    update(key, { status: "waiting", error: undefined });
    setAnnouncement(`Trying ${item.file.name} again.`);
    pump();
  }

  async function remove(key: string) {
    const item = find(key);
    if (!item) return;
    const label = item.file.name;

    if (item.status === "done" && item.photo) {
      update(key, { removing: true });
      const result = await discardUpload(item.photo.id).catch(() => null);
      // An upload not attached to a place is discarded after a day anyway, so
      // it leaves the form even when the server could not delete it now.
      if (!result?.ok) toast.message("Removed from this place", { description: label });
    } else {
      controllers.current.get(key)?.abort();
    }

    const current = find(key);
    if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
    commit(itemsRef.current.filter((i) => i.key !== key));
    setAnnouncement(`${label} removed.`);
    pickerRef.current?.focus();
  }

  function move(key: string, by: -1 | 1) {
    const list = [...itemsRef.current];
    const from = list.findIndex((item) => item.key === key);
    const to = from + by;
    if (from < 0 || to < 0 || to >= list.length) return;
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    commit(list);
    setAnnouncement(`${item.file.name} moved to position ${to + 1} of ${list.length}.`);

    // Keep focus on the control that was used, or its partner at either end.
    const atEdge = to === 0 || to === list.length - 1;
    const same = `${uid}-${key}-${by < 0 ? "earlier" : "later"}`;
    const other = `${uid}-${key}-${by < 0 ? "later" : "earlier"}`;
    requestAnimationFrame(() => {
      document.getElementById(atEdge ? other : same)?.focus();
    });
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    addFiles(event.dataTransfer.files);
  }

  if (!enabled) {
    return (
      <p className="rounded-[var(--radius)] bg-surface-sunken p-4 text-sm text-muted-foreground">
        Photo uploads are not available on this site right now. You can still list the place without photos.
      </p>
    );
  }

  const full = items.length >= LIMITS.photosPerPlace;
  const doneCount = items.filter((item) => item.status === "done").length;

  return (
    <div className="space-y-6">
      <fieldset className="space-y-4" disabled={disabled}>
        <legend className="text-sm font-medium text-foreground">Who took the photos you are adding?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { own: true, title: "I took these photos", body: "You keep the copyright and let the site show them here." },
            {
              own: false,
              title: "Someone else's, with an open licence",
              body: "Only CC BY, CC BY-SA or CC0 photos, with a link to where the licence is shown.",
            },
          ].map((option) => (
            <label
              key={String(option.own)}
              className={cn(
                "flex cursor-pointer gap-3 rounded-[var(--radius)] border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                ownWork === option.own ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name={ids.choice}
                checked={ownWork === option.own}
                onChange={() => {
                  setOwnWork(option.own);
                  setMetaErrors({});
                }}
                className="mt-1 size-4 accent-[var(--primary)]"
              />
              <span>
                <span className="block font-medium text-foreground">{option.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{option.body}</span>
              </span>
            </label>
          ))}
        </div>

        <div className={cn("grid gap-4", !ownWork && "sm:grid-cols-2")}>
          {!ownWork && (
            <div>
              <Label htmlFor={ids.licence}>Licence</Label>
              <select
                id={ids.licence}
                value={licence}
                onChange={(e) => setLicence(e.target.value as Exclude<PhotoLicence, "own-work">)}
                aria-invalid={Boolean(metaErrors.licence)}
                aria-describedby={metaErrors.licence ? ids.licenceError : undefined}
                className="mt-1.5 h-11 w-full rounded-[var(--radius)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
              >
                {OPEN_LICENCES.map((value) => (
                  <option key={value} value={value}>
                    {LICENCE_LABELS[value]}
                  </option>
                ))}
              </select>
              {metaErrors.licence && (
                <p id={ids.licenceError} role="alert" className="mt-1.5 text-sm text-destructive">
                  {metaErrors.licence}
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor={ids.author}>{ownWork ? "Your name, as the photographer" : "Photographer"}</Label>
            <Input
              id={ids.author}
              ref={authorRef}
              value={author}
              maxLength={PLACE_LIMITS.authorMax}
              autoComplete={ownWork ? "name" : "off"}
              onChange={(e) => setAuthor(e.target.value)}
              aria-invalid={Boolean(metaErrors.author)}
              aria-describedby={metaErrors.author ? ids.authorError : undefined}
              className={cn("mt-1.5", metaErrors.author && "border-destructive")}
            />
            {metaErrors.author && (
              <p id={ids.authorError} role="alert" className="mt-1.5 text-sm text-destructive">
                {metaErrors.author}
              </p>
            )}
          </div>
        </div>

        {!ownWork && (
          <div>
            <Label htmlFor={ids.source}>Where the photo and its licence are shown</Label>
            <Input
              id={ids.source}
              ref={sourceRef}
              type="url"
              inputMode="url"
              placeholder="https://commons.wikimedia.org/wiki/File:..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              aria-invalid={Boolean(metaErrors.sourceUrl)}
              aria-describedby={describedBy(ids.sourceHelp, metaErrors.sourceUrl && ids.sourceError)}
              className={cn("mt-1.5", metaErrors.sourceUrl && "border-destructive")}
            />
            <p id={ids.sourceHelp} className="mt-1.5 text-xs text-muted-foreground">
              A full https:// link to the page that names the licence, such as the file page on Wikimedia Commons.
            </p>
            {metaErrors.sourceUrl && (
              <p id={ids.sourceError} role="alert" className="mt-1.5 text-sm text-destructive">
                {metaErrors.sourceUrl}
              </p>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          These details apply to the photos you add next. To credit photos differently, change them and add those
          photos separately.
        </p>
      </fieldset>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border-strong bg-surface-sunken",
        )}
      >
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ImagePlus className="size-5" aria-hidden="true" />
        </span>
        <Button
          ref={pickerRef}
          type="button"
          variant="outline"
          onClick={openPicker}
          disabled={disabled || full}
          aria-describedby={describedBy(ids.pickerHelp, error && errorId)}
        >
          Choose photos
        </Button>
        <p id={ids.pickerHelp} className="mt-3 max-w-md text-sm text-muted-foreground">
          {full
            ? `You have added the most photos a place can have (${LIMITS.photosPerPlace}). Remove one to add another.`
            : `Or drag them here. Up to ${LIMITS.photosPerPlace} photos in JPEG, PNG or WebP (HEIC works in browsers that can open it, such as Safari). They are resized before upload, and location data is removed on our side.`}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {items.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground">
            {doneCount} of {items.length} {items.length === 1 ? "photo" : "photos"} uploaded. The first one is the
            cover.
          </p>
          <ol className="mt-3 space-y-3">
            {items.map((item, index) => (
              <PhotoRow
                key={item.key}
                item={item}
                index={index}
                total={items.length}
                idPrefix={`${uid}-${item.key}`}
                disabled={disabled}
                onRetry={() => retry(item.key)}
                onRemove={() => void remove(item.key)}
                onMove={(by) => move(item.key, by)}
                onAltChange={(alt) => update(item.key, { alt })}
              />
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

const STATUS_TEXT: Record<ItemStatus, string> = {
  waiting: "Waiting to upload",
  preparing: "Preparing",
  uploading: "Uploading",
  done: "Uploaded",
  failed: "Not uploaded",
};

function PhotoRow({
  item,
  index,
  total,
  idPrefix,
  disabled,
  onRetry,
  onRemove,
  onMove,
  onAltChange,
}: {
  item: Item;
  index: number;
  total: number;
  idPrefix: string;
  disabled: boolean;
  onRetry: () => void;
  onRemove: () => void;
  onMove: (by: -1 | 1) => void;
  onAltChange: (alt: string) => void;
}) {
  const busy = isBusy(item.status);
  const name = item.file.name;
  const locked = disabled || Boolean(item.removing);

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-muted">
        {item.photo ? (
          <Image
            src={item.photo.thumbSrc}
            alt=""
            width={item.photo.width}
            height={item.photo.height}
            unoptimized
            className="size-full object-cover"
          />
        ) : item.previewUrl ? (
          // A local blob URL: next/image has nothing to optimise here.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.previewUrl} alt="" className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-5 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          <span className="sr-only">Photo {index + 1} of {total}: </span>
          {name}
          {index === 0 && item.status === "done" && (
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Cover</span>
          )}
        </p>
        <p
          className={cn(
            "mt-1 flex items-center gap-1.5 text-sm",
            item.status === "failed" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {busy && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
          {item.status === "done" && item.photo ? item.photo.credit : STATUS_TEXT[item.status]}
          {item.status === "failed" && item.error ? `: ${item.error}` : null}
        </p>
        {item.status === "done" && (
          <div className="mt-2">
            <Label htmlFor={`${idPrefix}-alt`} className="text-xs text-muted-foreground">
              Describe this photo (optional, read aloud by screen readers)
            </Label>
            <Input
              id={`${idPrefix}-alt`}
              value={item.alt}
              onChange={(e) => onAltChange(e.target.value)}
              maxLength={PLACE_LIMITS.altMax}
              disabled={locked}
              placeholder="e.g. The lake at sunrise from the viewpoint"
              className="mt-1 h-9 text-sm"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {item.status === "failed" && (
          <Button type="button" variant="ghost" size="sm" onClick={onRetry} disabled={locked}>
            <RotateCcw aria-hidden="true" />
            Retry<span className="sr-only"> {name}</span>
          </Button>
        )}
        <Button
          id={`${idPrefix}-earlier`}
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onMove(-1)}
          disabled={locked || index === 0}
          aria-label={`Move ${name} earlier`}
        >
          <ArrowUp aria-hidden="true" />
        </Button>
        <Button
          id={`${idPrefix}-later`}
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onMove(1)}
          disabled={locked || index === total - 1}
          aria-label={`Move ${name} later`}
        >
          <ArrowDown aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={locked}
          aria-label={`Remove ${name}`}
          className="hover:text-destructive"
        >
          {item.removing ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
        </Button>
      </div>
    </li>
  );
}
