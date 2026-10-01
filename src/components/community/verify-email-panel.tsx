"use client";

import { Loader2, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resendVerificationCode, verifyEmailCode, verifyEmailSchema } from "@/lib/auth";

/** Same countdown as the sign-in page's resend button. Client-side only; Neon Auth's rate limit is the real one. */
const RESEND_COOLDOWN_S = 30;

/**
 * Verify the signed-in person's email address where they are, instead of
 * sending them away to sign out and in again. The code is emailed through the
 * same Neon Auth webhook as at sign-up; once it is accepted the page re-reads
 * the session, so the form or the voting queue it was guarding appears.
 */
export function VerifyEmailPanel({ email }: { email: string }) {
  const router = useRouter();
  const codeId = useId();
  const hintId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  // Stays true once the code is accepted, so the form cannot be used again
  // while the page refreshes into whatever it was guarding.
  const [verified, setVerified] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function send() {
    setSendError(null);
    setCodeError(null);
    startTransition(async () => {
      const result = await resendVerificationCode(email);
      if (result.error) {
        setSendError(result.error);
      } else {
        setSent(true);
        setCode("");
        setCooldown(RESEND_COOLDOWN_S);
        toast.success("Code sent", { description: `Check ${email}` });
      }
      // The button that was pressed is now disabled; keep focus somewhere useful.
      requestAnimationFrame(() => inputRef.current?.focus());
    });
  }

  function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = verifyEmailSchema.safeParse({ otp: code });
    if (!parsed.success) {
      setCodeError(parsed.error.issues[0]?.message ?? "Enter the 6-digit code from the email.");
      inputRef.current?.focus();
      return;
    }
    setCodeError(null);
    startTransition(async () => {
      const result = await verifyEmailCode({ email, otp: parsed.data.otp });
      if (result.error) {
        setCodeError(result.error);
        inputRef.current?.focus();
        return;
      }
      setVerified(true);
      toast.success("Email verified");
      router.refresh();
    });
  }

  const address = <strong className="font-medium text-foreground [overflow-wrap:anywhere]">{email}</strong>;

  if (!sent) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground">The code goes to {address}.</p>
        <Button type="button" onClick={send} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <MailCheck aria-hidden="true" />}
          Send me a code
        </Button>
        {sendError && (
          <p role="alert" className="text-sm text-destructive">
            {sendError}
          </p>
        )}
      </div>
    );
  }

  const busy = pending || verified;

  return (
    <form onSubmit={verify} className="mx-auto flex w-full max-w-xs flex-col gap-3 text-left" noValidate>
      <div>
        <Label htmlFor={codeId}>6-digit code</Label>
        <p id={hintId} className="mt-1 text-sm text-muted-foreground">
          Sent to {address}. It can take a minute; check Spam or Promotions too. A new code replaces the last one.
        </p>
        <Input
          ref={inputRef}
          id={codeId}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
            if (codeError) setCodeError(null);
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          disabled={verified}
          aria-invalid={Boolean(codeError)}
          aria-describedby={codeError ? `${hintId} ${errorId}` : hintId}
          className="mt-2 tracking-[0.3em]"
          autoFocus
        />
        {codeError && (
          <p id={errorId} role="alert" className="mt-1.5 text-sm text-destructive">
            {codeError}
          </p>
        )}
      </div>
      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
        {verified ? "Verified" : "Verify my email"}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={send} disabled={busy || cooldown > 0}>
        {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
      </Button>
      {sendError && (
        <p role="alert" className="text-sm text-destructive">
          {sendError}
        </p>
      )}
    </form>
  );
}
