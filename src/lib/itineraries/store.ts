"use client";

/**
 * Saved itinerary persistence.
 *
 * With Neon Auth and a database, plans live in `public.saved_itineraries`
 * behind the session-checked Server Actions in
 * `@/app/account/itineraries/actions`, so they follow the account to any
 * device. Without a database, or on the local-development session, they stay
 * in localStorage (one key per user id). The call sites are the same either
 * way. On the first account load, plans this browser kept for the same user
 * are copied into the account, and the browser keeps only the ones the
 * account could not take (over the plan cap or the byte budget, or invalid).
 *
 * The account list holds summaries (`SavedItinerarySummary`: title, dates,
 * day and stop counts, no `days` or `notes`), so mounting a list or a Save
 * button no longer pulls every plan in full. `getItinerary(id)` loads one
 * full plan on demand and keeps it for the rest of the page's life. Browser
 * mode keeps full rows, as before: they are already local.
 *
 * Local reads and writes are wrapped so a blocked or full store never throws:
 * the UI simply renders the empty state.
 */

import { useEffect, useSyncExternalStore } from "react";

import type { SavedItinerary, SavedItineraryDay } from "@/types";

import {
  deleteMyItinerary,
  getMyItinerary,
  importMyItineraries,
  listMyItineraries,
  renameMyItinerary,
  saveMyItinerary,
} from "@/app/account/itineraries/actions";
import { isAuthConfigured } from "@/lib/auth/env";
import { getSnapshot as getAuthSnapshot } from "@/lib/auth/session-store";
import { readJSON, removeKey, writeJSON } from "@/lib/auth/storage";

import {
  MAX_ITINERARY_IMPORT,
  summarizeItinerary,
  type ItineraryListResult,
  type SavedItineraryListItem,
  type SavedItinerarySummary,
} from "./schema";

const KEY_PREFIX = "mt.itineraries.";
const KEY_SUFFIX = ".v1";

/**
 * Stable identity so `useSyncExternalStore` never loops on an empty list.
 * `never[]` so the one constant can stand in for a list of any row shape.
 */
const EMPTY: never[] = [];

/**
 * Where a user's plans live. `pending` until the account list has loaded;
 * `error` when it could not be read.
 */
export type ItineraryStorage = "pending" | "browser" | "account" | "error";

function keyFor(userId: string) {
  return `${KEY_PREFIX}${userId}${KEY_SUFFIX}`;
}

const cache = new Map<string, SavedItinerary[]>();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeToItineraries(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function isDay(value: unknown): value is SavedItineraryDay {
  if (typeof value !== "object" || value === null) return false;
  const day = value as Record<string, unknown>;
  return typeof day.day === "number" && typeof day.title === "string" && Array.isArray(day.stops);
}

function isRow(value: unknown): value is SavedItinerary {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.userId === "string" &&
    typeof row.title === "string" &&
    Array.isArray(row.days) &&
    row.days.every(isDay)
  );
}

function readAll(userId: string): SavedItinerary[] {
  if (!userId) return EMPTY;
  const cached = cache.get(userId);
  if (cached) return cached;

  const raw = readJSON<unknown>(keyFor(userId), EMPTY);
  const rows = Array.isArray(raw) ? raw.filter(isRow) : [];
  const next = rows.length > 0 ? rows : EMPTY;
  cache.set(userId, next);
  return next;
}

