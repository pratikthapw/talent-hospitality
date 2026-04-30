import { eq, and, count } from "drizzle-orm";

import { jobDraft } from "@/lib/auth-schema";
import { getEmployerEntitlements } from "@/lib/billing/plan-entitlement-policy";
import { db } from "@/lib/db";
import {
  enforceEmployerVerificationBlock,
  getEmployerByUserId,
} from "@/lib/verification/employer-verification";

/**
 * Ensure the employer is verified and return their profile.
 * Throws if not verified or profile is missing.
 */
export async function requireVerifiedEmployer(userId: string) {
  const blocked = await enforceEmployerVerificationBlock(userId);
  if (blocked) {
    throw new Error(
      "Employer verification required. Your account must be verified before managing jobs.",
    );
  }

  const employer = await getEmployerByUserId(userId);
  if (!employer) {
    throw new Error("Employer profile not found. Complete your employer profile first.");
  }

  return employer;
}

/**
 * Check if employer can create a new draft (respects maxJobDrafts entitlement).
 */
export async function canCreateDraft(
  employerId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const entitlements = await getEmployerEntitlements(employerId);

  const [result] = await db
    .select({ count: count() })
    .from(jobDraft)
    .where(and(eq(jobDraft.employerId, employerId), eq(jobDraft.status, "draft")));

  const currentDraftCount = result.count;

  if (currentDraftCount >= entitlements.maxJobDrafts) {
    return {
      allowed: false,
      reason: `Draft limit reached (${entitlements.maxJobDrafts}). Publish or delete existing drafts first.`,
    };
  }

  return { allowed: true };
}

/**
 * Validate that all required publish-time fields are present for a job draft.
 * Returns an array of field-level errors (empty = valid).
 */
export function validatePublishFields(draft: {
  title: string;
  description: string;
  location: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
}): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];

  if (!draft.title.trim()) {
    errors.push({ field: "title", message: "Job title is required to publish." });
  }
  if (!draft.description.trim()) {
    errors.push({ field: "description", message: "Job description is required to publish." });
  }
  if (!draft.location.trim()) {
    errors.push({ field: "location", message: "Job location is required to publish." });
  }
  if (!draft.employmentType) {
    errors.push({ field: "employmentType", message: "Employment type is required to publish." });
  }
  if (draft.salaryMin !== null && draft.salaryMax !== null && draft.salaryMin > draft.salaryMax) {
    errors.push({
      field: "salaryMax",
      message: "Maximum salary must be greater than minimum salary.",
    });
  }

  return errors;
}
