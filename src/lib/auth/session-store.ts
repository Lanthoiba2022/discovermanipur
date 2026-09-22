"use client";

/**
 * Auth session store.
 *
 * One module-level store shared by every client component (read with
 * `useAuth()`), so no provider has to be threaded through the read-only root
 * layout. When Supabase is configured it mirrors the real Supabase session;
 * when it is not, it is a local **demo session** persisted to `localStorage`
 * with exactly the same shape, so Phase 7 is a body swap.
 */

import type { Profile } from "@/types";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { readJSON, removeKey, writeJSON } from "./storage";

export const SESSION_KEY = "mt.auth.session.v1";
export const DEMO_ACCOUNTS_KEY = "mt.auth.accounts.v1";

export interface AuthState {
  user: Profile | null;
  status: "loading" | "ready";
  /** True when running on the local mock session (no Supabase credentials). */
  demo: boolean;
}

export interface DemoAccount extends Profile {
  /** Demo-only. Never a real credential store — see the banner on /auth. */
  password: string;
}

const SERVER_STATE: AuthState = { user: null, status: "loading", demo: !isSupabaseConfigured };

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

function toProfile(input: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
  created_at?: string;
}): Profile {
  const meta = input.user_metadata ?? {};
  const str = (key: string) => (typeof meta[key] === "string" ? (meta[key] as string) : undefined);
  return {
    id: input.id,
    email: input.email ?? "",
    firstName: str("first_name"),
    lastName: str("last_name"),
    phone: str("phone"),
    avatarUrl: str("avatar_url"),
    role: str("role") === "host" || str("role") === "admin" ? (str("role") as Profile["role"]) : "user",
    createdAt: input.created_at ?? new Date().toISOString(),
  };
}

export { toProfile };

/** Idempotent: hydrate once, on first subscriber. */
export function ensureHydrated() {
  if (hydrating || typeof window === "undefined") return;
  hydrating = true;

  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    setState({ user: readJSON<Profile | null>(SESSION_KEY, null), status: "ready", demo: true });
    return;
  }

  setState({ demo: false });

  supabase.auth
    .getUser()
    .then(({ data }) => {
      setState({ user: data.user ? toProfile(data.user) : null, status: "ready" });
    })
    .catch(() => setState({ user: null, status: "ready" }));

  supabase.auth.onAuthStateChange((_event, session) => {
    setState({ user: session?.user ? toProfile(session.user) : null, status: "ready" });
  });
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  ensureHydrated();
  return () => {
    listeners.delete(listener);
  };
}
