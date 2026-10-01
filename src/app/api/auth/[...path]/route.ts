import { auth } from "@/lib/auth/server";
import { rateLimit, tooManyRequests, type RateLimitRule } from "@/lib/security/rate-limit";
import { clientIp, jsonError, readBodyText } from "@/lib/security/request";

/**
 * Same-origin proxy to Neon Auth. The browser client in `@/lib/auth/client`
 * talks only to this route; it forwards to `NEON_AUTH_BASE_URL` and sets the
 * session cookies on this origin.
 *
 * Rate-limited here, per client IP, because the proxy does not forward the
 * visitor's IP upstream: to Neon Auth every request looks like it comes from
 * this server, so its own per-IP limits cannot tell one attacker from all
 * users. The tight bucket covers what costs money or guesses secrets —
 * password attempts, sign-ups and anything that emails a code.
 *
 * Without Neon Auth configured there is nothing to proxy to — the local
 * development session lives in the browser — so every method answers 404.
 */

type Context = { params: Promise<{ path: string[] }> };
type Handler = (request: Request, context: Context) => Promise<Response>;

/** Sign-in, sign-up, OTP send/verify, password reset. */
const SENSITIVE = /^(sign-in|sign-up|email-otp|forget-password|reset-password|send-verification-email|verify-email|change-password|change-email)(\/|$)/;

const RATE_SENSITIVE: RateLimitRule = { limit: 15, windowMs: 10 * 60_000 };
/** Session reads happen on every focus and navigation; this only stops floods. */
const RATE_ANY: RateLimitRule = { limit: 300, windowMs: 60_000 };

/** Auth payloads are a few hundred bytes; nothing legitimate comes close. */
const MAX_BODY_BYTES = 16 * 1024;

const notConfigured = () => jsonError(404, "Authentication is not configured");

function guarded(handler: Handler): Handler {
  return async (request, context) => {
    const ip = clientIp(request.headers);
    const any = rateLimit("auth", ip, RATE_ANY);
    if (!any.ok) return tooManyRequests(any);

    if (request.method === "GET" || request.method === "HEAD") return handler(request, context);

    const path = (await context.params).path.join("/");
    if (SENSITIVE.test(path)) {
      const verdict = rateLimit("auth-sensitive", ip, RATE_SENSITIVE);
      if (!verdict.ok) return tooManyRequests(verdict);
    }

    // Buffered here, under a cap, because the upstream proxy reads the whole
    // body with no limit of its own.
    const body = await readBodyText(request, MAX_BODY_BYTES);
    if (body === null) return jsonError(413, "Request too large.");
    const capped = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: body === "" ? undefined : body,
      signal: request.signal,
    });
    return handler(capped, context);
  };
}

const handlers = auth?.handler();

export const GET = handlers ? guarded(handlers.GET) : notConfigured;
export const POST = handlers ? guarded(handlers.POST) : notConfigured;
export const PUT = handlers ? guarded(handlers.PUT) : notConfigured;
export const DELETE = handlers ? guarded(handlers.DELETE) : notConfigured;
export const PATCH = handlers ? guarded(handlers.PATCH) : notConfigured;
