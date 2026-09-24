"use client";

/**
 * Auth operations. Every function is async and returns `{ error: string|null }`
 * so the call sites are the same on Neon Auth and on the local demo session —
 * only the bodies below branch.
 */

import type { Profile } from "@/types";

import { getAuthClient } from "./client";
import { SITE_URL } from "./env";
import { saveProfile } from "./profile";
import {
  type DemoAccount,
  getSnapshot,
  persistSession,
  readDemoAccounts,
  refreshSession,
  setState,
  writeDemoAccounts,
} from "./session-store";

export interface AuthResult {
  error: string | null;
  /** Set when the flow finishes out-of-band (magic link email sent). */
  pending?: boolean;
}

function delay(ms = 420) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `demo-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

/** Better Auth errors carry `message`, but not always — fall back to status. */
function messageOf(error: { message?: string; statusText?: string } | null | undefined) {
  if (!error) return null;
  return error.message || error.statusText || "Something went wrong. Try again.";
}

/**
 * Absolute on purpose: Neon Auth resolves a relative callback against its own
 * host, not this site. The origin must be a trusted domain in Neon Auth
 * (localhost is by default).
 */
function redirectTo(next?: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : SITE_URL;
  const target = next && next.startsWith("/") ? next : "/account";
  return `${origin}/auth/callback?next=${encodeURIComponent(target)}`;
}

/* --------------------------------- sign in --------------------------------- */

export async function signInWithPassword(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const client = getAuthClient();

  if (client) {
    const { error } = await client.signIn.email({
      email: input.email.trim(),
      password: input.password,
    });
    if (error) return { error: messageOf(error) };
    await refreshSession();
    return { error: null };
  }

  await delay();
  const accounts = readDemoAccounts();
  const match = accounts.find(
    (a) => a.email.toLowerCase() === input.email.trim().toLowerCase(),
  );

  if (!match) {
    return { error: "No demo account with that email. Create one on the Sign up tab." };
  }
  if (match.password !== input.password) {
    return { error: "That password does not match this demo account." };
  }

  const { password: _password, ...profile } = match;
  void _password;
  persistSession(profile);
  return { error: null };
}

/* --------------------------------- sign up --------------------------------- */

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}): Promise<AuthResult> {
  const client = getAuthClient();

  if (client) {
    const firstName = input.firstName.trim();
    const lastName = input.lastName?.trim() ?? "";
    const { error } = await client.signUp.email({
      email: input.email.trim(),
      password: input.password,
      name: [firstName, lastName].filter(Boolean).join(" "),
    });
    if (error) return { error: messageOf(error) };

    // Email verification is off on this Neon Auth branch, so sign-up leaves a
    // live session. Record the name exactly as typed — splitting `name` back
    // apart would guess wrong for multi-word first names.
    await saveProfile({ firstName, lastName, phone: "", avatarUrl: "" });
    await refreshSession();
    return { error: null };
  }

  await delay();
  const accounts = readDemoAccounts();
  const email = input.email.trim().toLowerCase();
  if (accounts.some((a) => a.email.toLowerCase() === email)) {
    return { error: "A demo account with that email already exists. Sign in instead." };
  }

  const account: DemoAccount = {
    id: newId(),
    email: input.email.trim(),
    firstName: input.firstName.trim(),
    lastName: input.lastName?.trim() || undefined,
    role: "user",
    createdAt: new Date().toISOString(),
    password: input.password,
  };

  writeDemoAccounts([...accounts, account]);
  const { password: _password, ...profile } = account;
  void _password;
  persistSession(profile);
  return { error: null };
}

/* ------------------------------- magic link -------------------------------- */

export async function signInWithMagicLink(input: {
  email: string;
  next?: string;
}): Promise<AuthResult> {
  const client = getAuthClient();

  if (client) {
    // Magic Link is a Neon Auth plugin that is OFF by default per branch; until
    // it is enabled (Console → Auth → Plugins) the endpoint answers a bare 404.
    const { error } = await client.signIn.magicLink({
      email: input.email.trim(),
      callbackURL: redirectTo(input.next),
    });
    if (error?.status === 404) {
      return { error: "Magic links aren't switched on yet. Sign in with your password instead." };
    }
    return { error: messageOf(error), pending: !error };
  }

  await delay();
  const email = input.email.trim();
  const accounts = readDemoAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    const { password: _password, ...profile } = existing;
    void _password;
    persistSession(profile);
    return { error: null };
  }

  const account: DemoAccount = {
    id: newId(),
    email,
    firstName: email.split("@")[0] ?? "Traveller",
    role: "user",
    createdAt: new Date().toISOString(),
    password: newId(),
  };
  writeDemoAccounts([...accounts, account]);
  const { password: _pw, ...profile } = account;
  void _pw;
  persistSession(profile);
  return { error: null };
}

/* -------------------------------- sign out --------------------------------- */

export async function signOut(): Promise<AuthResult> {
  const client = getAuthClient();
  if (client) {
    const { error } = await client.signOut();
    if (error) return { error: messageOf(error) };
    setState({ user: null, status: "ready" });
    return { error: null };
  }
  await delay(200);
  persistSession(null);
  return { error: null };
}

/* ------------------------------ update profile ------------------------------ */

export async function updateProfile(patch: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}): Promise<AuthResult> {
  const current = getSnapshot().user;
  if (!current) return { error: "You need to be signed in to update your profile." };

  const next: Profile = {
    ...current,
    firstName: patch.firstName?.trim() || undefined,
    lastName: patch.lastName?.trim() || undefined,
    phone: patch.phone?.trim() || undefined,
    avatarUrl: patch.avatarUrl?.trim() || undefined,
  };

  const client = getAuthClient();
  if (client) {
    const result = await saveProfile({
      firstName: next.firstName ?? "",
      lastName: next.lastName ?? "",
      phone: next.phone ?? "",
      avatarUrl: next.avatarUrl ?? "",
    });
    if (result.error) return { error: result.error };
    if (result.profile) setState({ user: result.profile, status: "ready" });

    // Keep Neon Auth's own display fields in step, so the Console and any
    // future OAuth account show the same name. Best-effort: the profile row
    // above is the source of truth, and it has already saved.
    await client
      .updateUser({
        name: [next.firstName, next.lastName].filter(Boolean).join(" "),
        image: next.avatarUrl ?? null,
      })
      .catch(() => undefined);
    return { error: null };
  }

  await delay(300);
  const accounts = readDemoAccounts();
  writeDemoAccounts(
    accounts.map((a) => (a.id === next.id ? { ...a, ...next, password: a.password } : a)),
  );
  persistSession(next);
  return { error: null };
}
