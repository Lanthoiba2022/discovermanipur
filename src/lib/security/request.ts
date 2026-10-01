/**
 * Request helpers shared by the route handlers and Server Actions. Pure Web
 * APIs, so they work on the Node and Edge runtimes alike.
 */

/**
 * The client's IP, for rate-limit keys only, never for authorisation.
 *
 * On Vercel, `x-real-ip` and `x-forwarded-for` are set by the platform from
 * the TCP connection and a client cannot spoof them. Self-hosted, they are
 * only as trustworthy as the reverse proxy in front of the app: it must
 * overwrite (not append to) both, or a client can pick its own rate-limit key.
 */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

/**
 * False when a browser tells us the request came from another site.
 *
 * Route handlers do not get the Origin check Next.js gives Server Actions, so
 * any handler that does work on a visitor's behalf calls this. A request with
 * neither header is not from a modern browser (curl, a server) and is let
 * through: this guards visitors' browsers against other sites, it is not
 * authentication.
 */
export function isSameOrigin(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true;

  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    new URL(request.url).host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Read a request body as text, refusing anything over `maxBytes`. Returns
 * `null` when the body is too large, so the caller can answer 413 without
 * having buffered all of it: the declared length is checked first and the
 * stream is cut off as soon as it passes the cap.
 */
export async function readBodyText(request: Request, maxBytes: number): Promise<string | null> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

/** A JSON error a client can show, with no detail about why it failed inside. */
export function jsonError(status: number, error: string, headers?: Record<string, string>): Response {
  return Response.json(
    { error },
    { status, headers: { "Cache-Control": "no-store", ...headers } },
  );
}
