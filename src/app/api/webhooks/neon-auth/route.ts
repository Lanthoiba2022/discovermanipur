import { isAllowedSignupEmail, SIGNUP_DOMAIN_MESSAGE } from "@/lib/auth/email-policy";
import { MAX_AGE_MS, verifyNeonAuthWebhook } from "@/lib/auth/webhook";
import { sendEmail } from "@/lib/email/brevo";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { clientIp, jsonError, readBodyText } from "@/lib/security/request";

/**
 * Neon Auth webhook. Subscribed events (Console → Auth → Configuration →
 * Webhooks, URL `https://<site>/api/webhooks/neon-auth`):
 *
 * - `user.before_create` (blocking): refuses any signup that is not an
 *   allowed domain. Runs inside Neon Auth before the user row is written, so
 *   it also stops signups sent straight to the Neon Auth URL. FAIL-CLOSED: if
 *   this endpoint is down or answers badly, every signup is refused.
 * - `send.otp` (blocking): Neon Auth hands us the code instead of mailing it
 *   itself; we deliver it through Brevo. If delivery fails we answer 5xx, Neon
 *   retries, and after that the user sees an error rather than waiting for an
 *   email that will never come.
 *
 * Everything else is acknowledged and ignored.
 *
 * Nothing acts on a payload before its signature has been verified. Before
 * that, the only work done is a per-IP rate limit and a body-size cap, so a
 * flood of forged requests costs little.
 */

// Signature checks need Node's crypto, and nothing here may be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Real events are a few KB at most. */
const MAX_BODY_BYTES = 64 * 1024;

/**
 * Neon retries a blocking event with the same id when a response is lost,
 * and a captured signed request could be replayed inside the timestamp
 * window. Remembering delivered ids for longer than that window keeps either
 * from emailing a second code. Per instance only: a duplicate that lands on
 * another instance may still resend, which costs a duplicate email, not a
 * failure.
 */
const delivered = new Map<string, number>();
const DELIVERED_TTL_MS = 2 * MAX_AGE_MS;

function alreadyDelivered(id: string) {
  const at = delivered.get(id);
  return at !== undefined && Date.now() - at < DELIVERED_TTL_MS;
}

function remember(id: string) {
  const now = Date.now();
  delivered.set(id, now);
  for (const [key, at] of delivered) {
    if (now - at < DELIVERED_TTL_MS && delivered.size <= 2_000) break;
    delivered.delete(key);
  }
}

/**
 * Codes emailed to one address. Neon Auth triggers `send.otp` for any address
 * typed into the form, so without this anyone could use the site to flood a
 * stranger's inbox (and spend the Brevo quota). Keyed by recipient, so it
 * holds however many IPs the requests come from.
 */
const OTP_PER_RECIPIENT = { limit: 5, windowMs: 15 * 60_000 };
/** Neon's own servers call this; the cap only stops a forged-request flood. */
const RATE = { limit: 120, windowMs: 60_000 };

const PURPOSE: Record<string, { subject: string; lead: string }> = {
  "email-verification": {
    subject: "Your Discover Manipur verification code",
    lead: "Enter this code to verify your email address and finish creating your account.",
  },
  "sign-in": {
    subject: "Your Discover Manipur sign-in code",
    lead: "Enter this code to sign in to your account.",
  },
  "forget-password": {
    subject: "Your Discover Manipur password reset code",
    lead: "Enter this code to reset your password.",
  },
};

const DISCORD_URL = "https://discord.gg/hgGfm6UpU";

function otpEmail(code: string, otpType: string, expiresAt?: string) {
  const { subject, lead } = Object.hasOwn(PURPOSE, otpType)
    ? PURPOSE[otpType]
    : PURPOSE["email-verification"];
  const minutes = expiresAt
    ? Math.max(1, Math.round((new Date(expiresAt).getTime() - Date.now()) / 60_000))
    : null;
  const expiry = minutes ? `This code expires in ${minutes} minute${minutes === 1 ? "" : "s"}.` : "";
  const notice = `${expiry} Do not share it with anyone.`.trim();
  const ignore = "If you did not request this code, you can safely ignore this email.";
  const automated = "This is an automated message. Please do not reply. For help, contact us on Discord:";
  return {
    subject,
    text: `${lead}\n\n${code}\n\n${notice}\n${ignore}\n\n${automated} ${DISCORD_URL}`,
    html: `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f4ef;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f1d1a">
  <div style="max-width:440px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px">
    <p style="margin:0 0 8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#7a7369">Discover Manipur</p>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.5">${lead}</p>
    <p style="margin:0 0 24px;font-size:34px;font-weight:700;letter-spacing:.3em;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${code}</p>
    <p style="margin:0;font-size:14px;line-height:1.5;color:#7a7369">${notice} ${ignore}</p>
    <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #ece8e1;font-size:12px;line-height:1.5;color:#7a7369">${automated} <a href="${DISCORD_URL}" style="color:#7a7369">${DISCORD_URL.replace("https://", "")}</a></p>
  </div>
</body></html>`,
  };
}

export async function POST(request: Request) {
  const verdict = rateLimit("neon-auth-webhook", clientIp(request.headers), RATE);
  if (!verdict.ok) return tooManyRequests(verdict);

  const raw = await readBodyText(request, MAX_BODY_BYTES);
  if (raw === null) return jsonError(413, "payload too large");

  let event;
  try {
    event = await verifyNeonAuthWebhook(raw, request.headers);
  } catch (err) {
    console.warn("[neon-auth webhook] rejected:", (err as Error).message);
    return jsonError(401, "invalid signature");
  }

  switch (event.event_type) {
    case "user.before_create": {
      const email = event.user?.email ?? "";
      if (isAllowedSignupEmail(email)) return Response.json({ allowed: true });
      return Response.json({
        allowed: false,
        error_message: SIGNUP_DOMAIN_MESSAGE,
        error_code: "EMAIL_DOMAIN_NOT_ALLOWED",
      });
    }

    case "send.otp": {
      const data = event.event_data ?? {};
      // Phone OTP also arrives as send.otp; this app does not use it.
      if (data.delivery_preference === "sms") return new Response(null, { status: 204 });

      if (alreadyDelivered(event.event_id)) return new Response(null, { status: 204 });

      const to = event.user?.email;
      const code = typeof data.otp_code === "string" ? data.otp_code : "";
      if (!to || !/^\d{4,10}$/.test(code)) {
        console.error("[neon-auth webhook] send.otp without an email or code", event.event_id);
        return jsonError(400, "malformed event");
      }

      const perRecipient = rateLimit("otp-recipient", to.trim().toLowerCase(), OTP_PER_RECIPIENT);
      if (!perRecipient.ok) {
        console.warn("[neon-auth webhook] OTP rate limit hit for a recipient", event.event_id);
        return tooManyRequests(perRecipient);
      }

      try {
        const mail = otpEmail(
          code,
          String(data.otp_type ?? "email-verification"),
          typeof data.expires_at === "string" ? data.expires_at : undefined,
        );
        await sendEmail({ to, ...mail });
        remember(event.event_id);
        return new Response(null, { status: 204 });
      } catch (err) {
        // 5xx so Neon retries; never log the code itself.
        console.error("[neon-auth webhook] OTP delivery failed:", (err as Error).message);
        return jsonError(502, "delivery failed");
      }
    }

    default:
      return new Response(null, { status: 204 });
  }
}
