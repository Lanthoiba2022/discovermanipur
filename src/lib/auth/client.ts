"use client";

import { createAuthClient } from "@neondatabase/auth/next";

import { isAuthConfigured } from "./env";

let cached: ReturnType<typeof createAuthClient> | null = null;

/**
 * Browser Neon Auth client. Talks to the same-origin proxy at `/api/auth`.
 *
 * Returns `null` (never throws) when Neon Auth is not configured, so callers
 * can degrade to the local-development session instead of crashing at import
 * time.
 */
export function getAuthClient() {
  if (!isAuthConfigured) return null;
  cached ??= createAuthClient();
  return cached;
}
