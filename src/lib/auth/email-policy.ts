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
