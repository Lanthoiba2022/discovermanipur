"use client";

/**
 * Auth operations. Every function is async and returns `{ error: string|null }`
 * so the call sites are the same on Neon Auth and on the local-development
 * session. Only the bodies below branch.
 */

import type { Profile } from "@/types";

import { getAuthClient } from "./client";
import { isDemoAuth } from "./env";
import { saveProfile } from "./profile";
import {
  type DemoAccount,
  getSnapshot,
  notifyOtherTabs,
  persistSession,
  readDemoAccounts,
  refreshSession,
  setState,
  writeDemoAccounts,
} from "./session-store";

export interface AuthResult {
  error: string | null;
  /**
   * The account exists but its email is not verified yet. A 6-digit code has
   * been emailed (via the Neon Auth `send.otp` webhook → Brevo); the caller
   * should collect it and call `verifyEmailCode`.
   */
  needsVerification?: boolean;
  /**
   * With `needsVerification`: the code could not be sent, although the account
   * exists. The code step shows this and offers to send again; telling the
   * person their account was not created would be untrue.
   */
  sendError?: string;
  /**
   * With `needsVerification`: Neon Auth already set a session cookie for the
   * unverified address ("Verify at sign-up" off). Backing out of the code step
   * must sign it out again.
   */
  sessionCreated?: boolean;
}

/**
 * A production build without Neon Auth: the local accounts are development-only
 * (see `isDemoAuth`), so there is nothing to sign in to.
 */
const UNAVAILABLE: AuthResult = { error: "Sign-in isn't available on this site right now." };

