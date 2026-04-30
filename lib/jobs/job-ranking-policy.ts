import "server-only";
import { eq, and, desc, lt, sql } from "drizzle-orm";

import { jobDraft, jobPostingCycle, employerProfile, jobBoost } from "@/lib/auth-schema";
import { db } from "@/lib/db";

/** Return type for the ranked public job listing. */
export interface RankedJobListing {
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
  /** The active boost type, or null for normal (unboosted) jobs. */
  boostType: "featured" | "urgent" | null;
  /** When the active boost expires, if any. */
  boostExpiresAt: Date | null;
}

/**
 * Get all currently-published jobs ranked by boost tier, then by newest first.
 * Urgent > Featured > Normal, then by publishedAt descending.
 *
 * Expired boosts are excluded — only active, non-expired boosts affect ranking.
 */
export async function getRankedPublishedJobs(limit = 50, offset = 0): Promise<RankedJobListing[]> {
  // First expire any stale boosts before querying
  const now = new Date();
  await db
    .update(jobBoost)
    .set({ status: "expired", updatedAt: now })
    .where(and(eq(jobBoost.status, "active"), lt(jobBoost.expiresAt, now)));

  // Query with LEFT JOIN to active boosts
  const results = await db
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
      boostType: jobBoost.boostType,
      boostExpiresAt: jobBoost.expiresAt,
    })
    .from(jobPostingCycle)
    .innerJoin(jobDraft, eq(jobPostingCycle.jobDraftId, jobDraft.id))
    .innerJoin(employerProfile, eq(jobPostingCycle.employerId, employerProfile.id))
    .leftJoin(
      jobBoost,
      and(eq(jobBoost.jobPostingCycleId, jobPostingCycle.id), eq(jobBoost.status, "active")),
    )
    .where(eq(jobPostingCycle.status, "active"))
    .orderBy(
      // Rank by boost tier (urgent=0, featured=1, no boost=2)
      sql`COALESCE(CASE ${jobBoost.boostType} WHEN 'urgent' THEN 0 WHEN 'featured' THEN 1 ELSE 2 END, 2)`,
      desc(jobPostingCycle.publishedAt),
    )
    .limit(limit)
    .offset(offset);

  return results.map((r) => ({
    ...r,
    boostType: r.boostType,
    boostExpiresAt: r.boostExpiresAt,
  }));
}
