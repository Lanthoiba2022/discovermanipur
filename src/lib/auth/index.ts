/**
 * Convenience barrel for the client-side auth API.
 *
 * Client components should import from the specific module instead
 * (`@/lib/auth/use-auth`, `@/lib/auth/actions`, `@/lib/auth/env`,
 * `@/lib/auth/schemas`): importing this file pulls ./schemas.ts, and with it
 * classic zod (about 90 KB gzipped), into every bundle that only wanted
 * `useAuth` or `signOut`, because the bundler cannot drop a re-exported
 * module whose evaluation has side effects (`z.object(...)` at module scope).
 */
export { useAuth, type UseAuth } from "./use-auth";
export {
  signInWithPassword,
  signUpWithPassword,
  verifyEmailCode,
  resendVerificationCode,
  requestPasswordReset,
  resetPasswordWithCode,
  signOut,
  updateProfile,
  type AuthResult,
  type ResetResult,
  type VerifyResult,
} from "./actions";
export {
  signInSchema,
  signUpSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  profileSchema,
  type SignInValues,
  type SignUpValues,
  type VerifyEmailValues,
  type ForgotPasswordValues,
  type ResetPasswordValues,
  type ProfileValues,
} from "./schemas";
export { isAuthConfigured, isDemoAuth } from "./env";
