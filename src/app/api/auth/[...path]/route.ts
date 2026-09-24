import { auth } from "@/lib/auth/server";

/**
 * Same-origin proxy to Neon Auth. The browser client in `@/lib/auth/client`
 * talks only to this route; it forwards to `NEON_AUTH_BASE_URL` and sets the
 * session cookies on this origin.
 *
 * Without Neon Auth configured there is nothing to proxy to — the demo session
 * lives in the browser — so every method answers 404.
 */
const notConfigured = () =>
  Response.json({ error: "Authentication is not configured" }, { status: 404 });

const handlers = auth?.handler();

export const GET = handlers?.GET ?? notConfigured;
export const POST = handlers?.POST ?? notConfigured;
export const PUT = handlers?.PUT ?? notConfigured;
export const DELETE = handlers?.DELETE ?? notConfigured;
export const PATCH = handlers?.PATCH ?? notConfigured;
