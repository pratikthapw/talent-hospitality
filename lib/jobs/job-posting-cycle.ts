import "server-only";
import { eq, and, desc, count } from "drizzle-orm";

import { jobDraft, jobPostingCycle, employerProfile } from "@/lib/auth-schema";
import { deductCredits } from "@/lib/billing/credit-ledger";
import { getEmployerEntitlements } from "@/lib/billing/plan-entitlement-policy";
import { db } from "@/lib/db";
import { validatePublishFields } from "@/lib/jobs/job-publication-policy";

/** Cost in NPR minor units to publish one job. */
export const PUBLISH_COST_NPR = 500;

/** Available job duration options in days. */
export const JOB_DURATION_OPTIONS = [7, 14, 30] as const;
export type JobDurationDays = (typeof JOB_DURATION_OPTIONS)[number];

export interface PublishJobInput {
  jobDraftId: string;
  employerProfileId: string;
  durationDays: JobDurationDays;
  userId: string;
}

export interface PublishJobResult {
  success: boolean;
  cycleId?: string;
  balanceNpr?: number;
  error?: string;
}

/**
 * Publish a draft job: validates entitlements, deducts credits, creates a posting cycle.
 * Returns the cycle ID and new wallet balance on success.
 */
export async function publishDraftJob(input: PublishJobInput): Promise<PublishJobResult> {
  const { jobDraftId, employerProfileId, durationDays, userId } = input;

  // 1. Validate duration
  if (!JOB_DURATION_OPTIONS.includes(durationDays)) {
    return {
      success: false,
      error: `Invalid duration. Choose from: ${JOB_DURATION_OPTIONS.join(", ")} days.`,
    };
  }

  // 2. Load the draft and verify ownership + status
  const draftResults = await db
    .select()
    .from(jobDraft)
    .where(and(eq(jobDraft.id, jobDraftId), eq(jobDraft.employerId, employerProfileId)));

  const draft = draftResults.at(0);

  if (draft === undefined) {
    return { success: false, error: "Job draft not found or you do not own it." };
  }

  if (draft.status !== "draft") {
    return { success: false, error: "Only draft jobs can be published." };
  }

  // 3. Validate publish fields
  const fieldErrors = validatePublishFields(draft);
  if (fieldErrors.length > 0) {
    const messages = fieldErrors.map((e) => `${e.field}: ${e.message}`).join("; ");
    return { success: false, error: `Missing required fields: ${messages}` };
  }

  // 4. Check entitlements
  const entitlements = await getEmployerEntitlements(employerProfileId);
  if (!entitlements.canPublishJobs) {
    return { success: false, error: "Your current plan does not allow publishing jobs." };
  }

  // 5. Transaction: check limit atomically, deduct credits, create cycle, update draft
  const referenceId = `publish_${jobDraftId}_${Date.now()}`;

  try {
    const result = await db.transaction(async (tx) => {
      // 5a. Count active Job Posting Cycles inside transaction (prevents TOCTOU race)
      const [activeCount] = await tx
        .select({ count: count() })
        .from(jobPostingCycle)
        .where(
          and(
            eq(jobPostingCycle.employerId, employerProfileId),
            eq(jobPostingCycle.status, "active"),
          ),
        );

      if (activeCount.count >= entitlements.maxPublishedJobs) {
        throw new Error(
          `Published job limit reached (${entitlements.maxPublishedJobs}). Close or wait for existing jobs to expire.`,
        );
      }

      // 5b. Deduct credits from Credit Ledger
      const { balanceNpr } = await deductCredits(tx, {
        employerProfileId,
        amountNpr: -PUBLISH_COST_NPR,
        referenceId,
        reason: `Publish job: ${draft.title} (${durationDays} days)`,
        actorId: userId,
      });

      // 5c. Calculate timestamps
      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // 5d. Create Job Posting Cycle
      const [cycle] = await tx
        .insert(jobPostingCycle)
        .values({
          jobDraftId,
          employerId: employerProfileId,
          durationDays,
          costNpr: PUBLISH_COST_NPR,
          status: "active",
          publishedAt: now,
          expiresAt,
        })
        .returning();

      // 5e. Update draft status
      await tx
        .update(jobDraft)
        .set({ status: "published", publishedAt: now, expiresAt, updatedAt: now })
        .where(eq(jobDraft.id, jobDraftId));

      return { cycleId: cycle.id, balanceNpr };
    });

    return { success: true, cycleId: result.cycleId, balanceNpr: result.balanceNpr };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to publish job.";
    return { success: false, error: message };
  }
}

/** Return type for public job listing. */
export interface PublishedJobListing {
  id: string;
  title: string;
  description: string;
  location: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
  companyName: string;
  publishedAt: Date;
  expiresAt: Date;
  durationDays: number;
}

/**
 * Get all currently-published jobs for the public listing.
 * Only returns jobs with an active posting cycle that hasn't expired.
 */
export async function getPublishedJobs(limit = 50, offset = 0): Promise<PublishedJobListing[]> {
  return db
    .select({
      id: jobDraft.id,
      title: jobDraft.title,
      description: jobDraft.description,
      location: jobDraft.location,
      employmentType: jobDraft.employmentType,
      salaryMin: jobDraft.salaryMin,
      salaryMax: jobDraft.salaryMax,
      salaryCurrency: jobDraft.salaryCurrency,
      salaryPeriod: jobDraft.salaryPeriod,
      companyName: employerProfile.companyName,
      publishedAt: jobPostingCycle.publishedAt,
      expiresAt: jobPostingCycle.expiresAt,
      durationDays: jobPostingCycle.durationDays,
    })
    .from(jobPostingCycle)
    .innerJoin(jobDraft, eq(jobPostingCycle.jobDraftId, jobDraft.id))
    .innerJoin(employerProfile, eq(jobPostingCycle.employerId, employerProfile.id))
    .where(eq(jobPostingCycle.status, "active"))
    .orderBy(desc(jobPostingCycle.publishedAt))
    .limit(limit)
    .offset(offset);
}