function writeAll(userId: string, rows: SavedItinerary[]) {
  cache.set(userId, rows.length > 0 ? rows : EMPTY);
  writeJSON(keyFor(userId), rows);
  emit();
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `it-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

/** Every user id that currently has itineraries in this browser. */
function knownUserIds(): string[] {
  const ids = new Set(cache.keys());
  if (typeof window === "undefined") return [...ids];
  try {
    const storage = window.localStorage;
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (!key || !key.startsWith(KEY_PREFIX) || !key.endsWith(KEY_SUFFIX)) continue;
      ids.add(key.slice(KEY_PREFIX.length, key.length - KEY_SUFFIX.length));
    }
  } catch {
    // Storage blocked: fall back to whatever this session already cached.
  }
  return [...ids];
}

function newest<T extends { createdAt: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ------------------------------ Account mode ------------------------------ */

/** Status and list (summaries) per user id, as the browser knows that user. */
const storageOf = new Map<string, ItineraryStorage>();
const accountRows = new Map<string, SavedItinerarySummary[]>();
const loads = new Map<string, Promise<ItineraryStorage>>();

/**
 * Full account plans already fetched in this page, by plan id: the ones
 * opened or copied (`getItinerary`) and the ones a save or rename returned.
 */
const fullRows = new Map<string, SavedItinerary>();

function setAccount(userId: string, rows: SavedItinerarySummary[]) {
  accountRows.set(userId, rows.length > 0 ? newest(rows) : EMPTY);
  emit();
}

function updateAccount(
  userId: string,
  change: (rows: SavedItinerarySummary[]) => SavedItinerarySummary[],
) {
  setAccount(userId, change(accountRows.get(userId) ?? EMPTY));
}

/** Keep a full plan the server just returned, and its summary in the list. */
function rememberFull(userId: string, row: SavedItinerary) {
  fullRows.set(row.id, row);
  const summary = summarizeItinerary(row);
  updateAccount(userId, (rows) => [summary, ...rows.filter((existing) => existing.id !== row.id)]);
}

/**
 * Drop the cached full plans of `userId`, after a fresh list from the server:
 * a plan may have been edited on another device since it was fetched.
 */
function forgetFull(userId: string) {
  for (const [id, row] of fullRows) if (row.userId === userId) fullRows.delete(id);
}

/** Keeps each import request well under the 1 MB Server Action body limit. */
const IMPORT_BATCH_CHARS = 600_000;

function importBatches(rows: SavedItinerary[]) {
  const batches: unknown[][] = [];
  let batch: unknown[] = [];
  let size = 0;
  for (const { id, createdAt, title, days, travelMonth, estimatedCostInr, notes } of rows) {
    const entry = { id, createdAt, title, days, travelMonth, estimatedCostInr, notes };
    const length = JSON.stringify(entry).length;
    if (batch.length > 0 && (size + length > IMPORT_BATCH_CHARS || batch.length >= MAX_ITINERARY_IMPORT)) {
      batches.push(batch);
      batch = [];
      size = 0;
    }
    batch.push(entry);
    size += length;
  }
  if (batch.length > 0) batches.push(batch);
  return batches;
}

/**
 * Copy this browser's plans for `userId` into the account, then remove from
 * the browser exactly the ones the server reports as imported (by the browser
 * id it was sent). Whatever the account refused stays in localStorage and is
 * offered again on the next account load, when deleting a plan may have made
 * room: the server stops silently at the plan cap and the byte budget, so
 * clearing the whole key on success used to erase the refused plans.
 *
 * A batch that fails, or a throw, still writes back what earlier batches
 * imported, so a plan whose browser id was not a UUID (and so got a new server
 * id) is not sent, and duplicated, a second time. Once the server says the
 * cap or budget refused something, the remaining batches are not sent.
 */
async function migrateLocal(userId: string) {
  if (readAll(userId).length === 0) return;
  const imported = new Set<string>();
  let rows: SavedItinerarySummary[] | null = null;
  try {
    for (const batch of importBatches(readAll(userId))) {
      const result = await importMyItineraries(batch);
      if (!("storage" in result)) break;
      for (const id of result.imported) imported.add(id);
      rows = result.rows;
      if (result.stopped) break;
    }
  } catch {
    // Best effort: whatever was not confirmed stays and is offered next load.
  }
  if (imported.size > 0) {
    // Read again rather than reuse the snapshot, in case this browser wrote
    // to the key while the import was in flight.
    const remaining = readAll(userId).filter((row) => !imported.has(row.id));
    if (remaining.length > 0) {
      writeAll(userId, remaining);
    } else {
      removeKey(keyFor(userId));
      cache.delete(userId);
    }
  }
  if (rows) setAccount(userId, rows);
}

async function load(userId: string): Promise<ItineraryStorage> {
  let result: ItineraryListResult;
  try {
    result = await listMyItineraries();
  } catch {
    result = { error: "unreachable" };
  }

  let next: ItineraryStorage;
  if ("error" in result) next = "error";
  else if (result.storage === "browser") next = "browser";
  else {
    next = "account";
    accountRows.set(userId, result.rows.length > 0 ? newest(result.rows) : EMPTY);
  }
  storageOf.set(userId, next);
  emit();

  if (next === "account") await migrateLocal(userId);
  else if (next === "error") loads.delete(userId);
  return next;
}

/**
 * Where `userId`'s plans live, loading the account list the first time.
 * Without Neon Auth there is no server session to check, so it is always the
 * browser.
 */
function resolve(userId: string): Promise<ItineraryStorage> {
  if (!isAuthConfigured || !userId) return Promise.resolve("browser");
  let pending = loads.get(userId);
  if (!pending) {
    pending = load(userId);
    loads.set(userId, pending);
  }
  return pending;
}

/**
 * Re-read an already loaded account list, so a plan saved on another device
 * shows up without a full page load.
 */
async function refresh(userId: string) {
  if (storageOf.get(userId) !== "account") return;
  try {
    const result = await listMyItineraries();
    if ("storage" in result && result.storage === "account") {
      forgetFull(userId);
      setAccount(userId, result.rows);
    }
  } catch {
    // Keep what is already on screen.
  }
}

function storageFor(userId: string | undefined): ItineraryStorage {
  if (!isAuthConfigured) return "browser";
  if (!userId) return "pending";
  return storageOf.get(userId) ?? "pending";
}

/** The signed-in user, for the calls whose signature carries only a plan id. */
function currentUserId(): string {
  return getAuthSnapshot().user?.id ?? "";
}

/**
 * Await a write action, throwing its user-facing message on failure. A
 * network failure gets a generic message instead of the browser's own.
 */
async function unwrap<T>(
  action: Promise<({ ok: true } & T) | { ok: false; error: string }>,
): Promise<T> {
  let result: ({ ok: true } & T) | { ok: false; error: string };
  try {
    result = await action;
  } catch {
    throw new Error("We could not reach the server. Check your connection and try again.");
  }
  if (!result.ok) throw new Error(result.error);
  return result;
}

/* --------------------------------- Public --------------------------------- */

export type SaveItineraryInput = Omit<SavedItinerary, "id" | "createdAt"> & {
  id?: string;
  createdAt?: string;
};

/**
 * The traveller's plans, newest first: full rows in browser mode, summaries in
 * account mode (open one with `getItinerary`).
 */
export async function listItineraries(userId: string): Promise<SavedItineraryListItem[]> {
  if (!userId) return [];
  const where = await resolve(userId);
  if (where === "browser") return newest(readAll(userId));
  if (where !== "account") throw new Error("We could not load your saved plans.");
  return accountRows.get(userId) ?? EMPTY;
}

/**
 * One full plan, `days` and `notes` included. In account mode it is fetched
 * once (`getMyItinerary`, a single row) and then served from memory; `null`
 * when it is not the traveller's, no longer exists, or the read was refused
 * (rate limit, signed out). A network failure throws.
 */
export async function getItinerary(id: string): Promise<SavedItinerary | null> {
  if (!id) return null;
  const userId = currentUserId();
  if ((await resolve(userId)) === "account") {
    const cached = fullRows.get(id);
    if (cached) return cached;
    const row = await getMyItinerary(id);
    if (row) fullRows.set(row.id, row);
    return row;
  }
  for (const known of knownUserIds()) {
    const found = readAll(known).find((row) => row.id === id);
    if (found) return found;
  }
  return null;
}

/**
 * Save a plan for `input.userId`. In account mode that id only picks the
 * client cache: the server stores the plan for the session's user, and
 * replaces an existing plan only when `input.id` is one of theirs.
 */
export async function saveItinerary(input: SaveItineraryInput): Promise<SavedItinerary> {
  const where = await resolve(input.userId);
  if (where === "account" || where === "error") {
    const { id, userId, title, days, travelMonth, estimatedCostInr, notes } = input;
    const { row } = await unwrap(
      saveMyItinerary({ title, days, travelMonth, estimatedCostInr, notes }, id),
    );
    // The save returns the full row; the list keeps its summary.
    rememberFull(userId, row);
    return row;
  }

  const row: SavedItinerary = {
    ...input,
    id: input.id ?? newId(),
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
  const rows = readAll(row.userId).filter((existing) => existing.id !== row.id);
  writeAll(row.userId, [row, ...rows]);
  return row;
}

export async function renameItinerary(id: string, title: string): Promise<SavedItinerary | null> {
  const clean = title.trim();
  if (!id || !clean) return null;

  const userId = currentUserId();
  if ((await resolve(userId)) === "account") {
    const { row } = await unwrap(renameMyItinerary(id, clean));
    fullRows.set(row.id, row);
    const summary = summarizeItinerary(row);
    updateAccount(userId, (rows) => rows.map((existing) => (existing.id === id ? summary : existing)));
    return row;
  }

  for (const known of knownUserIds()) {
    const rows = readAll(known);
    if (!rows.some((row) => row.id === id)) continue;
    const next = rows.map((row) => (row.id === id ? { ...row, title: clean } : row));
    writeAll(known, next);
    return next.find((row) => row.id === id) ?? null;
  }
  return null;
}

export async function deleteItinerary(id: string): Promise<boolean> {
  if (!id) return false;

  const userId = currentUserId();
  if ((await resolve(userId)) === "account") {
    await unwrap(deleteMyItinerary(id));
    fullRows.delete(id);
    updateAccount(userId, (rows) => rows.filter((row) => row.id !== id));
    return true;
  }

  for (const known of knownUserIds()) {
    const rows = readAll(known);
    if (!rows.some((row) => row.id === id)) continue;
    writeAll(
      known,
      rows.filter((row) => row.id !== id),
    );
    return true;
  }
  return false;
}

/**
 * Reactive read of the signed-in traveller's saved plans, newest first: full
 * rows in browser mode, summaries in account mode.
 */
export function useSavedItineraries(userId: string | undefined): SavedItineraryListItem[] {
  useEffect(() => {
    if (!userId) return;
    if (storageOf.get(userId) === "account") void refresh(userId);
    else void resolve(userId);
  }, [userId]);

  const rows = useSyncExternalStore<SavedItineraryListItem[]>(
    subscribeToItineraries,
    () => {
      if (!userId) return EMPTY;
      const where = storageFor(userId);
      if (where === "browser") return readAll(userId);
      if (where === "account") return accountRows.get(userId) ?? EMPTY;
      return EMPTY;
    },
    () => EMPTY,
  );
  return rows === EMPTY ? EMPTY : newest(rows);
}

/** Where the traveller's plans live right now, so pages can say so truthfully. */
export function useItineraryStorage(userId: string | undefined): ItineraryStorage {
  useEffect(() => {
    if (userId) void resolve(userId);
  }, [userId]);

  return useSyncExternalStore(
    subscribeToItineraries,
    () => storageFor(userId),
    () => "pending",
  );
}
