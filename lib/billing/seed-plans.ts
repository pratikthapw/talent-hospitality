import type { InferInsertModel } from "drizzle-orm/table";

import { plan } from "../auth-schema";
import { db } from "../db";

type PlanInsert = InferInsertModel<typeof plan>;

const PLANS: PlanInsert[] = [
  {
    id: "plan_free",
    key: "free",
    displayName: "Free",
    description: "Start hiring with basic features at no cost.",
    billingTerms: ["monthly"],
    monthlyCreditGrant: 0,
    canPublishJobs: true,
    canSearchCandidates: false,
    canUseBoosts: false,
    maxJobDrafts: 3,
    maxPublishedJobs: 1,
    sortOrder: 0,
  },
  {
    id: "plan_pro",
    key: "pro",
    displayName: "Pro",
    description: "More job slots, candidate search, and monthly credits for growing teams.",
    billingTerms: ["monthly", "yearly"],
    monthlyCreditGrant: 10,
    canPublishJobs: true,
    canSearchCandidates: true,
    canUseBoosts: true,
    maxJobDrafts: 10,
    maxPublishedJobs: 5,
    sortOrder: 1,
  },
  {
    id: "plan_premium",
    key: "premium",
    displayName: "Premium",
    description: "Higher limits, more credits, and priority features for active hiring.",
    billingTerms: ["monthly", "yearly"],
    monthlyCreditGrant: 30,
    canPublishJobs: true,
    canSearchCandidates: true,
    canUseBoosts: true,
    maxJobDrafts: 30,
    maxPublishedJobs: 15,
    sortOrder: 2,
  },
  {
    id: "plan_enterprise",
    key: "enterprise",
    displayName: "Enterprise",
    description:
      "Custom limits, dedicated support, and operational onboarding for large organizations.",
    billingTerms: ["yearly"],
    monthlyCreditGrant: 100,
    canPublishJobs: true,
    canSearchCandidates: true,
    canUseBoosts: true,
    maxJobDrafts: 100,
    maxPublishedJobs: 50,
    sortOrder: 3,
  },
];

export async function seedPlans() {
  await db.insert(plan).values(PLANS).onConflictDoNothing();
}
