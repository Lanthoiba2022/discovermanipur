"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CircleAlert, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { DemoModeNotice } from "@/components/auth/demo-mode-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  isAuthConfigured,
  resendVerificationCode,
  signInSchema,
  signInWithPassword,
  signOut,
  signUpSchema,
  signUpWithPassword,
  useAuth,
  verifyEmailCode,
  verifyEmailSchema,
  type SignInValues,
  type SignUpValues,
  type VerifyEmailValues,
} from "@/lib/auth";
import { safeRedirectPath } from "@/lib/security/redirect";

import { FieldError, PasswordInput } from "./fields";

/** Who is mid-verification, and what we need to finish signing them in. */
interface PendingVerification {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  /** The first code could not be sent; shown on the code step. */
  sendError?: string;
  /** An unverified session cookie exists and must be signed out on cancel. */
  sessionCreated?: boolean;
}

const RESEND_COOLDOWN_S = 30;

function VerifyEmailStep({
  pending,
  onVerified,
  onCancel,
}: {
  pending: PendingVerification;
  onVerified: () => void;
  onCancel: () => void;
}) {
  // A failed first send can be retried straight away.
  const [cooldown, setCooldown] = useState(pending.sendError ? 0 : RESEND_COOLDOWN_S);
  const [sendError, setSendError] = useState(pending.sendError ?? null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const form = useForm<VerifyEmailValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { otp: "" },
  });

  const onSubmit = form.handleSubmit(async ({ otp }) => {
    const { error, signedIn } = await verifyEmailCode({
      email: pending.email,
      otp,
      firstName: pending.firstName,
      lastName: pending.lastName,
    });
    if (error) {
      form.setError("otp", { message: error });
      return;
    }
    if (!signedIn) {
      // Auto sign-in is off on this Neon Auth branch: finish with the password
      // they just typed instead of sending them back to the form.
      const result = await signInWithPassword({ email: pending.email, password: pending.password });
      if (result.error) {
        toast.success("Email verified", { description: "Sign in to continue." });
        onCancel();
        return;
      }
    }
    toast.success("Email verified. Welcome to Discover Manipur");
    onVerified();
  });

  const onResend = async () => {
    setResending(true);
    const { error } = await resendVerificationCode(pending.email);
    setResending(false);
    if (error) {
      setSendError(error);
      toast.error("Could not send a new code", { description: error });
      return;
    }
    setSendError(null);
    form.reset({ otp: "" });
    setCooldown(RESEND_COOLDOWN_S);
    toast.success("New code sent", { description: `Check ${pending.email}` });
  };

  return (
    <div className="mt-8">
      {sendError ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[var(--radius)] border border-destructive/40 bg-destructive/10 p-4 text-sm"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          <p>
            Your account for <span className="font-medium [overflow-wrap:anywhere]">{pending.email}</span> is
            ready, but the code could not be sent: {sendError} Use Resend code below to try again.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-[var(--radius)] border border-success/40 bg-success/10 p-4 text-sm">
          <MailCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          <p>
            We sent a 6-digit code to <span className="font-medium [overflow-wrap:anywhere]">{pending.email}</span>.
            It can take a minute to arrive. Check Spam or Promotions too.
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <div>
          <Label htmlFor="verify-otp" className="mb-2 block">
            Verification code
          </Label>
          <Input
            id="verify-otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            className="text-center text-lg tracking-[0.4em]"
            aria-invalid={Boolean(form.formState.errors.otp)}
            {...form.register("otp")}
          />
          <FieldError message={form.formState.errors.otp?.message} />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Verifying…
            </>
          ) : (
            "Verify email"
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
          <Button type="button" variant="link" className="px-0" onClick={onCancel}>
            Use a different email
          </Button>
        </div>
      </form>
    </div>
  );
}

