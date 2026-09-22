import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AccountHeader } from "./_components/account-header";
import { AccountNav } from "./_components/account-nav";

export const metadata: Metadata = {
  title: "Your account",
  description: "Your Manipur Tourism profile, bookings and saved places.",
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pb-24 pt-28 md:pt-32">
      <div className="shell max-w-5xl">
        <AuthGuard>
          <AccountHeader />
          <div className="mt-8">
            <AccountNav />
          </div>
          <div className="mt-8">{children}</div>
        </AuthGuard>
      </div>
    </div>
  );
}
