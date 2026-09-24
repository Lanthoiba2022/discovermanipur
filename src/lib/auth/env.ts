/**
 * Auth environment resolution, safe on the server and in the browser.
 *
 * Nothing in here throws. The whole app must build and run with no Neon Auth
 * credentials present — when `isAuthConfigured` is false the auth layer falls
 * back to a clearly-labelled local demo session (see `./session-store`).
 *
 * The Neon Auth URL and cookie secret are server-only, so the browser cannot
 * read them to decide this for itself. `next.config.ts` derives the public
 * `NEXT_PUBLIC_AUTH_CONFIGURED` flag from them at build time instead: one
 * source of truth, and no secret in the bundle.
 */

export const isAuthConfigured: boolean = process.env.NEXT_PUBLIC_AUTH_CONFIGURED === "true";

/** Public site origin, used for magic-link redirects. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
