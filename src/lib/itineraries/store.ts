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
 * are copied into the account and the browser copy is cleared.
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

import { MAX_ITINERARY_IMPORT, type ItineraryListResult } from "./schema";

const KEY_PREFIX = "mt.itineraries.";
const KEY_SUFFIX = ".v1";

/** Stable identity so `useSyncExternalStore` never loops on an empty list. */
const EMPTY: SavedItinerary[] = [];

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
    // Storage blocked — fall back to whatever this session already cached.
  }
  return [...ids];
}

function newest(rows: SavedItinerary[]): SavedItinerary[] {
  return [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ------------------------------ Account mode ------------------------------ */

/** Status and rows per user id, as the browser knows that user. */
const storageOf = new Map<string, ItineraryStorage>();
const accountRows = new Map<string, SavedItinerary[]>();
const loads = new Map<string, Promise<ItineraryStorage>>();

function setAccount(userId: string, rows: SavedItinerary[]) {
  accountRows.set(userId, rows.length > 0 ? newest(rows) : EMPTY);
  emit();
}

function updateAccount(userId: string, change: (rows: SavedItinerary[]) => SavedItinerary[]) {
  setAccount(userId, change(accountRows.get(userId) ?? EMPTY));
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

async function migrateLocal(userId: string) {
  const local = readAll(userId);
  if (local.length === 0) return;
  try {
    let rows: SavedItinerary[] | null = null;
    for (const batch of importBatches(local)) {
      const result = await importMyItineraries(batch);
      if (!("storage" in result) || result.storage !== "account") return;
      rows = result.rows;
    }
    // Only once every batch is in: a retry re-sends the same ids, which the
    // server skips, so a half-finished copy never duplicates plans.
    removeKey(keyFor(userId));
    cache.delete(userId);
    if (rows) setAccount(userId, rows);
  } catch {
    // Best effort: the browser copy stays and is offered again next load.
  }
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
    if ("storage" in result && result.storage === "account") setAccount(userId, result.rows);
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

export async function listItineraries(userId: string): Promise<SavedItinerary[]> {
  if (!userId) return [];
  const where = await resolve(userId);
  if (where === "browser") return newest(readAll(userId));
  if (where !== "account") throw new Error("We could not load your saved plans.");
  return accountRows.get(userId) ?? EMPTY;
}

export async function getItinerary(id: string): Promise<SavedItinerary | null> {
  if (!id) return null;
  const userId = currentUserId();
  if ((await resolve(userId)) === "account") {
    return (accountRows.get(userId) ?? EMPTY).find((row) => row.id === id) ?? (await getMyItinerary(id));
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
    updateAccount(userId, (rows) => [row, ...rows.filter((existing) => existing.id !== row.id)]);
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
    updateAccount(userId, (rows) => rows.map((existing) => (existing.id === id ? row : existing)));
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

/** Reactive read of the signed-in traveller's saved plans, newest first. */
export function useSavedItineraries(userId: string | undefined): SavedItinerary[] {
  useEffect(() => {
    if (!userId) return;
    if (storageOf.get(userId) === "account") void refresh(userId);
    else void resolve(userId);
  }, [userId]);

  const rows = useSyncExternalStore(
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
