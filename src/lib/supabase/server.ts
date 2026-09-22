import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

/**
 * Cookie-backed Supabase client for Server Components, Route Handlers and
 * Server Actions.
 *
 * Returns `null` when Supabase is not configured. Never call this during
 * static generation — it reads request cookies and would opt the route into
 * dynamic rendering.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component: cookies are read-only here and the
          // proxy/middleware refresh already keeps the session alive.
        }
      },
    },
  });
}

/** Current Supabase user, or `null` when unauthenticated or unconfigured. */
export async function getServerUser() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export { isSupabaseConfigured };
