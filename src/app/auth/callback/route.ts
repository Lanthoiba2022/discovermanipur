import { NextResponse, type NextRequest } from "next/server";

/**
 * Magic-link landing. By the time a request reaches this handler, `proxy.ts`
 * has already run Neon Auth's middleware on it, which turns the one-time
 * verifier into a session cookie. All that is left is to forward to `?next=`.
 *
 * Neon Auth reports a bad or expired link with `?error=`; that goes back to
 * the sign-in page. Without Neon Auth configured the demo session is created
 * client-side, so this simply forwards.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
    ? nextParam
    : "/account";

  const error = searchParams.get("error");
  if (error) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error)}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
