/**
 * A small fixed-window rate limiter for the public endpoints that cost money
 * or send email: the concierge, the photo proxy, the auth proxy, the contact
 * form and the webhook.
 *
 * PER INSTANCE ONLY. The counters live in this process's memory, so each
 * serverless instance (and each region) counts on its own, and a cold start
 * resets them. That still stops a single client hammering one instance, which
 * is the common abuse, but it is not a global quota. The production upgrade is
 * a shared store (Upstash Redis via `@upstash/ratelimit`, or Vercel KV) behind
 * the same `rateLimit` signature, or Vercel Firewall rate-limit rules in front
 * of the app.
 */

export interface RateLimitRule {
  /** Requests allowed per window. */
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Seconds until the window resets (the `Retry-After` value). */
  retryAfter: number;
}

interface Window {
  count: number;
  resetAt: number;
}

// Bounded so a flood of distinct keys (spoofed IPs, random emails) cannot grow
// memory without limit. Past the cap, expired windows are swept first and the
// oldest live ones dropped after that.
const MAX_KEYS = 10_000;

const buckets = new Map<string, Window>();

function sweep(now: number) {
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) buckets.delete(key);
  }
  while (buckets.size >= MAX_KEYS) {
    const oldest = buckets.keys().next().value;
    if (oldest === undefined) break;
    buckets.delete(oldest);
  }
}

/**
 * Count one request against `bucket` for `key` (usually the client IP).
 * Buckets are independent: a key can be within its chat limit and over its
 * photo limit at the same time.
 */
export function rateLimit(bucket: string, key: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  const id = `${bucket}:${key}`;
  let window = buckets.get(id);

  if (!window || window.resetAt <= now) {
    if (!window && buckets.size >= MAX_KEYS) sweep(now);
    window = { count: 0, resetAt: now + rule.windowMs };
    buckets.set(id, window);
  }

  window.count += 1;
  const retryAfter = Math.max(1, Math.ceil((window.resetAt - now) / 1000));
  return {
    ok: window.count <= rule.limit,
    remaining: Math.max(0, rule.limit - window.count),
    retryAfter,
  };
}

/** The 429 every route handler answers with once a limit is hit. */
export function tooManyRequests(result: RateLimitResult): Response {
  return Response.json(
    { error: "Too many requests. Please wait a moment and try again." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfter), "Cache-Control": "no-store" },
    },
  );
}
