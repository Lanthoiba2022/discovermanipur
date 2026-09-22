"use client";

/**
 * Auth operations. Every function is async and returns `{ error: string|null }`
 * so the call sites stay identical once Supabase credentials land — only the
 * bodies below change.
 */

import type { Profile } from "@/types";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/supabase/env";
import {
  type DemoAccount,
  getSnapshot,
  persistSession,
  readDemoAccounts,
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
  const supabase = getSupabaseBrowserClient();

  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword(input);
    return { error: error?.message ?? null };
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
  const supabase = getSupabaseBrowserClient();

  if (supabase) {
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: redirectTo(),
        data: { first_name: input.firstName, last_name: input.lastName ?? "" },
      },
    });
    return { error: error?.message ?? null, pending: !error };
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
  const supabase = getSupabaseBrowserClient();

  if (supabase) {
    const { error } = await supabase.auth.signInWithOtp({
      email: input.email,
      options: { emailRedirectTo: redirectTo(input.next) },
    });
    return { error: error?.message ?? null, pending: !error };
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
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    return { error: error?.message ?? null };
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

  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: next.firstName ?? "",
        last_name: next.lastName ?? "",
        phone: next.phone ?? "",
        avatar_url: next.avatarUrl ?? "",
      },
    });
    if (error) return { error: error.message };
    await supabase
      .from("profiles")
      .update({
        first_name: next.firstName ?? null,
        last_name: next.lastName ?? null,
        phone: next.phone ?? null,
        avatar_url: next.avatarUrl ?? null,
      })
      .eq("id", next.id);
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