function delay(ms = 420) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `demo-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

interface ClientError {
  message?: string;
  statusText?: string;
  status?: number;
  code?: string;
}

/**
 * Run a Neon Auth client call and always get `{ data, error }` back.
 *
 * Plain Better Auth returns failures as `{ error }`, but Neon's wrapper
 * (`@neondatabase/auth`) THROWS an `AuthApiError` for any non-2xx response:
 * a wrong password, a taken email, a bad code, a signup the webhook refused.
 * Without this, those throw past the form and the user sees nothing. The
 * thrown error carries `message`, `status` and `code`, same as `{ error }`.
 */
async function attempt<T>(
  run: () => Promise<{ data: T; error: ClientError | null }>,
): Promise<{ data: T | null; error: ClientError | null }> {
  try {
    return await run();
  } catch (err) {
    const e = (err ?? {}) as ClientError;
    return {
      data: null,
      error: { message: e.message, status: e.status, code: e.code, statusText: e.statusText },
    };
  }
}

/**
 * Neon's wrapper renames Better Auth error codes, e.g. `EMAIL_NOT_VERIFIED` →
 * `email_not_confirmed`; match either, so this keeps working if the wrapper
 * ever passes the original through.
 */
const isUnverified = (e: ClientError | null) =>
  e?.code === "email_not_confirmed" || e?.code === "EMAIL_NOT_VERIFIED";

/** Better Auth errors carry `message`, but not always. Fall back to status. */
function messageOf(error: { message?: string; statusText?: string } | null | undefined) {
  if (!error) return null;
  return error.message || error.statusText || "Something went wrong. Try again.";
}

/**
 * True when Neon Auth answered with a session for an address that is not
 * verified. That happens when "Verify at sign-up" is off in the Neon console:
 * the app then asks for the code itself rather than trusting that setting, so
 * nobody ends up signed in with an address that can never be verified.
 */
function signedInUnverified(data: unknown): boolean {
  const user = (data as { user?: { emailVerified?: boolean } } | null)?.user;
  return user?.emailVerified === false;
}

/**
 * A failed 6-digit code, in words a person can act on. OTP failures are not in
 * Neon's code map (they arrive as a generic `validation_failed`), so the
 * message is the only reliable signal.
 */
function otpErrorMessage(error: ClientError): string {
  const text = `${error.code ?? ""} ${error.message ?? ""}`;
  if (/expired/i.test(text)) return "That code has expired. Send a new one.";
  if (/too many/i.test(text)) return "Too many tries with that code. Send a new one.";
  if (/invalid.?otp|invalid code/i.test(text)) return "That code isn't right. Check the email and try again.";
  return messageOf(error) ?? "That code could not be checked. Try again.";
}

/** Ask Neon Auth to email a fresh verification code. */
async function requestVerificationCode(email: string): Promise<string | null> {
  const client = getAuthClient();
  if (!client) return null;
  const { error } = await attempt(() =>
    client.emailOtp.sendVerificationOtp({ email, type: "email-verification" }),
  );
  return messageOf(error);
}

/* --------------------------------- sign in --------------------------------- */

export async function signInWithPassword(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const client = getAuthClient();

  if (client) {
    const email = input.email.trim();
    const { data, error } = await attempt(() => client.signIn.email({ email, password: input.password }));
    const liveUnverified = !error && signedInUnverified(data);
    if (isUnverified(error) || liveUnverified) {
      // Right password, unverified address (e.g. they closed the tab before
      // entering the code). Send a fresh code rather than a dead end. The
      // session, if one was set, is not mirrored into the store until the code
      // is accepted: a signed-in store would navigate away from the code step.
      const sendError = await requestVerificationCode(email);
      return { error: null, needsVerification: true, sendError: sendError ?? undefined, sessionCreated: liveUnverified };
    }
    if (error) return { error: messageOf(error) };
    await refreshSession();
    notifyOtherTabs();
    return { error: null };
  }

  if (!isDemoAuth) return UNAVAILABLE;
  await delay();
  const accounts = readDemoAccounts();
  const match = accounts.find(
    (a) => a.email.toLowerCase() === input.email.trim().toLowerCase(),
  );

  if (!match) {
    return { error: "No local account with that email. Create one on the Sign up tab." };
  }
  if (match.password !== input.password) {
    return { error: "That password does not match this local account." };
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
    const email = input.email.trim();
    const firstName = input.firstName.trim();
    const lastName = input.lastName?.trim() ?? "";
    const { data, error } = await attempt(() =>
      client.signUp.email({
        email,
        password: input.password,
        name: [firstName, lastName].filter(Boolean).join(" "),
      }),
    );
    // A non-Gmail address is refused by the `user.before_create` webhook; its
    // message ("only @gmail.com addresses…") comes back here as-is.
    if (error) return { error: messageOf(error) };

    // With "require email verification" on, Neon Auth creates the user but no
    // session (`token` is null) until the code is entered.
    if (!data?.token) {
      const sendError = await requestVerificationCode(email);
      return { error: null, needsVerification: true, sendError: sendError ?? undefined };
    }

    // Verification off in the console: sign-up left a live session. Record the
    // name exactly as typed (splitting `name` back apart would guess wrong for
    // multi-word first names); this only needs the cookie.
    await saveProfile({ firstName, lastName, phone: "", avatarUrl: "" });

    // Still verify the address: listing and voting need it, and nothing else
    // would ever send the code. The store is refreshed only once the code is
    // accepted (`verifyEmailCode`), so the form stays on the code step.
    if (signedInUnverified(data)) {
      const sendError = await requestVerificationCode(email);
      return { error: null, needsVerification: true, sendError: sendError ?? undefined, sessionCreated: true };
    }

    await refreshSession();
    notifyOtherTabs();
    return { error: null };
  }

  if (!isDemoAuth) return UNAVAILABLE;
  await delay();
  const accounts = readDemoAccounts();
  const email = input.email.trim().toLowerCase();
  if (accounts.some((a) => a.email.toLowerCase() === email)) {
    return { error: "A local account with that email already exists. Sign in instead." };
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

/* ---------------------------- email verification ---------------------------- */

export interface VerifyResult extends AuthResult {
  /** Verified and signed in (Neon Auth auto-signs-in after verification). */
  signedIn?: boolean;
}

/**
 * Check the 6-digit code. On success Neon Auth marks the email verified and,
 * with auto sign-in on, sets the session cookie. `firstName`/`lastName` are
 * saved to the profile once that session exists. At sign-up time there was
 * no session to save them with.
 */
export async function verifyEmailCode(input: {
  email: string;
  otp: string;
  firstName?: string;
  lastName?: string;
}): Promise<VerifyResult> {
  const client = getAuthClient();
  if (!client) return isDemoAuth ? { error: null, signedIn: true } : UNAVAILABLE;

  const { error } = await attempt(() =>
    client.emailOtp.verifyEmail({ email: input.email.trim(), otp: input.otp.trim() }),
  );
  if (error) return { error: otpErrorMessage(error) };

  await refreshSession();
  const signedIn = Boolean(getSnapshot().user);
  if (signedIn && input.firstName?.trim()) {
    await saveProfile({
      firstName: input.firstName.trim(),
      lastName: input.lastName?.trim() ?? "",
      phone: "",
      avatarUrl: "",
    });
    await refreshSession();
  }
  if (signedIn) notifyOtherTabs();
  return { error: null, signedIn };
}

export async function resendVerificationCode(email: string): Promise<AuthResult> {
  if (!getAuthClient()) return isDemoAuth ? { error: null } : UNAVAILABLE;
  const error = await requestVerificationCode(email.trim());
  return { error };
}

/* ----------------------------- password reset ------------------------------ */

/** Local development accounts have no inbox to send a code to. */
const NO_RESET_LOCALLY: AuthResult = {
  error: "Local development accounts cannot reset a password. Create a new local account instead.",
};

/**
 * Email a 6-digit password-reset code (through the Neon Auth `send.otp`
 * webhook and Brevo). Neon Auth answers the same way whether or not an
 * account exists, so this never reveals which addresses are registered.
 */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const client = getAuthClient();
  if (!client) return isDemoAuth ? NO_RESET_LOCALLY : UNAVAILABLE;
  const { error } = await attempt(() => client.emailOtp.requestPasswordReset({ email: email.trim() }));
  return { error: messageOf(error) };
}

/**
 * Set a new password with the emailed code, then sign in with it. The sign-in
 * goes through `signInWithPassword`, so an address that is still unverified
 * gets its verification code there, exactly as at a normal sign-in.
 */
export interface ResetResult extends AuthResult {
  /** The new password is set. Anything else in the result is about signing in afterwards. */
  passwordChanged: boolean;
}

export async function resetPasswordWithCode(input: {
  email: string;
  otp: string;
  password: string;
}): Promise<ResetResult> {
  const client = getAuthClient();
  if (!client) return { ...(isDemoAuth ? NO_RESET_LOCALLY : UNAVAILABLE), passwordChanged: false };

  const email = input.email.trim();
  const { error } = await attempt(() =>
    client.emailOtp.resetPassword({ email, otp: input.otp.trim(), password: input.password }),
  );
  if (error) return { error: otpErrorMessage(error), passwordChanged: false };

  return { ...(await signInWithPassword({ email, password: input.password })), passwordChanged: true };
}

/* -------------------------------- sign out --------------------------------- */

export async function signOut(): Promise<AuthResult> {
  const client = getAuthClient();
  if (client) {
    const { error } = await attempt(() => client.signOut());
    if (error) return { error: messageOf(error) };
    setState({ user: null, status: "ready" });
    notifyOtherTabs();
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
    notifyOtherTabs();
    return { error: null };
  }

  if (!isDemoAuth) return UNAVAILABLE;
  await delay(300);
  const accounts = readDemoAccounts();
  writeDemoAccounts(
    accounts.map((a) => (a.id === next.id ? { ...a, ...next, password: a.password } : a)),
  );
  persistSession(next);
  return { error: null };
}
