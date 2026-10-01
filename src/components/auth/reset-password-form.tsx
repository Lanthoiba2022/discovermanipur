"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  forgotPasswordSchema,
  requestPasswordReset,
  resetPasswordSchema,
  resetPasswordWithCode,
  type ForgotPasswordValues,
  type ResetPasswordValues,
} from "@/lib/auth";
import { safeRedirectPath } from "@/lib/security/redirect";

import { FieldError, PasswordInput } from "./fields";

/** Same countdown as the sign-in page's resend button. Neon Auth's rate limit is the real one. */
const RESEND_COOLDOWN_S = 30;

/** Where "Back to sign in" and a finished reset go, keeping `next`. */
function signInHref(next: string) {
  return next === "/account" ? "/auth" : `/auth?next=${encodeURIComponent(next)}`;
}

/**
 * Reset a forgotten password with a 6-digit code emailed through the Neon Auth
 * `send.otp` webhook (Brevo). Step one asks where to send it; step two takes
 * the code and the new password. Every message is worded so the form never
 * reveals whether an address has an account.
 */
export function ResetPasswordForm({ next: requestedNext }: { next: string }) {
  const router = useRouter();
  const next = safeRedirectPath(requestedNext);
  const [email, setEmail] = useState<string | null>(null);

  const emailForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onRequest = emailForm.handleSubmit(async ({ email: typed }) => {
    const { error } = await requestPasswordReset(typed);
    if (error) {
      emailForm.setError("email", { message: error });
      return;
    }
    setEmail(typed.trim());
  });

  if (email) {
    return (
      <CodeStep
        email={email}
        next={next}
        onDone={(href) => router.replace(href)}
        onChangeEmail={() => {
          emailForm.reset({ email });
          setEmail(null);
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-headline">Reset your password</h1>
      <p className="mt-3 text-muted-foreground">
        Enter the email address you signed up with. We will email you a 6-digit code to set a new
        password.
      </p>

      <form onSubmit={onRequest} noValidate className="mt-8 space-y-4">
        <div>
          <Label htmlFor="reset-email" className="mb-2 block">
            Email
          </Label>
          <Input
            id="reset-email"
            type="email"
            autoComplete="email"
            placeholder="you@gmail.com"
            aria-invalid={Boolean(emailForm.formState.errors.email)}
            {...emailForm.register("email")}
          />
          <FieldError message={emailForm.formState.errors.email?.message} />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={emailForm.formState.isSubmitting}>
          {emailForm.formState.isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Sending…
            </>
          ) : (
            "Send me a code"
          )}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href={signInHref(next)} className="font-medium text-primary underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

function CodeStep({
  email,
  next,
  onDone,
  onChangeEmail,
}: {
  email: string;
  next: string;
  onDone: (href: string) => void;
  onChangeEmail: () => void;
}) {
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otp: "", password: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(async ({ otp, password }) => {
    const result = await resetPasswordWithCode({ email, otp, password });
    if (!result.passwordChanged) {
      // Wrong or expired code, most often: stay here so they can fix it.
      form.setError("otp", { message: result.error ?? "That code could not be checked. Try again." });
      return;
    }
    if (result.needsVerification || result.error) {
      // The password changed, but signing in needs one more step.
      toast.success("Password changed", { description: "Sign in with your new password to continue." });
      onDone(signInHref(next));
      return;
    }
    toast.success("Password changed", { description: "You are signed in." });
    onDone(next);
  });

  const onResend = async () => {
    setResending(true);
    const { error } = await requestPasswordReset(email);
    setResending(false);
    if (error) {
      toast.error("Could not send a new code", { description: error });
      return;
    }
    form.resetField("otp");
    setCooldown(RESEND_COOLDOWN_S);
    toast.success("New code sent", { description: `If an account exists for ${email}, check your inbox.` });
  };

  const { errors, isSubmitting } = form.formState;

  return (
    <div className="w-full max-w-md">
      <h1 className="text-headline">Check your email</h1>
      <p className="mt-3 text-muted-foreground">Enter the code and choose a new password.</p>

      <div className="mt-8 flex items-start gap-3 rounded-[var(--radius)] border border-success/40 bg-success/10 p-4 text-sm">
        <MailCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
        <p>
          If an account exists for <span className="font-medium [overflow-wrap:anywhere]">{email}</span>, we have sent
          it a 6-digit code. It can take a minute to arrive. Check Spam or Promotions too.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <div>
          <Label htmlFor="reset-otp" className="mb-2 block">
            Code
          </Label>
          <Input
            id="reset-otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            className="text-center text-lg tracking-[0.4em]"
            aria-invalid={Boolean(errors.otp)}
            {...form.register("otp")}
          />
          <FieldError message={errors.otp?.message} />
        </div>

        <div>
          <Label htmlFor="reset-password" className="mb-2 block">
            New password
          </Label>
          <PasswordInput
            id="reset-password"
            autoComplete="new-password"
            invalid={Boolean(errors.password)}
            registration={form.register("password")}
          />
          <p className="mt-2 text-xs text-muted-foreground">At least 8 characters, with a letter and a number.</p>
          <FieldError message={errors.password?.message} />
        </div>

        <div>
          <Label htmlFor="reset-confirm" className="mb-2 block">
            Confirm new password
          </Label>
          <PasswordInput
            id="reset-confirm"
            autoComplete="new-password"
            invalid={Boolean(errors.confirmPassword)}
            registration={form.register("confirmPassword")}
          />
          <FieldError message={errors.confirmPassword?.message} />
        </div>

        <FieldError message={errors.root?.message} />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Saving…
            </>
          ) : (
            "Set new password"
          )}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <Button
            type="button"
            variant="link"
            className="px-0"
            onClick={onResend}
            disabled={cooldown > 0 || resending}
          >
            {resending ? "Sending…" : cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </Button>
          <Button type="button" variant="link" className="px-0" onClick={onChangeEmail}>
            Use a different email
          </Button>
        </div>
      </form>
    </div>
  );
}
