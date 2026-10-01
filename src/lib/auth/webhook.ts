import { createPublicKey, verify, type JsonWebKey, type KeyObject } from "node:crypto";

/**
 * Verify a Neon Auth webhook: EdDSA (Ed25519) detached JWS over
 * `timestamp.base64url(rawBody)`, keyed by `X-Neon-Signature-Kid` against the
 * branch's JWKS. https://neon.com/docs/auth/guides/webhooks#signature-verification
 *
 * Returns the parsed payload, or throws. Never act on a payload this rejects:
 * the endpoint is public, and an unverified `user.before_create` is exactly
 * how someone would try to wave a blocked signup through.
 */

export interface NeonAuthWebhook {
  event_id: string;
  event_type: string;
  timestamp: string;
  user?: { id?: string; email?: string; name?: string; email_verified?: boolean };
  event_data?: Record<string, unknown>;
}

/** Signed events older (or further in the future) than this are refused. */
export const MAX_AGE_MS = 5 * 60 * 1000;
const JWKS_TTL_MS = 60 * 60 * 1000;
/**
 * An unknown `kid` forces a JWKS refetch, and the `kid` is attacker-chosen on
 * an unauthenticated endpoint. Without a floor, every forged request would
 * cost an outbound fetch.
 */
const JWKS_MIN_REFRESH_MS = 60 * 1000;

let jwks: { keys: Map<string, KeyObject>; fetchedAt: number } | null = null;

async function loadJwks(force = false) {
  const age = jwks ? Date.now() - jwks.fetchedAt : Infinity;
  if (jwks && (age < JWKS_MIN_REFRESH_MS || (!force && age < JWKS_TTL_MS))) return jwks.keys;
  const base = process.env.NEON_AUTH_BASE_URL?.trim();
  if (!base) throw new Error("NEON_AUTH_BASE_URL is not set");
  const res = await fetch(`${base}/.well-known/jwks.json`, {
    cache: "no-store",
    signal: AbortSignal.timeout(4_000),
  });
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
  const body = (await res.json()) as { keys?: (JsonWebKey & { kid?: string })[] };
  const keys = new Map<string, KeyObject>();
  for (const jwk of body.keys ?? []) {
    if (!jwk.kid) continue;
    const key = createPublicKey({ key: jwk, format: "jwk" });
    // `verify(null, …)` picks the algorithm from the key type, so only accept
    // the Ed25519 keys Neon signs with.
    if (key.asymmetricKeyType === "ed25519") keys.set(jwk.kid, key);
  }
  jwks = { keys, fetchedAt: Date.now() };
  return keys;
}

async function keyFor(kid: string) {
  const key = (await loadJwks()).get(kid);
  if (key) return key;
  // Unknown kid: the key may have rotated since we cached. Refresh once.
  const refreshed = (await loadJwks(true)).get(kid);
  if (!refreshed) throw new Error(`unknown signing key ${kid}`);
  return refreshed;
}

export async function verifyNeonAuthWebhook(
  rawBody: string,
  headers: Headers,
): Promise<NeonAuthWebhook> {
  const signature = headers.get("x-neon-signature");
  const kid = headers.get("x-neon-signature-kid");
  const timestamp = headers.get("x-neon-timestamp");
  if (!signature || !kid || !timestamp) throw new Error("missing signature headers");

  const ageMs = Date.now() - Number(timestamp);
  if (!Number.isFinite(ageMs) || Math.abs(ageMs) > MAX_AGE_MS) {
    throw new Error("stale or invalid timestamp");
  }

  const [headerB64, detached, signatureB64] = signature.split(".");
  if (!headerB64 || detached !== "" || !signatureB64) throw new Error("not a detached JWS");

  let alg: unknown;
  try {
    alg = (JSON.parse(Buffer.from(headerB64, "base64url").toString("utf8")) as { alg?: unknown }).alg;
  } catch {
    throw new Error("unreadable JWS header");
  }
  // "Ed25519" is the RFC 9864 name for the same algorithm.
  if (alg !== "EdDSA" && alg !== "Ed25519") throw new Error("unexpected JWS algorithm");

  const payloadB64 = Buffer.from(rawBody, "utf8").toString("base64url");
  const signedB64 = Buffer.from(`${timestamp}.${payloadB64}`, "utf8").toString("base64url");
  const valid = verify(
    null,
    Buffer.from(`${headerB64}.${signedB64}`),
    await keyFor(kid),
    Buffer.from(signatureB64, "base64url"),
  );
  if (!valid) throw new Error("bad signature");

  return JSON.parse(rawBody) as NeonAuthWebhook;
}
