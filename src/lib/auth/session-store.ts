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
 *
 * With Neon Auth, the server is asked only when it might say "yes": when the
 * browser carries the `dm_signed_in` hint cookie (`./session-hint`) or the
 * store already holds a user. An anonymous visitor to a public page with a
 * Save or Book button therefore makes no Server Action call at all; the store
 * goes straight to "ready, signed out". The hint is a cost saver only, never
 * an authorization signal: the user shown here always comes from the
 * server's own session check.
 *
 * Failure policy (fail open toward the session): only a check that resolves
 * with no user signs the store out. A check that throws (offline, a flaky
 * network, a tab still running the previous deployment whose Server Action id
 * no longer exists) keeps whoever was signed in, so `AuthGuard` does not send
 * a signed-in traveller to `/auth` over a blip.
 */

import type { Profile } from "@/types";

import { isAuthConfigured, isDemoAuth } from "./env";
import { getCurrentProfile } from "./profile";
import { hasSessionHint } from "./session-hint";
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

/**
 * How stale the mirrored session may get before a returning tab re-checks it.
 * Thirty minutes: each check is a function invocation and, once Neon's cookie
 * cache has lapsed, an upstream session read that wakes the database. Neon
 * suspends compute after five idle minutes, so a five minute throttle let one
 * tab-switching traveller keep it awake all session long; thirty leaves it
 * room to sleep. Staleness is cheap here: every Server Action and protected
 * page re-reads the real session, so a mirrored user who has since expired is
 * caught on their next action. Sign-in and sign-out in another tab do not wait
 * for this; they arrive over the BroadcastChannel.
 */
const FOCUS_REFRESH_MS = 30 * 60_000;
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
 * Re-read the real session from the server. Called on first subscribe (when
 * the hint says there may be a session) and after every sign-in, sign-up and
 * sign-out, since there is no client-side auth event stream to listen to.
 *
 * A resolved `null` is the only thing that signs the store out. A throw keeps
 * the previous user and just ends the loading state, and clears the throttle
 * so the next focus tries again instead of waiting out `FOCUS_REFRESH_MS`.
 */
export async function refreshSession() {
  lastRefresh = Date.now();
  try {
    const user = await getCurrentProfile();
    setState({ user, status: "ready" });
  } catch {
    lastRefresh = 0;
    setState({ status: "ready" });
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
 *
 * Skipped outright for a signed-out tab with no hint: there is nothing the
 * server could add. The hint is read afresh on every focus, so a sign-in in
 * another tab of a browser without BroadcastChannel is still picked up here.
 */
function refreshIfStale() {
  if (document.visibilityState !== "visible") return;
  if (!state.user && !hasSessionHint()) return;
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

  if (hasSessionHint()) {
    setState({ demo: false });
    void refreshSession();
  } else {
    // No hint: nobody has signed in in this browser since the hint existed,
    // or they signed out. Settle as signed out without asking the server.
    // `/auth` and `/account` still check once (the auth form and the proxy),
    // which is how a session that predates the hint is recognised.
    setState({ user: null, status: "ready", demo: false });
  }

  // Registered either way: a sign-in in another tab arrives as a broadcast,
  // and a returning tab re-checks once the hint has appeared.
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
