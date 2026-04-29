import { cache } from "react";

import { eq } from "drizzle-orm";

import { plan, employerSubscription } from "../auth-schema";
import { db } from "../db";

export type PlanKey = "free" | "pro" | "premium" | "enterprise";

export interface PlanEntitlement {
  planKey: PlanKey;
  planName: string;
  canPublishJobs: boolean;
  canSearchCandidates: boolean;
  canUseBoosts: boolean;
  maxJobDrafts: number;
  maxPublishedJobs: number;
  monthlyCreditGrant: number;
  isPaid: boolean;
  subscriptionActive: boolean;
}

export const FREE_PLAN_DEFAULTS: PlanEntitlement = {
  planKey: "free",
  planName: "Free",
  canPublishJobs: true,
  canSearchCandidates: false,
  canUseBoosts: false,
  maxJobDrafts: 3,
  maxPublishedJobs: 1,
  monthlyCreditGrant: 0,
  isPaid: false,
  subscriptionActive: true, // Free plan is always considered active
};

/**
 * Returns the effective entitlements for an Employer Profile.
 * Falls back to Free plan defaults when no active subscription exists.
 * This is the single source of truth for paid feature access gates.
 */
export const getEmployerEntitlements = cache(
  async (employerProfileId: string): Promise<PlanEntitlement> => {
    const sub = await db.query.employerSubscription.findFirst({
      where: eq(employerSubscription.employerProfileId, employerProfileId),
      with: { plan: true },
    });

    if (sub === undefined) {
      return { ...FREE_PLAN_DEFAULTS };
    }

    const now = new Date();
    const isActive = sub.status === "active" && (sub.expiresAt === null || sub.expiresAt > now);

    if (!isActive) {
      // Expired/cancelled: return free defaults (no paid access, credits remain per #15)
      return { ...FREE_PLAN_DEFAULTS };
    }

    return {
      planKey: sub.plan.key,
      planName: sub.plan.displayName,
      canPublishJobs: sub.plan.canPublishJobs,
      canSearchCandidates: sub.plan.canSearchCandidates,
      canUseBoosts: sub.plan.canUseBoosts,
      maxJobDrafts: sub.plan.maxJobDrafts,
      maxPublishedJobs: sub.plan.maxPublishedJobs,
      monthlyCreditGrant: sub.plan.monthlyCreditGrant,
      isPaid: sub.plan.key !== "free",
      subscriptionActive: true,
    };
  },
);

/**
 * Returns the full plan catalog for display and comparison.
 */
export async function getPlanCatalog() {
  return db.select().from(plan).where(eq(plan.isActive, true)).orderBy(plan.sortOrder);
}
