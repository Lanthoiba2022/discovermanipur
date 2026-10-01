import Image from "next/image";
import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { safeRedirectPath } from "@/lib/security/redirect";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in or create your Discover Manipur account to book Manipuri homestays, save places and keep your itineraries.",
  alternates: { canonical: "/auth" },
  robots: { index: false, follow: true },
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next);

  return (
    <div className="grid min-h-[100svh] lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 pb-20 pt-28 md:px-10 md:pt-32">
        <AuthForm next={next} />
      </div>

      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src="/file-uploads/112.jpg"
          alt="An ornate blue and white Manipuri temple gateway, framed by tall trees on a quiet Imphal lane"
          fill
          preload
          sizes="50vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-loktak-900/85 via-loktak-900/25 to-transparent"
        />
        <div className="grain absolute inset-0" aria-hidden="true" />
        <blockquote className="absolute inset-x-0 bottom-0 p-12 text-cream-50">
          <p className="font-display text-3xl leading-tight">
            &ldquo;Manipur&rdquo; — <span className="font-mayek">ꯃꯅꯤꯄꯨꯔ</span>, the land of jewels.
          </p>
          <footer className="mt-4 max-w-sm text-sm text-cream-50/80">
            The word we took our name from. Travel that leaves Manipur better looked after than it
            found it.
          </footer>
        </blockquote>
      </div>
    </div>
  );
}
