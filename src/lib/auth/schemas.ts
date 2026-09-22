import { z } from "zod";

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(60),
    lastName: z.string().max(60).optional().or(z.literal("")),
    email: emailSchema,
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .regex(/[a-z]/i, "Include at least one letter")
      .regex(/\d/, "Include at least one number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const magicLinkSchema = z.object({ email: emailSchema });

export const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(60),
  lastName: z.string().max(60).optional().or(z.literal("")),
  phone: z
    .string()
    .max(20)
    .regex(/^[+\d][\d\s-]{6,}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  avatarUrl: z.string().url("Enter a valid image URL").optional().or(z.literal("")),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type MagicLinkValues = z.infer<typeof magicLinkSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
