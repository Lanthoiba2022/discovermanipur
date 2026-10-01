/**
 * Auth environment resolution, safe on the server and in the browser.
 *
 * Nothing in here throws. The whole app must build and run with no Neon Auth
 * credentials present — when `isAuthConfigured` is false the auth layer falls
 * back to a clearly-labelled local-development session (see `./session-store`)
 * in development, and to no sign-in at all in a production build.
 *
 * The Neon Auth URL and cookie secret are server-only, so the browser cannot
 * read them to decide this for itself. `next.config.ts` derives the public
 * `NEXT_PUBLIC_AUTH_CONFIGURED` flag from them at build time instead: one
 * source of truth, and no secret in the bundle.
 */

export const isAuthConfigured: boolean = process.env.NEXT_PUBLIC_AUTH_CONFIGURED === "true";

/**
 * Browser-only local accounts, for running the app in development without Neon
 * Auth.
 * They keep passwords in `localStorage`, so a production build never offers
 * them: a deploy that is missing its auth variables gets sign-in switched off,
 * not a fake account system that looks real.
 */
export const isDemoAuth: boolean = !isAuthConfigured && process.env.NODE_ENV !== "production";