export function AuthForm({ next: requestedNext }: { next: string }) {
  const router = useRouter();
  // The page already sanitises `next`; checked again because this component
  // is what actually navigates, whoever renders it.
  const next = safeRedirectPath(requestedNext);
  const { isAuthenticated, isLoading } = useAuth();
  const [tab, setTab] = useState("signin");
  const [pending, setPending] = useState<PendingVerification | null>(null);
  // While a submit runs or the code step shows, a signed-in store must not
  // send the visitor away: they still have a code to enter.
  const submitting = useRef(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !pending && !submitting.current) router.replace(next);
  }, [isLoading, isAuthenticated, pending, next, router]);

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSignIn(event: FormEvent<HTMLFormElement>) {
    submitting.current = true;
    try {
      await signInForm.handleSubmit(signIn)(event);
    } finally {
      submitting.current = false;
    }
  }

  async function signIn(values: SignInValues) {
    const { error, needsVerification, sendError, sessionCreated } = await signInWithPassword(values);
    if (error) {
      toast.error("Could not sign you in", { description: error });
      signInForm.setError("password", { message: error });
      return;
    }
    if (needsVerification) {
      setPending({ email: values.email.trim(), password: values.password, sendError, sessionCreated });
      return;
    }
    toast.success("Welcome back");
    router.replace(next);
  }

  async function onSignUp(event: FormEvent<HTMLFormElement>) {
    submitting.current = true;
    try {
      await signUpForm.handleSubmit(signUp)(event);
    } finally {
      submitting.current = false;
    }
  }

  async function signUp(values: SignUpValues) {
    const { error, needsVerification, sendError, sessionCreated } = await signUpWithPassword({
      email: values.email,
      password: values.password,
      firstName: values.firstName,
      lastName: values.lastName || undefined,
    });
    if (error) {
      toast.error("Could not create that account", { description: error });
      signUpForm.setError("email", { message: error });
      return;
    }
    if (needsVerification) {
      setPending({
        email: values.email.trim(),
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName || undefined,
        sendError,
        sessionCreated,
      });
      return;
    }
    toast.success("Your Discover Manipur account is ready");
    router.replace(next);
  }

  const busy = signInForm.formState.isSubmitting || signUpForm.formState.isSubmitting;

  if (pending) {
    return (
      <div className="w-full max-w-md">
        <h1 className="text-headline">Check your email</h1>
        <p className="mt-3 text-muted-foreground">
          One last step: enter the code we emailed you to verify your address.
        </p>
        <VerifyEmailStep
          pending={pending}
          onVerified={() => router.replace(next)}
          onCancel={async () => {
            // A half-made session for the unverified address must not linger.
            if (pending.sessionCreated) await signOut();
            signInForm.setValue("email", pending.email);
            setTab("signin");
            setPending(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-headline">Welcome to Discover Manipur</h1>
      <p className="mt-3 text-muted-foreground">
        One account for your stays, your saved places and the itineraries you build with our
        concierge.
      </p>

      {!isAuthConfigured && <DemoModeNotice className="mt-6" />}

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Create account</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <form onSubmit={onSignIn} noValidate className="space-y-4">
            <div>
              <Label htmlFor="signin-email" className="mb-2 block">
                Email
              </Label>
              <Input
                id="signin-email"
                type="email"
                autoComplete="email"
                placeholder="you@gmail.com"
                aria-invalid={Boolean(signInForm.formState.errors.email)}
                {...signInForm.register("email")}
              />
              <FieldError message={signInForm.formState.errors.email?.message} />
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <Label htmlFor="signin-password">Password</Label>
                <Link
                  href={next === "/account" ? "/auth/reset" : `/auth/reset?next=${encodeURIComponent(next)}`}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <PasswordInput
                id="signin-password"
                autoComplete="current-password"
                invalid={Boolean(signInForm.formState.errors.password)}
                registration={signInForm.register("password")}
              />
              <FieldError message={signInForm.formState.errors.password?.message} />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {signInForm.formState.isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={onSignUp} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="signup-first" className="mb-2 block">
                  First name
                </Label>
                <Input
                  id="signup-first"
                  autoComplete="given-name"
                  placeholder="Thoibi"
                  aria-invalid={Boolean(signUpForm.formState.errors.firstName)}
                  {...signUpForm.register("firstName")}
                />
                <FieldError message={signUpForm.formState.errors.firstName?.message} />
              </div>
              <div>
                <Label htmlFor="signup-last" className="mb-2 block">
                  Last name <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="signup-last"
                  autoComplete="family-name"
                  placeholder="Devi"
                  {...signUpForm.register("lastName")}
                />
                <FieldError message={signUpForm.formState.errors.lastName?.message} />
              </div>
            </div>

            <div>
              <Label htmlFor="signup-email" className="mb-2 block">
                Email
              </Label>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="you@gmail.com"
                aria-invalid={Boolean(signUpForm.formState.errors.email)}
                aria-describedby="signup-email-hint"
                {...signUpForm.register("email")}
              />
              <p id="signup-email-hint" className="mt-2 text-xs text-muted-foreground">
                Only @gmail.com addresses for now. We&rsquo;ll email you a code to verify it.
              </p>
              <FieldError message={signUpForm.formState.errors.email?.message} />
            </div>

            <div>
              <Label htmlFor="signup-password" className="mb-2 block">
                Password
              </Label>
              <PasswordInput
                id="signup-password"
                autoComplete="new-password"
                invalid={Boolean(signUpForm.formState.errors.password)}
                registration={signUpForm.register("password")}
              />
              <FieldError message={signUpForm.formState.errors.password?.message} />
            </div>

            <div>
              <Label htmlFor="signup-confirm" className="mb-2 block">
                Confirm password
              </Label>
              <PasswordInput
                id="signup-confirm"
                autoComplete="new-password"
                invalid={Boolean(signUpForm.formState.errors.confirmPassword)}
                registration={signUpForm.register("confirmPassword")}
              />
              <FieldError message={signUpForm.formState.errors.confirmPassword?.message} />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {signUpForm.formState.isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Creating account…
                </>
              ) : (
                "Create my account"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By continuing you agree to Discover Manipur&rsquo;s terms and privacy policy.
            </p>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
