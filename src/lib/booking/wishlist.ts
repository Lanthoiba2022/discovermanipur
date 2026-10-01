"use client";

/**
 * Saved list (wishlist).
 *
 * Signed in on a deployment with a database, the list lives in
 * `public.saved_items` behind the Server Actions in `@/app/account/saved/actions`
 * and follows the account to any device. Otherwise — signed out, no database,
 * or the local-development session — it stays in this browser's localStorage.
 * On the first load in account mode, anything saved in this browser is copied
 * into the account and the browser copy is cleared.
 *
 * Toggles update the list at once and are confirmed by the server afterwards;
 * a failed write is rolled back with a toast.
 */

import { useCallback, useSyncExternalStore } from "react";
import { toast } from "sonner";

import {
  addSavedItem,
  clearSavedItems,
  importSavedItems,
  listSavedItems,
  removeSavedItem,
} from "@/app/account/saved/actions";
import {
  MAX_SAVED_IMPORT,
  type SavedItem,
  type SavedKind,
  type SavedListResult,
} from "@/app/account/saved/schema";
import { isAuthConfigured } from "@/lib/auth/env";
import {
  getSnapshot as getAuthSnapshot,
  subscribe as subscribeToAuth,
} from "@/lib/auth/session-store";
import { readJSON, removeKey, writeJSON } from "@/lib/auth/storage";

export type { SavedItem, SavedKind };

const WISHLIST_KEY = "mt.saved.v1";

/**
 * Where the list currently lives. `pending` while the session or the
 * account's list is still loading; `error` when the account list could not be
 * read.
 */
export type SavedStorage = "pending" | "browser" | "account" | "error";

const EMPTY: SavedItem[] = [];

let localCache: SavedItem[] | null = null;
let accountRows: SavedItem[] = EMPTY;
let storage: SavedStorage = isAuthConfigured ? "pending" : "browser";
/** The signed-in user the current `storage` was resolved for. */
let syncedUser: string | null | undefined;
let loading: Promise<void> | null = null;
let started = false;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function readLocal(): SavedItem[] {
  if (localCache) return localCache;
  const raw = readJSON<unknown>(WISHLIST_KEY, EMPTY);
  localCache = Array.isArray(raw) && raw.length > 0 ? (raw as SavedItem[]) : EMPTY;
  return localCache;
}

function writeLocal(rows: SavedItem[]) {
  localCache = rows.length > 0 ? rows : EMPTY;
  writeJSON(WISHLIST_KEY, rows);
  emit();
}

function setAccountRows(rows: SavedItem[]) {
  accountRows = rows.length > 0 ? rows : EMPTY;
  emit();
}

function currentRows(): SavedItem[] {
  if (storage === "browser") return readLocal();
  if (storage === "account") return accountRows;
  return EMPTY;
}

export function keyOf(item: { kind: SavedKind; slug: string }) {
  return `${item.kind}:${item.slug}`;
}

function withItem(rows: SavedItem[], item: SavedItem, saved: boolean): SavedItem[] {
  const rest = rows.filter((r) => keyOf(r) !== keyOf(item));
  return saved ? [item, ...rest] : rest;
}

async function load(userId: string) {
  let result: SavedListResult;
  try {
    result = await listSavedItems();
  } catch {
    result = { error: "unreachable" };
  }
  if (syncedUser !== userId) return;

  if ("error" in result) {
    storage = "error";
    emit();
    return;
  }
  if (result.storage === "browser") {
    storage = "browser";
    emit();
    return;
  }

  storage = "account";
  setAccountRows(result.items);

  const local = readLocal();
  if (local.length === 0) return;
  try {
    const merged = await importSavedItems(
      local.slice(0, MAX_SAVED_IMPORT).map(({ kind, slug, savedAt }) => ({ kind, slug, savedAt })),
    );
    if (syncedUser !== userId || !("storage" in merged) || merged.storage !== "account") return;
    removeKey(WISHLIST_KEY);
    localCache = EMPTY;
    setAccountRows(merged.items);
  } catch {
    // Best effort: the browser copy stays put and is offered again next load.
  }
}

