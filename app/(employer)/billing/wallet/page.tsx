import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Wallet02Icon, ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { auth } from "@/lib/auth";
import { getSubscriptionGrantHistory } from "@/lib/billing/credit-ledger";
import { getWalletBalance } from "@/lib/billing/wallet-balance";
import { getEmployerByUserId } from "@/lib/verification/employer-verification";

export const metadata = {
  title: "Credit Wallet - Employer - THP",
};

/** Formats NPR minor units (paisa) to a readable NPR display string. */
function formatNprBalance(balanceNpr: number): string {
  return `NPR ${(balanceNpr / 100).toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const SOURCE_LABELS: Record<string, string> = {
  subscription_grant: "Subscription Grant",
  signup_grant: "Signup Grant",
  yearly_monthly_grant: "Yearly Monthly Grant",
  top_up_purchase: "Top-up Purchase",
  admin_adjustment: "Admin Adjustment",
  admin_refund: "Admin Refund",
};

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

  const [balance, grantHistory] = await Promise.all([
    getWalletBalance(employer.id),
    getSubscriptionGrantHistory(employer.id),
  ]);

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
          Your shared Credit Wallet balance and subscription-grant history.
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

      {/* Subscription Grant History */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
          Subscription Grant History
        </h2>

        {grantHistory.length === 0 ? (
          <div className="py-8 text-center">
            <HugeiconsIcon
              icon={Wallet02Icon}
              className="mx-auto mb-3 h-8 w-8 text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground">No subscription grants yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Credits are granted when a subscription payment is confirmed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pr-4 pb-3 font-medium text-muted-foreground">Date</th>
                  <th className="pr-4 pb-3 font-medium text-muted-foreground">Type</th>
                  <th className="pr-4 pb-3 font-medium text-muted-foreground">Reason</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {grantHistory.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString("en-NP", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                        {SOURCE_LABELS[entry.sourceType] ?? entry.sourceType}
                      </span>
                    </td>
                    <td className="max-w-[300px] truncate py-3 pr-4 text-foreground">
                      {entry.reason}
                    </td>
                    <td className="py-3 text-right font-medium text-green-600">
                      +{formatNprBalance(entry.amountNpr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {grantHistory.length > 0 && (
          <p className="mt-4 text-xs text-muted-foreground">
            Showing last {grantHistory.length} subscription grant
            {grantHistory.length === 1 ? "" : "s"}. Full ledger history includes all credit
            additions and deductions.
          </p>
        )}
      </div>
    </div>
  );
}
