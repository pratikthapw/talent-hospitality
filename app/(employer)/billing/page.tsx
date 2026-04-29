import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Tick01Icon, Wallet02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { PlanCatalog } from "@/components/billing/plan-catalog";
import { auth } from "@/lib/auth";
import { getEmployerEntitlements, getPlanCatalog } from "@/lib/billing/plan-entitlement-policy";
import type { PlanEntitlement } from "@/lib/billing/plan-entitlement-policy";
import { getWalletBalance } from "@/lib/billing/wallet-balance";
import { getEmployerByUserId } from "@/lib/verification/employer-verification";

export const metadata = {
  title: "Billing & Plans - Employer - THP",
};

function EntitlementList({ entitlements }: { entitlements: PlanEntitlement }) {
  const items: { label: string; visible: boolean }[] = [
    {
      label: `${entitlements.maxPublishedJobs === -1 ? "Unlimited" : entitlements.maxPublishedJobs} Published Jobs`,
      visible: true,
    },
    {
      label: `${entitlements.maxJobDrafts === -1 ? "Unlimited" : entitlements.maxJobDrafts} Job Drafts`,
      visible: true,
    },
    { label: "Publish Jobs", visible: entitlements.canPublishJobs },
    { label: "Candidate Search", visible: entitlements.canSearchCandidates },
    { label: "Job Boosts", visible: entitlements.canUseBoosts },
  ];

  return (
    <ul className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 md:grid-cols-3">
      {items
        .filter((i) => i.visible)
        .map((item) => (
          <li key={item.label} className="flex items-center text-foreground">
            <HugeiconsIcon icon={Tick01Icon} className="mr-2 h-4 w-4 shrink-0 text-green-500" />
            {item.label}
          </li>
        ))}
    </ul>
  );
}

export default async function BillingPage() {
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
          Please complete your employer profile setup before managing your billing and plans.
        </p>
      </div>
    );
  }

  const [entitlements, plans, walletBalance] = await Promise.all([
    getEmployerEntitlements(employer.id),
    getPlanCatalog(),
    getWalletBalance(employer.id),
  ]);

  const currentPlan = plans.find((p) => p.key === entitlements.planKey) ?? plans[0];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Billing & Plans</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Manage your plan, billing term, and Paid Feature Access.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
          Current Plan Status
        </h2>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="text-2xl font-bold">{currentPlan.displayName} Plan</span>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900 dark:text-green-200">
                Active
              </span>
            </div>
            {currentPlan.description !== null && (
              <p className="text-muted-foreground">{currentPlan.description}</p>
            )}
          </div>

          <div className="min-w-[200px] rounded-md bg-muted p-4">
            <div className="mb-1 text-sm font-medium text-muted-foreground">Credit Wallet</div>
            <div className="text-2xl font-bold">
              NPR{" "}
              {(walletBalance / 100).toLocaleString("en-NP", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            {walletBalance === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Credits are granted when a subscription payment is confirmed
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
          <h3 className="mb-3 font-semibold text-foreground">Included in your plan:</h3>
          <EntitlementList entitlements={entitlements} />
        </div>

        <div className="mt-4 border-t pt-4">
          <Link
            href="/employer/billing/wallet"
            className="inline-flex items-center text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            <HugeiconsIcon icon={Wallet02Icon} className="mr-1.5 h-4 w-4" />
            View Credit Wallet &amp; History
          </Link>
        </div>
      </div>

      <div className="pt-4">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Plan Catalog</h2>
        <PlanCatalog
          plans={plans}
          currentPlanKey={entitlements.planKey}
          subscriptionActive={true}
        />
      </div>
    </div>
  );
}
