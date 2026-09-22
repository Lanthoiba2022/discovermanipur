"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { CircleAlert, Eye, EyeOff, Loader2, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { DemoModeNotice } from "@/components/auth/demo-mode-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  isSupabaseConfigured,
  magicLinkSchema,
  signInSchema,
  signInWithMagicLink,
  signInWithPassword,
  signUpSchema,
  signUpWithPassword,
  useAuth,
  type MagicLinkValues,
  type SignInValues,
  type SignUpValues,
} from "@/lib/auth";

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

export function AuthForm({ next }: { next: string }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [tab, setTab] = useState("signin");
  const [magic, setMagic] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

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

  const magicForm = useForm<MagicLinkValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: "" },
  });

  const onSignIn = signInForm.handleSubmit(async (values) => {
    const { error } = await signInWithPassword(values);
    if (error) {
      toast.error("Could not sign you in", { description: error });
      signInForm.setError("password", { message: error });
      return;
    }
    toast.success("Welcome back");
    router.replace(next);
  });

  const onSignUp = signUpForm.handleSubmit(async (values) => {
    const { error, pending } = await signUpWithPassword({
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
    if (pending) {
      setSent(values.email);
      toast.success("Check your inbox to confirm your email");
      setTab("signin");
      return;
    }
    toast.success("Your Manipur Tourism account is ready");
    router.replace(next);
  });

  const onMagicLink = magicForm.handleSubmit(async (values) => {
    const { error, pending } = await signInWithMagicLink({ email: values.email, next });
    if (error) {
      toast.error("Could not send that link", { description: error });
      magicForm.setError("email", { message: error });
      return;
    }
    if (pending) {
      setSent(values.email);
      toast.success("Magic link sent", { description: `Check ${values.email}` });
      return;
    }
    toast.success("Signed in");
    router.replace(next);
  });

  const busy =
    signInForm.formState.isSubmitting ||
    signUpForm.formState.isSubmitting ||
    magicForm.formState.isSubmitting;

  return (
    <div className="w-full max-w-md">
      <h1 className="text-headline">Welcome to Manipur Tourism</h1>
      <p className="mt-3 text-muted-foreground">
        One account for your stays, your saved places and the itineraries you build with our
        concierge.
      </p>

      {!isSupabaseConfigured && <DemoModeNotice className="mt-6" />}

      {sent && (
        <div
          role="status"
          className="mt-6 rounded-[var(--radius)] border border-success/40 bg-success/10 p-4 text-sm"
        >
          We emailed <span className="font-medium">{sent}</span>. Open the link on this device to
          finish signing in.
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Create account</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          {magic ? (
            <form onSubmit={onMagicLink} noValidate className="space-y-4">
              <div>
                <Label htmlFor="magic-email" className="mb-2 block">
                  Email
                </Label>
                <Input
                  id="magic-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(magicForm.formState.errors.email)}
                  {...magicForm.register("email")}
                />
                <FieldError message={magicForm.formState.errors.email?.message} />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {magicForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Sending link…
                  </>
                ) : (
                  <>
                    <Sparkles aria-hidden="true" /> Email me a magic link
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="link"
                className="mx-auto block"
                onClick={() => setMagic(false)}
              >
                Use a password instead
              </Button>
            </form>
          ) : (
            <form onSubmit={onSignIn} noValidate className="space-y-4">
              <div>
                <Label htmlFor="signin-email" className="mb-2 block">
                  Email
                </Label>
                <Input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
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

              <Button
                type="button"
                variant="link"
                className="mx-auto block"
                onClick={() => setMagic(true)}
              >
                <Mail aria-hidden="true" /> Email me a magic link instead
              </Button>
            </form>
          )}
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
                placeholder="you@example.com"
                aria-invalid={Boolean(signUpForm.formState.errors.email)}
                {...signUpForm.register("email")}
              />
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
              By continuing you agree to Manipur Tourism&rsquo;s terms and privacy policy.
            </p>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
