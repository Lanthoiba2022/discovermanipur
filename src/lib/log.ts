/**
 * Structured, privacy-safe logging for database failures.
 *
 * Every line is one JSON object on stdout/stderr, so Vercel's log search can
 * filter on `scope` or `pgCode` instead of grepping prose:
 *
 *   {"level":"error","scope":"catalogue","pgCode":"57P01","message":"terminating connection ...","table":"eateries"}
 *
 * Why not just `console.error(err)`:
 *
 *   Drizzle wraps every failed query in a `DrizzleQueryError` whose OWN message
 *   is built from the SQL text and its bound parameters
 *   (`Failed query: <sql>\nparams: <params>`, node_modules/drizzle-orm/errors.js).
 *   Those parameters can hold user ids, emails and free-text notes, and logging
 *   the error object prints them all. Meanwhile the part an operator needs (the
 *   Postgres error code and the server's message) sits one level down, on
 *   `err.cause`, and is easy to miss under the SQL.
 *
 *   So this module reads the code and message from the cause chain and never
 *   emits a "Failed query:" message or a `params` field. Callers add their own
 *   safe context through `extra` (a table name, a fallback decision), never
 *   request input.
 *
 * No dependencies and no Node built-ins: `src/instrumentation.ts` uses
 * `describeError` and may run in the Edge runtime.
 */

/** Safe context fields. Keep them to identifiers and decisions, never user input. */
export type LogExtra = Record<string, string | number | boolean | null | undefined>;

/** What is safe to log about an error. */
export interface ErrorSummary {
  /** Postgres SQLSTATE (`57P01`) or a Node network code (`ECONNREFUSED`), when one exists. */
  pgCode?: string;
  message: string;
}

/** Drizzle's own message carries the SQL and its parameters. */
const DRIZZLE_PREFIX = "Failed query:";

const WITHHELD = "Query failed (SQL and parameters withheld from logs)";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

/**
 * Reduce an error to a code and a message that are safe to log.
 *
 * Walks the `cause` chain (bounded, in case of a cycle) and prefers the
 * deepest error: for a Drizzle failure that is the `pg` DatabaseError, for a
 * wrapped build error it is whatever actually broke. The first `code` string
 * found on the way down becomes `pgCode`. A message that starts with
 * "Failed query:" is never returned verbatim.
 */
export function describeError(err: unknown): ErrorSummary {
  let pgCode: string | undefined;
  let message: string | undefined;

  let current: unknown = err;
  for (let depth = 0; depth < 6 && current != null; depth++) {
    const record = asRecord(current);
    if (!record) {
      // A thrown string or number: nothing below it.
      message = String(current);
      break;
    }
    if (pgCode === undefined && typeof record.code === "string") pgCode = record.code;
    if (typeof record.message === "string" && record.message) message = record.message;
    if (record.cause === undefined || record.cause === current) break;
    current = record.cause;
  }

  if (!message || message.startsWith(DRIZZLE_PREFIX)) message = WITHHELD;
  return pgCode ? { pgCode, message } : { message };
}

function write(level: "error" | "warn", scope: string, err: unknown, extra?: LogExtra) {
  const line = JSON.stringify({ level, scope, ...describeError(err), ...extra });
  if (level === "error") console.error(line);
  else console.warn(line);
}

/** A database failure the request could not recover from, or recovered from with degraded data. */
export function logDbError(scope: string, err: unknown, extra?: LogExtra): void {
  write("error", scope, err, extra);
}

/** A database hiccup that was absorbed (an idle client dropping, a retried read). */
export function logDbWarn(scope: string, err: unknown, extra?: LogExtra): void {
  write("warn", scope, err, extra);
}