function sync() {
  const { user, status } = getAuthSnapshot();
  if (status !== "ready") return;
  const userId = user?.id ?? null;
  if (userId === syncedUser) return;
  syncedUser = userId;
  accountRows = EMPTY;

  if (!userId) {
    storage = "browser";
    loading = null;
    emit();
    return;
  }
  storage = "pending";
  emit();
  loading = load(userId);
}

/** Wait for the list's home to be known; retries a failed account load. */
async function settled(): Promise<SavedStorage> {
  if (storage === "error" && typeof syncedUser === "string") loading = load(syncedUser);
  if (storage === "pending" || storage === "error") await loading;
  return storage;
}

function start() {
  if (started || typeof window === "undefined" || !isAuthConfigured) return;
  started = true;
  subscribeToAuth(sync);
  sync();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
  };
}

const getServerSnapshot = () => EMPTY;
const getStorageServerSnapshot = (): SavedStorage => "pending";

/** Latest write per item, so a slow reply cannot undo a newer toggle. */
const latestWrite = new Map<string, number>();
let writeSeq = 0;

async function persist(item: SavedItem, saved: boolean) {
  const key = keyOf(item);
  const seq = ++writeSeq;
  latestWrite.set(key, seq);
  const userId = syncedUser;

  const where = await settled();
  if (where === "browser") {
    writeLocal(withItem(readLocal(), item, saved));
    return;
  }
  if (where !== "account") {
    toast.error("We could not update your saved places. Try again in a moment.");
    return;
  }

  const ref = { kind: item.kind, slug: item.slug };
  let result: Awaited<ReturnType<typeof addSavedItem>>;
  try {
    result = await (saved ? addSavedItem(ref) : removeSavedItem(ref));
  } catch {
    result = { ok: false, error: "We could not reach the server. Check your connection." };
  }
  if (syncedUser !== userId) return;
  if (!result.ok) toast.error(result.error);
  if (latestWrite.get(key) !== seq) return;
  latestWrite.delete(key);
  // Re-applied on success too: an account list that finished loading after
  // the optimistic update would have overwritten it.
  setAccountRows(withItem(accountRows, item, result.ok ? saved : !saved));
}

/** Save or unsave; returns the new state. */
export function toggleSaved(item: Omit<SavedItem, "savedAt">) {
  const exists = currentRows().some((r) => keyOf(r) === keyOf(item));
  const saved = !exists;
  const row: SavedItem = { ...item, savedAt: new Date().toISOString() };

  if (storage === "browser") {
    writeLocal(withItem(readLocal(), row, saved));
  } else {
    if (storage === "account") setAccountRows(withItem(accountRows, row, saved));
    void persist(row, saved);
  }
  return saved;
}

export function removeSaved(item: { kind: SavedKind; slug: string }) {
  const existing = currentRows().find((r) => keyOf(r) === keyOf(item));
  if (storage === "browser") {
    writeLocal(readLocal().filter((r) => keyOf(r) !== keyOf(item)));
    return;
  }
  if (!existing) return;
  setAccountRows(withItem(accountRows, existing, false));
  void persist(existing, false);
}

export function clearSaved() {
  if (storage === "browser") {
    writeLocal([]);
    return;
  }
  const before = accountRows;
  setAccountRows([]);
  void (async () => {
    if ((await settled()) !== "account") return;
    const result = await clearSavedItems().catch(() => ({ ok: false as const, error: "" }));
    if (!result.ok) {
      setAccountRows(before);
      toast.error("We could not clear your saved places. Try again in a moment.");
    }
  })();
}

export function useSavedItems(): SavedItem[] {
  return useSyncExternalStore(subscribe, currentRows, getServerSnapshot);
}

/** Where the list lives right now, so pages can describe it truthfully. */
export function useSavedStorage(): SavedStorage {
  return useSyncExternalStore(subscribe, () => storage, getStorageServerSnapshot);
}

export function useIsSaved(item: { kind: SavedKind; slug: string }) {
  const rows = useSavedItems();
  const k = keyOf(item);
  return rows.some((r) => keyOf(r) === k);
}

export function useToggleSaved() {
  return useCallback((item: Omit<SavedItem, "savedAt">) => toggleSaved(item), []);
}
