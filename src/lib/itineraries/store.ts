"use client";

/**
 * Saved itinerary persistence.
 *
 * Mock-backed today (localStorage, one key per user id), with the async
 * signatures ready for the database. Moving to `public.saved_itineraries`
 * means session-checked Server Actions, and nothing at the call sites
 * changes — exactly like `src/lib/booking/bookings.ts`.
 *
 * Reads and writes are wrapped so a blocked or full store never throws: the UI
 * simply renders the empty state.
 */

import { useSyncExternalStore } from "react";

import type { SavedItinerary, SavedItineraryDay } from "@/types";

import { readJSON, writeJSON } from "@/lib/auth/storage";

const KEY_PREFIX = "mt.itineraries.";
const KEY_SUFFIX = ".v1";

/** Stable identity so `useSyncExternalStore` never loops on an empty list. */
const EMPTY: SavedItinerary[] = [];

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

export type SaveItineraryInput = Omit<SavedItinerary, "id" | "createdAt"> & {
  id?: string;
  createdAt?: string;
};

export async function listItineraries(userId: string): Promise<SavedItinerary[]> {
  if (!userId) return [];
  return newest(readAll(userId));
}

export async function getItinerary(id: string): Promise<SavedItinerary | null> {
  if (!id) return null;
  for (const userId of knownUserIds()) {
    const found = readAll(userId).find((row) => row.id === id);
    if (found) return found;
  }
  return null;
}

export async function saveItinerary(input: SaveItineraryInput): Promise<SavedItinerary> {
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

  for (const userId of knownUserIds()) {
    const rows = readAll(userId);
    if (!rows.some((row) => row.id === id)) continue;
    const next = rows.map((row) => (row.id === id ? { ...row, title: clean } : row));
    writeAll(userId, next);
    return next.find((row) => row.id === id) ?? null;
  }
  return null;
}

export async function deleteItinerary(id: string): Promise<boolean> {
  if (!id) return false;
  for (const userId of knownUserIds()) {
    const rows = readAll(userId);
    if (!rows.some((row) => row.id === id)) continue;
    writeAll(
      userId,
      rows.filter((row) => row.id !== id),
    );
    return true;
  }
  return false;
}

/** Reactive read of the signed-in traveller's saved plans, newest first. */
export function useSavedItineraries(userId: string | undefined): SavedItinerary[] {
  const rows = useSyncExternalStore(
    subscribeToItineraries,
    () => (userId ? readAll(userId) : EMPTY),
    () => EMPTY,
  );
  return rows === EMPTY ? EMPTY : newest(rows);
}
