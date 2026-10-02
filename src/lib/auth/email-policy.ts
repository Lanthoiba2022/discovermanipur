/**
 * Who may create an account. Shared by the sign-up form (instant feedback) and
 * the Neon Auth `user.before_create` webhook (the actual gate), so the two can
 * never disagree.
 *
 * The webhook is what enforces this: it runs inside Neon Auth before the user
 * row is written, so a request sent straight to the Neon Auth URL (skipping
 * this app entirely) is still refused. The form check is only a courtesy.
 */

export const ALLOWED_SIGNUP_DOMAINS = ["gmail.com"] as const;

export const SIGNUP_DOMAIN_MESSAGE = "For now, only @gmail.com addresses can create an account.";

export function isAllowedSignupEmail(email: string): boolean {
  const at = email.trim().lastIndexOf("@");
  if (at < 1) return false;
  const domain = email.trim().slice(at + 1).toLowerCase();
  return (ALLOWED_SIGNUP_DOMAINS as readonly string[]).includes(domain);
}

/** Domains whose mailbox ignores dots and a `+tag` in the local part. */
const GMAIL_DOMAINS: readonly string[] = ["gmail.com", "googlemail.com"];

/**
 * The mailbox an address is delivered to, as one comparable string.
 *
 * Every address is trimmed and lowercased. For Gmail (and its old
 * `googlemail.com` alias, which is folded into `gmail.com`) the local part
 * also loses everything from the first `+` and every dot, because Gmail
 * delivers `A.B+trip@Gmail.com` and `ab@gmail.com` to the same inbox. Other
 * providers' rules differ, so their addresses are only lowercased.
 *
 * Used to key per-recipient limits, so a `+tag` or an extra dot cannot reset
 * them. It is NOT used to refuse sign-ups or to merge accounts: whether one
 * inbox may hold several accounts is an open product decision.
 */
export function canonicalEmail(email: string): string {
  const clean = email.trim().toLowerCase();
  const at = clean.lastIndexOf("@");
  if (at < 1) return clean;
  const domain = clean.slice(at + 1);
  if (!GMAIL_DOMAINS.includes(domain)) return clean;
  const local = clean.slice(0, at).split("+")[0].replaceAll(".", "");
  return `${local || clean.slice(0, at)}@gmail.com`;
}
