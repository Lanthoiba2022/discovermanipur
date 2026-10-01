export { useAuth, type UseAuth } from "./use-auth";
export {
  signInWithPassword,
  signUpWithPassword,
  verifyEmailCode,
  resendVerificationCode,
  signOut,
  updateProfile,
  type AuthResult,
  type VerifyResult,
} from "./actions";
export {
  signInSchema,
  signUpSchema,
  verifyEmailSchema,
  profileSchema,
  type SignInValues,
  type SignUpValues,
  type VerifyEmailValues,
  type ProfileValues,
} from "./schemas";
export { isAuthConfigured, isDemoAuth } from "./env";
