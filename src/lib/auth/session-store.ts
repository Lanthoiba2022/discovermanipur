"use client";

/**
 * Auth session store.
 *
 * One module-level store shared by every client component (read with
 * `useAuth()`), so no provider has to be threaded through the read-only root
 * layout. When Neon Auth is configured it mirrors the real session (read on
 * the server by `getCurrentProfile`) and re-reads it when a tab returns to view
 * or another tab signs in or out. Without Neon Auth, in development only, it is
 * a local-development session persisted to `localStorage` with exactly the
 * same shape; a production build without Neon Auth has no sign-in at all.
 */

import type { Profile } from "@/types";

import { isAuthConfigured, isDemoAuth } from "./env";
import { getCurrentProfile } from "./profile";
import { readJSON, removeKey, writeJSON } from "./storage";

export const SESSION_KEY = "mt.auth.session.v1";
export const DEMO_ACCOUNTS_KEY = "mt.auth.accounts.v1";

export interface AuthState {
  user: Profile | null;
  status: "loading" | "ready";
  /** True on the local-development session (no Neon Auth, development only). */
  demo: boolean;
}

export interface DemoAccount extends Profile {
  /** Development only. Never a real credential store. See the banner on /auth. */
  password: string;
}

const SERVER_STATE: AuthState = { user: null, status: "loading", demo: isDemoAuth };

/** How stale the mirrored session may get before a returning tab re-checks it. */
const FOCUS_REFRESH_MS = 30_000;
const CHANNEL_NAME = "mt.auth.v1";

let lastRefresh = 0;
let channel: BroadcastChannel | null = null;

let state: AuthState = SERVER_STATE;
const listeners = new Set<() => void>();
let hydrating = false;

function emit() {
  for (const listener of listeners) listener();
}

export function setState(next: Partial<AuthState>) {
  state = { ...state, ...next };
  emit();
}

export function getSnapshot(): AuthState {
  return state;
}

export function getServerSnapshot(): AuthState {
  return SERVER_STATE;
}

export function readDemoAccounts(): DemoAccount[] {
  return readJSON<DemoAccount[]>(DEMO_ACCOUNTS_KEY, []);
}

export function writeDemoAccounts(accounts: DemoAccount[]) {
  writeJSON(DEMO_ACCOUNTS_KEY, accounts);
}

export function persistSession(user: Profile | null) {
  if (user) writeJSON(SESSION_KEY, user);
  else removeKey(SESSION_KEY);
  setState({ user, status: "ready" });
}

/**
 * Re-read the real session from the server. Called on first subscribe and
 * after every sign-in, sign-up and sign-out, since there is no client-side
 * auth event stream to listen to.
 */
export async function refreshSession() {
  lastRefresh = Date.now();
  try {
    const user = await getCurrentProfile();
    setState({ user, status: "ready" });
  } catch {
    setState({ user: null, status: "ready" });
  }
}

/**
 * Tell this browser's other tabs the session changed (sign-in, sign-out,
 * profile edit), so they re-read it instead of showing the old one. Separate
 * from `refreshSession` so a tab answering the message does not re-broadcast.
 */
export function notifyOtherTabs() {
  try {
    channel?.postMessage("changed");
  } catch {
    // A closed channel: nothing to tell.
  }
}

/**
 * Re-check when a tab comes back into view: the session may have expired or
 * been ended elsewhere while it sat in the background. Throttled, so flicking
 * between tabs does not fire a request each time.
 */
function refreshIfStale() {
  if (document.visibilityState !== "visible") return;
  if (Date.now() - lastRefresh < FOCUS_REFRESH_MS) return;
  void refreshSession();
}

/** Idempotent: hydrate once, on first subscriber. */
export function ensureHydrated() {
  if (hydrating || typeof window === "undefined") return;
  hydrating = true;

  if (isDemoAuth) {
    setState({ user: readJSON<Profile | null>(SESSION_KEY, null), status: "ready", demo: true });
    // `storage` fires in every other tab when one writes the key.
    window.addEventListener("storage", (event) => {
      if (event.key === SESSION_KEY) {
        setState({ user: readJSON<Profile | null>(SESSION_KEY, null), status: "ready" });
      }
    });
    return;
  }

  if (!isAuthConfigured) {
    // A production build without Neon Auth: sign-in is off, nobody is signed in.
    setState({ user: null, status: "ready", demo: false });
    return;
  }

  setState({ demo: false });
  void refreshSession();

  document.addEventListener("visibilitychange", refreshIfStale);
  window.addEventListener("focus", refreshIfStale);
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = () => void refreshSession();
  }
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  ensureHydrated();
  return () => {
    listeners.delete(listener);
  };
}
