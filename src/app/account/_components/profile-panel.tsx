"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CircleAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { DemoModeNotice } from "@/components/auth/demo-mode-notice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAuthConfigured } from "@/lib/auth/env";
import { updateProfile } from "@/lib/auth/actions";
import { profileSchema, type ProfileValues } from "@/lib/auth/schemas";
import { useAuth } from "@/lib/auth/use-auth";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
      <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

export function ProfilePanel() {
  const { user, initials } = useAuth();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    // Filled from the start (AuthGuard renders this only once a user is
    // known), so a client navigation never shows a frame of empty fields; the
    // effect below still follows later changes to the user.
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phone: user?.phone ?? "",
      avatarUrl: user?.avatarUrl ?? "",
    },
  });

  useEffect(() => {
    if (!user) return;
    form.reset({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
      avatarUrl: user.avatarUrl ?? "",
    });
  }, [user, form]);

  const avatarPreview = form.watch("avatarUrl");

  const onSubmit = form.handleSubmit(async (values) => {
    const { error } = await updateProfile(values);
    if (error) {
      toast.error("Could not save your profile", { description: error });
      return;
    }
    toast.success("Profile updated");
  });

  return (
    <section aria-labelledby="profile-heading" className="max-w-2xl">
      <h2 id="profile-heading" className="font-display text-2xl">
        Your profile
      </h2>
      <p className="mt-2 text-muted-foreground">
        Hosts see your name when you request a stay. Your phone number is shared only after a
        booking is confirmed.
      </p>

      {!isAuthConfigured && <DemoModeNotice className="mt-6" />}

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {avatarPreview && <AvatarImage src={avatarPreview} alt="" />}
            <AvatarFallback className="bg-primary/12 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <Label htmlFor="profile-avatar" className="mb-2 block">
              Avatar image URL{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="profile-avatar"
              type="url"
              inputMode="url"
              placeholder="https://…"
              aria-invalid={Boolean(form.formState.errors.avatarUrl)}
              {...form.register("avatarUrl")}
            />
            <FieldError message={form.formState.errors.avatarUrl?.message} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="profile-first" className="mb-2 block">
              First name
            </Label>
            <Input
              id="profile-first"
              autoComplete="given-name"
              aria-invalid={Boolean(form.formState.errors.firstName)}
              {...form.register("firstName")}
            />
            <FieldError message={form.formState.errors.firstName?.message} />
          </div>
          <div>
            <Label htmlFor="profile-last" className="mb-2 block">
              Last name <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input id="profile-last" autoComplete="family-name" {...form.register("lastName")} />
            <FieldError message={form.formState.errors.lastName?.message} />
          </div>
        </div>

        <div>
          <Label htmlFor="profile-phone" className="mb-2 block">
            Phone <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="profile-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+91 98000 00000"
            aria-invalid={Boolean(form.formState.errors.phone)}
            {...form.register("phone")}
          />
          <FieldError message={form.formState.errors.phone?.message} />
        </div>

        <div>
          <Label htmlFor="profile-email" className="mb-2 block">
            Email
          </Label>
          <Input id="profile-email" value={user?.email ?? ""} readOnly disabled />
          <p className="mt-2 text-xs text-muted-foreground">
            Contact us if you need to change the email on your account.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              form.reset({
                firstName: user?.firstName ?? "",
                lastName: user?.lastName ?? "",
                phone: user?.phone ?? "",
                avatarUrl: user?.avatarUrl ?? "",
              })
            }
          >
            Reset
          </Button>
        </div>
      </form>
    </section>
  );
}
