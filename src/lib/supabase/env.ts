/**
 * Supabase environment resolution.
 *
 * Nothing in here throws. The whole app must build and run with no Supabase
 * credentials present — when `isSupabaseConfigured` is false the auth layer
 * falls back to a clearly-labelled local demo session (see `src/lib/auth`).
 */

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function isUsable(value: string) {
  const v = value.trim();
  if (!v) return false;
  // Guard against placeholder values copied straight out of .env.example.
  return !/^(your|changeme|replace|todo|xxx)/i.test(v);
}

export const SUPABASE_URL = rawUrl.trim();
export const SUPABASE_ANON_KEY = rawAnonKey.trim();

/**
 * True only when both public Supabase variables look like real credentials.
 * Safe to read on the server and in the browser (both vars are `NEXT_PUBLIC_`,
 * so they are inlined at build time).
 */
export const isSupabaseConfigured: boolean =
  isUsable(SUPABASE_URL) && isUsable(SUPABASE_ANON_KEY);

/** Public site origin, used for magic-link/OAuth redirects. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
