"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { CircleAlert, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
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

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
      <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

function PasswordInput({
  id,
  autoComplete,
  invalid,
  registration,
}: {
  id: string;
  autoComplete: string;
  invalid: boolean;
  registration: UseFormRegisterReturn;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder="••••••••"
        aria-invalid={invalid}
        className="pr-11"
        {...registration}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

/** Who is mid-verification, and what we need to finish signing them in. */
interface PendingVerification {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
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
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
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
      toast.error("Could not send a new code", { description: error });
      return;
    }
    form.reset({ otp: "" });
    setCooldown(RESEND_COOLDOWN_S);
    toast.success("New code sent", { description: `Check ${pending.email}` });
  };

  return (
    <div className="mt-8">
      <div className="flex items-start gap-3 rounded-[var(--radius)] border border-success/40 bg-success/10 p-4 text-sm">
        <MailCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
        <p>
          We sent a 6-digit code to <span className="font-medium">{pending.email}</span>. It can
          take a minute to arrive. Check Spam or Promotions too.
        </p>
      </div>

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

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace(next);
  }, [isLoading, isAuthenticated, next, router]);

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSignIn = signInForm.handleSubmit(async (values) => {
    const { error, needsVerification } = await signInWithPassword(values);
    if (error) {
      toast.error("Could not sign you in", { description: error });
      signInForm.setError("password", { message: error });
      return;
    }
    if (needsVerification) {
      setPending({ email: values.email.trim(), password: values.password });
      return;
    }
    toast.success("Welcome back");
    router.replace(next);
  });

  const onSignUp = signUpForm.handleSubmit(async (values) => {
    const { error, needsVerification } = await signUpWithPassword({
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
      });
      return;
    }
    toast.success("Your Discover Manipur account is ready");
    router.replace(next);
  });

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
          onCancel={() => {
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
              <Label htmlFor="signin-password" className="mb-2 block">
                Password
              </Label>
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
