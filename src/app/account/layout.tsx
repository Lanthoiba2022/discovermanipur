import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AccountHeader } from "./_components/account-header";
import { AccountNav } from "./_components/account-nav";

export const metadata: Metadata = {
  title: "Your account",
  description: "Your Discover Manipur profile, bookings and saved places.",
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    // `data-clarity-mask`: Clarity session replay blanks the account area
    // (name, email, phone, bookings, saved places) before a recording leaves
    // the browser. Its default masking covers typed input, not rendered text.
    <div data-clarity-mask="true" className="pb-24 pt-28 md:pt-32">
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
