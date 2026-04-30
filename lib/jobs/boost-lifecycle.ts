import "server-only";
import { eq, and, lt } from "drizzle-orm";

import { jobBoost, jobPostingCycle } from "@/lib/auth-schema";
import { deductCredits } from "@/lib/billing/credit-ledger";
import { getEmployerEntitlements } from "@/lib/billing/plan-entitlement-policy";
import { db } from "@/lib/db";

/** Boost tier types. */
export type BoostType = "featured" | "urgent";

/** Cost in NPR minor units for each boost tier. */
export const BOOST_COSTS: Record<BoostType, number> = {
  featured: 300,
  urgent: 600,
};

/** Available boost duration options in days. */
export const BOOST_DURATION_OPTIONS = [3, 7, 14] as const;
export type BoostDurationDays = (typeof BOOST_DURATION_OPTIONS)[number];

export interface PurchaseBoostInput {
  jobPostingCycleId: string;
  employerProfileId: string;
  boostType: BoostType;
  durationDays: BoostDurationDays;
  userId: string;
}

export interface PurchaseBoostResult {
  success: boolean;
  boostId?: string;
  balanceNpr?: number;
  error?: string;
}

/**
 * Purchase a boost for a published job.
 * Validates entitlements, ensures no active boost exists, deducts credits, creates boost.
 */
export async function purchaseBoost(input: PurchaseBoostInput): Promise<PurchaseBoostResult> {
  const { jobPostingCycleId, employerProfileId, boostType, durationDays, userId } = input;

  // 1. Validate duration
  if (!BOOST_DURATION_OPTIONS.includes(durationDays)) {
    return {
      success: false,
      error: `Invalid boost duration. Choose from: ${BOOST_DURATION_OPTIONS.join(", ")} days.`,
    };
  }

  // 2. Check plan entitlements — employer must have canUseBoosts
  const entitlements = await getEmployerEntitlements(employerProfileId);
  if (!entitlements.canUseBoosts) {
    return {
      success: false,
      error: "Your current plan does not allow boosting jobs. Upgrade to a paid plan.",
    };
  }

  // 3. Load the posting cycle and verify ownership + status
  const cycleResults = await db
    .select()
    .from(jobPostingCycle)
    .where(
      and(
        eq(jobPostingCycle.id, jobPostingCycleId),
        eq(jobPostingCycle.employerId, employerProfileId),
      ),
    );

  const cycle = cycleResults.at(0);

  if (cycle === undefined) {
    return { success: false, error: "Job posting cycle not found or you do not own it." };
  }

  if (cycle.status !== "active") {
    return { success: false, error: "Only active (published) jobs can be boosted." };
  }

  // 4. Check if there's already an active boost for this cycle
  const existingBoosts = await db
    .select()
    .from(jobBoost)
    .where(and(eq(jobBoost.jobPostingCycleId, jobPostingCycleId), eq(jobBoost.status, "active")));

  if (existingBoosts.length > 0) {
    return {
      success: false,
      error:
        "This job already has an active boost. Wait for it to expire before applying a new one.",
    };
  }

  // 5. Calculate boost expiry — limited by both boost duration AND cycle expiry
  const cost = BOOST_COSTS[boostType];
  const now = new Date();
  const boostAbsoluteExpiry = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
  // Boost cannot outlive the job posting cycle
  const effectiveExpiresAt =
    boostAbsoluteExpiry < cycle.expiresAt ? boostAbsoluteExpiry : cycle.expiresAt;

  // 6. Transaction: deduct credits + create boost
  const referenceId = `boost_${jobPostingCycleId}_${boostType}_${Date.now()}`;

  try {
    const result = await db.transaction(async (tx) => {
      // Double-check no active boost within transaction (prevent race)
      const concurrentBoost = await tx
        .select({ id: jobBoost.id })
        .from(jobBoost)
        .where(
          and(eq(jobBoost.jobPostingCycleId, jobPostingCycleId), eq(jobBoost.status, "active")),
        )
        .limit(1);

      if (concurrentBoost.length > 0) {
        throw new Error("A boost was already purchased for this job. Please try again.");
      }

      // Deduct credits
      const { balanceNpr } = await deductCredits(tx, {
        employerProfileId,
        amountNpr: -cost,
        referenceId,
        reason: `Boost job (${boostType}) for ${durationDays} days`,
        actorId: userId,
        sourceType: "boost_cost",
      });

      // Create boost record
      const [boost] = await tx
        .insert(jobBoost)
        .values({
          jobPostingCycleId,
          employerId: employerProfileId,
          boostType,
          costNpr: cost,
          durationDays,
          status: "active",
          startsAt: now,
          expiresAt: effectiveExpiresAt,
        })
        .returning();

      return { boostId: boost.id, balanceNpr };
    });

    return { success: true, boostId: result.boostId, balanceNpr: result.balanceNpr };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to purchase boost.";
    return { success: false, error: message };
  }
}

/**
 * Expire boosts that have passed their expiresAt timestamp.
 * Should be called periodically or before ranking queries.
 */
export async function expireBoosts(): Promise<number> {
  const now = new Date();

  const result = await db
    .update(jobBoost)
    .set({ status: "expired", updatedAt: now })
    .where(and(eq(jobBoost.status, "active"), lt(jobBoost.expiresAt, now)))
    .returning({ id: jobBoost.id });

  return result.length;
}

/**
 * Expire boosts for a specific posting cycle (e.g., when cycle expires).
 */
export async function expireBoostsForCycle(cycleId: string): Promise<void> {
  const now = new Date();
  await db
    .update(jobBoost)
    .set({ status: "expired", updatedAt: now })
    .where(and(eq(jobBoost.jobPostingCycleId, cycleId), eq(jobBoost.status, "active")));
}
