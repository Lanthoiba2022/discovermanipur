/**
 * Server error reporting: one structured log line per uncaught server error.
 *
 * Next calls `onRequestError` for every error it captures while rendering a
 * Server Component, running a Route Handler or a Server Action, or in the
 * proxy (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md).
 * Without it, a production 500 leaves only React's digest on the error page
 * and whatever the framework happened to print.
 *
 * The line is JSON so Vercel's log search can filter on `routePath` or
 * `digest`, and the digest matches the one shown on the user's error page.
 *
 * What is deliberately left out:
 * - The query string and headers: they can carry search terms, tokens and
 *   cookies.
 * - Drizzle's own message, which is the SQL plus its bound parameters (user
 *   ids, notes). `describeError` (src/lib/log.ts) replaces a "Failed query:"
 *   message with the cause's Postgres message.
 *
 * No network I/O (nothing here should be able to slow or fail a response), and
 * no `register` export: there is nothing to set up at boot. Safe in both the
 * Node.js and Edge runtimes.
 */
import type { Instrumentation } from "next";

import { describeError } from "@/lib/log";

/** How every `DrizzleQueryError` message starts (node_modules/drizzle-orm/errors.js). */
const FAILED_QUERY = "Failed query:";

export const onRequestError: Instrumentation.onRequestError = (err, request, context) => {
  const digest =
    typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined;
  // The error's own message, unless it is Drizzle's SQL dump: then the root
  // cause's (the Postgres message), via the same sanitiser the DB logs use.
  const root = describeError(err);
  const own = err instanceof Error ? err.message : String(err);
  const message = own && !own.startsWith(FAILED_QUERY) ? own : root.message;

  console.error(
    JSON.stringify({
      level: "error",
      scope: "request",
      routePath: context.routePath,
      routeType: context.routeType,
      method: request.method,
      path: request.path.split("?")[0],
      digest,
      pgCode: root.pgCode,
      message,
    }),
  );
};
