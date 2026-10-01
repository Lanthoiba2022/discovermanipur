"use client";

/**
 * Saved list (wishlist). Persisted in localStorage for now; the same surface
 * is what a `saved_items` table would sit behind.
 */

import { useCallback, useSyncExternalStore } from "react";

import { readJSON, writeJSON } from "@/lib/auth/storage";

const WISHLIST_KEY = "mt.saved.v1";

export type SavedKind = "homestay" | "hotspot" | "experience";

export interface SavedItem {
  kind: SavedKind;
  slug: string;
  title: string;
  subtitle?: string;
  image?: string;
  href: string;
  savedAt: string;
}

const EMPTY: SavedItem[] = [];

let cache: SavedItem[] | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function read(): SavedItem[] {
  if (cache) return cache;
  cache = readJSON<SavedItem[]>(WISHLIST_KEY, EMPTY);
  return cache;
}

function write(rows: SavedItem[]) {
  cache = rows;
  writeJSON(WISHLIST_KEY, rows);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): SavedItem[] {
  return read();
}

function getServerSnapshot(): SavedItem[] {
  return EMPTY;
}

export function keyOf(item: { kind: SavedKind; slug: string }) {
  return `${item.kind}:${item.slug}`;
}

export function toggleSaved(item: Omit<SavedItem, "savedAt">) {
  const rows = read();
  const exists = rows.some((r) => keyOf(r) === keyOf(item));
  write(
    exists
      ? rows.filter((r) => keyOf(r) !== keyOf(item))
      : [{ ...item, savedAt: new Date().toISOString() }, ...rows],
  );
  return !exists;
}

export function removeSaved(item: { kind: SavedKind; slug: string }) {
  write(read().filter((r) => keyOf(r) !== keyOf(item)));
}

export function clearSaved() {
  write([]);
}

export function useSavedItems(): SavedItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsSaved(item: { kind: SavedKind; slug: string }) {
  const rows = useSavedItems();
  const k = keyOf(item);
  return rows.some((r) => keyOf(r) === k);
}

export function useToggleSaved() {
  return useCallback((item: Omit<SavedItem, "savedAt">) => toggleSaved(item), []);
}
