"use client";

/**
 * Auth session store.
 *
 * One module-level store shared by every client component (read with
 * `useAuth()`), so no provider has to be threaded through the read-only root
 * layout. When Neon Auth is configured it mirrors the real session (read on
 * the server by `getCurrentProfile`); when it is not, it is a local **demo session** persisted to `localStorage`
 * with exactly the same shape, so Phase 7 is a body swap.
 */

import type { Profile } from "@/types";

import { isAuthConfigured } from "./env";
import { getCurrentProfile } from "./profile";
import { readJSON, removeKey, writeJSON } from "./storage";

export const SESSION_KEY = "mt.auth.session.v1";
export const DEMO_ACCOUNTS_KEY = "mt.auth.accounts.v1";

export interface AuthState {
  user: Profile | null;
  status: "loading" | "ready";
  /** True when running on the local mock session (no Neon Auth credentials). */
  demo: boolean;
}

export interface DemoAccount extends Profile {
  /** Demo-only. Never a real credential store — see the banner on /auth. */
  password: string;
}

const SERVER_STATE: AuthState = { user: null, status: "loading", demo: !isAuthConfigured };

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
 * auth event stream to listen to (Supabase had `onAuthStateChange`).
 */
export async function refreshSession() {
  try {
    const user = await getCurrentProfile();
    setState({ user, status: "ready" });
  } catch {
    setState({ user: null, status: "ready" });
  }
}

/** Idempotent: hydrate once, on first subscriber. */
export function ensureHydrated() {
  if (hydrating || typeof window === "undefined") return;
  hydrating = true;

  if (!isAuthConfigured) {
    setState({ user: readJSON<Profile | null>(SESSION_KEY, null), status: "ready", demo: true });
    return;
  }

  setState({ demo: false });
  void refreshSession();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  ensureHydrated();
  return () => {
    listeners.delete(listener);
  };
}
