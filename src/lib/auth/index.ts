export { useAuth, type UseAuth } from "./use-auth";
export {
  signInWithPassword,
  signUpWithPassword,
  signInWithMagicLink,
  signOut,
  updateProfile,
  type AuthResult,
} from "./actions";
export {
  signInSchema,
  signUpSchema,
  magicLinkSchema,
  profileSchema,
  type SignInValues,
  type SignUpValues,
  type MagicLinkValues,
  type ProfileValues,
} from "./schemas";
export { isSupabaseConfigured } from "@/lib/supabase/env";
