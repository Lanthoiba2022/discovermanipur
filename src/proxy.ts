import type { NextRequest } from "next/server";

import { updateSupabaseSession } from "@/lib/supabase/middleware";

/**
 * Keeps the Supabase auth cookie fresh on every navigation.
 *
 * Next.js 16 renamed the `middleware` file convention to `proxy`; this file is
 * the session-refresh layer the auth slice owns (previously `src/middleware.ts`).
 * It is a complete no-op when Supabase is not configured, so the app runs with
 * an empty environment.
 */
export async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals, the image optimizer, the favicon and
     * static asset requests — auth cookies have no business there.
     */
    "/((?!_next/static|_next/image|favicon.ico|file-uploads|videos|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|mp4|webm|ico)$).*)",
  ],
};
