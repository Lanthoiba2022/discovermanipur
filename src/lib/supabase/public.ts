import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

let cached: SupabaseClient | null = null;

/**
 * Anonymous, cookie-free Supabase client for public catalogue and content
 * reads.
 *
 * Deliberately NOT the client in `./server.ts`: that one reads request cookies
 * to carry a session, which opts any route using it into dynamic rendering.
 * Everything this client fetches is world-readable under RLS and identical for
 * every visitor, so it needs no session — and staying off cookies is what lets
 * the catalogue and content pages keep being statically generated.
 *
 * Returns `null` rather than throwing when credentials are absent, so callers
 * can fall back to the bundled seed data.
 */
export function getSupabasePublicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (cached) return cached;
  cached = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
