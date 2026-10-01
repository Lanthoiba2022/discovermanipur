import { z } from "zod";

import { isAllowedSignupEmail, SIGNUP_DOMAIN_MESSAGE } from "./email-policy";

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .max(254, "That email address is too long")
  .email("Enter a valid email address");

/** Long enough for any passphrase; short enough that hashing it stays cheap. */
const MAX_PASSWORD = 128;

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(MAX_PASSWORD, "That password is too long"),
});

/** The rules for a password someone chooses: at sign-up and when resetting it. */
const newPasswordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(MAX_PASSWORD, `Use at most ${MAX_PASSWORD} characters`)
  .regex(/[a-z]/i, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

/** A 6-digit code Neon Auth emails: for verification and for password reset. */
const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code from the email");

export const signUpSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(60),
    lastName: z.string().max(60).optional().or(z.literal("")),
    email: emailSchema.refine(isAllowedSignupEmail, SIGNUP_DOMAIN_MESSAGE),
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

/** The 6-digit code Neon Auth emails for verification. */
export const verifyEmailSchema = z.object({ otp: otpSchema });

/** Step one of a password reset: where to send the code. */
export const forgotPasswordSchema = z.object({ email: emailSchema });

/** Step two: the emailed code and the new password, typed twice. */
export const resetPasswordSchema = z
  .object({
    otp: otpSchema,
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(60),
  lastName: z.string().max(60).optional().or(z.literal("")),
  phone: z
    .string()
    .max(20)
    .regex(/^[+\d][\d\s-]{6,}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  // https only: the URL is rendered as an <img src>, and anything else is
  // either mixed content or a scheme (javascript:, data:) with no business
  // being in a profile.
  avatarUrl: z
    .string()
    .trim()
    .max(2048, "That link is too long")
    .url("Enter a valid image URL")
    .refine((v) => /^https:\/\//i.test(v), "Use an https:// image link")
    .optional()
    .or(z.literal("")),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type VerifyEmailValues = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
