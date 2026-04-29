"use client";

import { Tick01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface PlanCatalogProps {
  plans: {
    id: string;
    key: string;
    displayName: string;
    description: string | null;
    billingTerms: string[];
    monthlyCreditGrant: number;
    canPublishJobs: boolean;
    canSearchCandidates: boolean;
    canUseBoosts: boolean;
    maxJobDrafts: number;
    maxPublishedJobs: number;
    sortOrder: number;
  }[];
  currentPlanKey: string;
  subscriptionActive: boolean;
}

export function PlanCatalog({ plans, currentPlanKey }: PlanCatalogProps) {
  // Sort plans by sortOrder
  const sortedPlans = [...plans].toSorted((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {sortedPlans.map((plan) => {
        const isCurrentPlan = plan.key === currentPlanKey;

        return (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-lg border bg-card p-6 shadow-sm ${
              isCurrentPlan ? "border-primary ring-1 ring-primary" : "border-border"
            }`}
          >
            {isCurrentPlan && (
              <div className="absolute top-0 right-6 -translate-y-1/2">
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                  Current Plan
                </span>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                {plan.displayName}
              </h3>
              {plan.description !== null && (
                <p className="mt-2 min-h-[40px] text-sm text-muted-foreground">
                  {plan.description}
                </p>
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-baseline text-foreground">
                <span className="text-3xl font-bold tracking-tight">
                  {plan.key === "free" ? "Free" : "Custom"}
                </span>
                {plan.key !== "free" && (
                  <span className="ml-1 text-sm font-medium text-muted-foreground">/ month</span>
                )}
              </div>
            </div>

            <div className="mb-6 flex-grow space-y-4">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start">
                  {plan.canPublishJobs ? (
                    <HugeiconsIcon
                      icon={Tick01Icon}
                      className="mr-2 h-5 w-5 shrink-0 text-green-500"
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      className="mr-2 h-5 w-5 shrink-0 text-muted-foreground"
                    />
                  )}
                  <span
                    className={plan.canPublishJobs ? "text-foreground" : "text-muted-foreground"}
                  >
                    Publish Jobs
                  </span>
                </li>

                <li className="flex items-start">
                  {plan.canSearchCandidates ? (
                    <HugeiconsIcon
                      icon={Tick01Icon}
                      className="mr-2 h-5 w-5 shrink-0 text-green-500"
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      className="mr-2 h-5 w-5 shrink-0 text-muted-foreground"
                    />
                  )}
                  <span
                    className={
                      plan.canSearchCandidates ? "text-foreground" : "text-muted-foreground"
                    }
                  >
                    Candidate Search
                  </span>
                </li>

                <li className="flex items-start">
                  {plan.canUseBoosts ? (
                    <HugeiconsIcon
                      icon={Tick01Icon}
                      className="mr-2 h-5 w-5 shrink-0 text-green-500"
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      className="mr-2 h-5 w-5 shrink-0 text-muted-foreground"
                    />
                  )}
                  <span className={plan.canUseBoosts ? "text-foreground" : "text-muted-foreground"}>
                    Job Boosts
                  </span>
                </li>

                <li className="flex items-start">
                  <HugeiconsIcon
                    icon={Tick01Icon}
                    className="mr-2 h-5 w-5 shrink-0 text-green-500"
                  />
                  <span className="text-foreground">
                    {plan.maxJobDrafts === -1 ? "Unlimited" : plan.maxJobDrafts} Job Drafts
                  </span>
                </li>

                <li className="flex items-start">
                  <HugeiconsIcon
                    icon={Tick01Icon}
                    className="mr-2 h-5 w-5 shrink-0 text-green-500"
                  />
                  <span className="text-foreground">
                    {plan.maxPublishedJobs === -1 ? "Unlimited" : plan.maxPublishedJobs} Published
                    Jobs
                  </span>
                </li>

                <li className="flex items-start">
                  {plan.monthlyCreditGrant > 0 ? (
                    <HugeiconsIcon
                      icon={Tick01Icon}
                      className="mr-2 h-5 w-5 shrink-0 text-green-500"
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      className="mr-2 h-5 w-5 shrink-0 text-muted-foreground"
                    />
                  )}
                  <span
                    className={
                      plan.monthlyCreditGrant > 0 ? "text-foreground" : "text-muted-foreground"
                    }
                  >
                    {plan.monthlyCreditGrant} Monthly Credits
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-auto">
              <button
                disabled={isCurrentPlan || plan.key !== "free"}
                className={`w-full rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  isCurrentPlan
                    ? "cursor-not-allowed bg-muted text-muted-foreground"
                    : plan.key !== "free"
                      ? "cursor-not-allowed bg-primary text-primary-foreground opacity-50"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {isCurrentPlan ? "Current Plan" : "Upgrade"}
              </button>
              {plan.key !== "free" && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Payment integration coming soon
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
