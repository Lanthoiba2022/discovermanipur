"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { submitContactForm } from "./actions";
import { contactSchema, ENQUIRY_TYPES, type ContactInput } from "./schema";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-sm text-destructive">
      {message}
    </p>
  );
}

export function ContactForm() {
  const [sent, setSent] = React.useState(false);
  // Bot traps checked by `submitContactForm`: a hidden field only bots fill,
  // and when the form appeared, since nobody writes an enquiry in seconds.
  const [website, setWebsite] = React.useState("");
  const [startedAt] = React.useState(() => Date.now());

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      enquiryType: "trip",
      subject: "",
      message: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await submitContactForm({ ...values, website, startedAt });

    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          setError(field as keyof ContactInput, { type: "server", message });
        }
      }
      toast.error(result.message);
      return;
    }

    toast.success("Thanks for writing.", { description: result.message });
    setSent(true);
    reset();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-6">
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-name">Your name</Label>
          <Input
            id="contact-name"
            autoComplete="name"
            placeholder="Thoibi Devi"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            className={cn("mt-2", errors.name && "border-destructive")}
            {...register("name")}
          />
          <FieldError id="contact-name-error" message={errors.name?.message} />
        </div>

        <div>
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            className={cn("mt-2", errors.email && "border-destructive")}
            {...register("email")}
          />
          <FieldError id="contact-email-error" message={errors.email?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="contact-enquiry">What is this about?</Label>
        <Controller
          control={control}
          name="enquiryType"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="contact-enquiry"
                className="mt-2"
                aria-invalid={Boolean(errors.enquiryType)}
                aria-describedby={errors.enquiryType ? "contact-enquiry-error" : undefined}
              >
                <SelectValue placeholder="Choose one" />
              </SelectTrigger>
              <SelectContent>
                {ENQUIRY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError id="contact-enquiry-error" message={errors.enquiryType?.message} />
      </div>

      <div>
        <Label htmlFor="contact-subject">Subject</Label>
        <Input
          id="contact-subject"
          placeholder="Four days in November, two people, no car"
          aria-invalid={Boolean(errors.subject)}
          aria-describedby={errors.subject ? "contact-subject-error" : undefined}
          className={cn("mt-2", errors.subject && "border-destructive")}
          {...register("subject")}
        />
        <FieldError id="contact-subject-error" message={errors.subject?.message} />
      </div>

      <div>
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          rows={7}
          placeholder="Tell us your dates, who is travelling, and what you are hoping the trip feels like."
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : "contact-message-hint"}
          className={cn("mt-2 min-h-40", errors.message && "border-destructive")}
          {...register("message")}
        />
        {errors.message ? (
          <FieldError id="contact-message-error" message={errors.message.message} />
        ) : (
          <p id="contact-message-hint" className="mt-2 text-sm text-muted-foreground">
            Twenty characters or more. Detail helps — dates, districts, mobility needs, dietary
            needs.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Sending
            </>
          ) : (
            <>
              <Send aria-hidden="true" />
              Send message
            </>
          )}
        </Button>
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {sent
            ? "Done. You can send another if you missed something."
            : "Not delivered to an inbox yet — see the note below."}
        </p>
      </div>
    </form>
  );
}
