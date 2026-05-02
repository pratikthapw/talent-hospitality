import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Wallet02Icon, ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { WalletHistory } from "@/components/billing/wallet-history";
import { auth } from "@/lib/auth";
import { getWalletBalance } from "@/lib/billing/wallet-balance";
import { getEmployerByUserId } from "@/lib/verification/employer-verification";

export const metadata = {
  title: "Credit Wallet - Employer - THP",
};

/** Formats NPR minor units (paisa) to a readable NPR display string. */
function formatNprBalance(balanceNpr: number): string {
  return `NPR ${(balanceNpr / 100).toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function WalletPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session === null) {
    redirect("/sign-in");
  }

  const employer = await getEmployerByUserId(session.user.id);
  if (employer === null) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-foreground">
          Complete Onboarding
        </h1>
        <p className="text-muted-foreground">
          Please complete your employer profile setup before viewing your Credit Wallet.
        </p>
      </div>
    );
  }

  const balance = await getWalletBalance(employer.id);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/employer/billing"
        className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} className="mr-1.5 h-4 w-4" />
        Back to Billing &amp; Plans
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Credit Wallet</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your shared Credit Wallet balance and full transaction history.
        </p>
      </div>

      {/* Balance Card */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <HugeiconsIcon icon={Wallet02Icon} className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Current Balance</div>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {formatNprBalance(balance)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Shared Credit Wallet — usable across job publishing, Candidate Unlocks, and Boosts
            </div>
          </div>
        </div>
      </div>

      {/* Wallet History */}
      <WalletHistory employerProfileId={employer.id} />
    </div>
  );
}
