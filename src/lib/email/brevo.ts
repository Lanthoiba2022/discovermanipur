/**
 * Transactional email through Brevo's HTTP API. Server-only: it reads
 * `BREVO_API_KEY`, which must never reach the browser.
 *
 * Brevo only sends from a sender (or domain) verified in the Brevo dashboard,
 * so `BREVO_SENDER_EMAIL` must be one of those. A Gmail sender, for example,
 * is refused or lands in spam. https://developers.brevo.com/reference/sendtransacemail
 */

const API_URL = "https://api.brevo.com/v3/smtp/email";

function config() {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || "Discover Manipur";
  if (!apiKey || !senderEmail) return null;
  return { apiKey, senderEmail, senderName };
}

export const isBrevoConfigured = () => config() !== null;

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Where replies go. The sender stays our verified address either way. */
  replyTo?: { email: string; name?: string };
}

/** Send one email. Throws on any failure so the caller can fail the flow. */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const cfg = config();
  if (!cfg) throw new Error("Brevo is not configured (BREVO_API_KEY, BREVO_SENDER_EMAIL)");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "api-key": cfg.apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: cfg.senderName, email: cfg.senderEmail },
      to: [{ email: message.to }],
      // Header values: a CR/LF here must never reach a mail header.
      subject: message.subject.replace(/[\r\n]+/g, " "),
      htmlContent: message.html,
      textContent: message.text,
      ...(message.replyTo ? { replyTo: message.replyTo } : {}),
    }),
    // Neon gives the OTP webhook 15 seconds across retries; never let one
    // slow Brevo call eat the budget.
    signal: AbortSignal.timeout(4_000),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`Brevo answered ${res.status}: ${detail}`);
  }
}
